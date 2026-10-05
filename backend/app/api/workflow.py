"""Contribute → AI analysis → review → approve → publish workflow."""
from __future__ import annotations

import csv
import io
import json
import re
import shutil
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import MAX_UPLOAD_MB, UPLOAD_DIR
from ..database import db
from ..database.seed_data import REGION_DEFAULT_IMAGE
from ..services import get_ai, get_index
from ..schemas import AnalyzeRequest, ReviewDecision, SubmissionCreate
from .deps import require_admin, require_user

router = APIRouter(prefix="/api", tags=["workflow"])

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXT = {".mp4", ".webm", ".mov"}


def _safe_name(name: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(name).name)[:120]
    return name or "upload.bin"


def _human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} GB"


def _extract_text(path: Path) -> tuple[str, str]:
    """Return (text, method) for AI analysis. Best-effort and size-limited."""
    ext = path.suffix.lower()
    try:
        if ext == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            pages = [p.extract_text() or "" for p in reader.pages[:12]]
            return " ".join(pages)[:40000], f"PDF text extraction ({min(len(reader.pages), 12)} of {len(reader.pages)} pages)"
        if ext in (".txt", ".md"):
            return path.read_text(encoding="utf-8", errors="ignore")[:40000], "Plain text"
        if ext == ".csv":
            raw = path.read_text(encoding="utf-8", errors="ignore")[:200000]
            rows = list(csv.reader(io.StringIO(raw)))
            header = rows[0] if rows else []
            n = len(rows) - 1
            text = f"Tabular dataset with {len(header)} columns and at least {n} rows. Columns: {', '.join(header[:40])}. "
            text += "Dataset measurements time series records. "
            return text, f"CSV header analysis ({len(header)} columns)"
        if ext == ".json":
            return path.read_text(encoding="utf-8", errors="ignore")[:20000], "JSON text"
    except Exception as exc:  # corrupted or encrypted files
        return "", f"Text extraction failed ({type(exc).__name__})"
    if ext in IMAGE_EXT:
        return "", "Image file – analysis uses metadata only"
    if ext in VIDEO_EXT:
        return "", "Video file – analysis uses metadata only"
    return "", "Binary file – analysis uses metadata only"


def _upload_info(upload_id: str) -> dict[str, Any] | None:
    folder = UPLOAD_DIR / "tmp" / upload_id
    meta = folder / "meta.json"
    if not meta.exists():
        return None
    return json.loads(meta.read_text(encoding="utf-8"))


# ── Upload (step 1) ─────────────────────────────────────────
@router.post("/uploads")
async def upload_file(file: UploadFile = File(...), user=Depends(require_user)):
    upload_id = uuid.uuid4().hex[:12]
    folder = UPLOAD_DIR / "tmp" / upload_id
    folder.mkdir(parents=True, exist_ok=True)
    name = _safe_name(file.filename or "upload.bin")
    dest = folder / name
    size = 0
    with dest.open("wb") as fh:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_MB * 1024 * 1024:
                fh.close()
                shutil.rmtree(folder, ignore_errors=True)
                raise HTTPException(413, f"File exceeds {MAX_UPLOAD_MB} MB prototype limit")
            fh.write(chunk)
    text, method = _extract_text(dest)
    (folder / "text.txt").write_text(text, encoding="utf-8")
    info = {"upload_id": upload_id, "file_name": name, "size": size, "size_label": _human_size(size), "extension": dest.suffix.lower(),
            "content_type": file.content_type, "extracted_characters": len(text), "extraction": method, "user_id": user["id"]}
    (folder / "meta.json").write_text(json.dumps(info), encoding="utf-8")
    return info


# ── AI analysis (step 2) ────────────────────────────────────
@router.post("/ai/analyze")
def analyze(body: AnalyzeRequest, user=Depends(require_user)):
    meta = body.meta.model_dump()
    if not (meta.get("title") or "").strip() and not body.upload_id:
        raise HTTPException(422, "Provide a title or upload a file to analyse")
    text, filename, extraction = "", None, "Metadata only"
    if body.upload_id:
        info = _upload_info(body.upload_id)
        if not info:
            raise HTTPException(404, "Upload not found")
        filename = info["file_name"]
        extraction = info["extraction"]
        tfile = UPLOAD_DIR / "tmp" / body.upload_id / "text.txt"
        text = tfile.read_text(encoding="utf-8") if tfile.exists() else ""
        if not meta.get("title"):
            meta["title"] = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    result = get_ai().analyze(meta, file_text=text, filename=filename)
    result["extraction"] = extraction
    return result


@router.get("/ai/status")
def ai_status():
    idx = get_index()
    return {"embeddings": idx.provider.model_label, "provider": idx.provider.name, "indexed_documents": len(idx.docs),
            "capabilities": ["summarize", "generate_tags", "classify_content", "create_embedding", "search_insight"],
            "human_review_required": True}


# ── Submissions (step 3) ────────────────────────────────────
@router.post("/submissions")
def create_submission(body: SubmissionCreate, user=Depends(require_user)):
    m = body.meta
    if not m.title.strip():
        raise HTTPException(422, "Title is required")
    content_id = f"c-{uuid.uuid4().hex[:10]}"
    file_url = file_name = file_size = file_format = None
    thumbnail = REGION_DEFAULT_IMAGE.get(m.region or "", REGION_DEFAULT_IMAGE["Antarctica"])
    if body.upload_id:
        info = _upload_info(body.upload_id)
        if not info:
            raise HTTPException(404, "Upload not found")
        src = UPLOAD_DIR / "tmp" / body.upload_id / info["file_name"]
        dest_dir = UPLOAD_DIR / content_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), dest_dir / info["file_name"])
        shutil.rmtree(UPLOAD_DIR / "tmp" / body.upload_id, ignore_errors=True)
        file_url = f"/files/{content_id}/{info['file_name']}"
        file_name, file_size = info["file_name"], info["size_label"]
        file_format = info["extension"].lstrip(".").upper() or None
        if info["extension"] in IMAGE_EXT:
            thumbnail = file_url
    now = db.now_iso()
    status = "draft" if body.as_draft else "under_review"
    extra: dict[str, Any] = {}
    if m.content_type == "video" and file_url and (file_name or "").lower().endswith(tuple(VIDEO_EXT)):
        extra["video_url"] = file_url
    db.insert("content", {
        "id": content_id, "title": m.title.strip(), "description": m.description, "abstract": m.abstract, "content_type": m.content_type,
        "region": m.region, "research_area": m.research_area, "author": m.author or user["name"], "organization": m.organization or user.get("organization"),
        "year": m.year, "status": status, "tags": body.tags, "keywords": m.keywords, "thumbnail": thumbnail, "file_url": file_url,
        "file_name": file_name, "file_size": file_size, "file_format": file_format, "license": m.license, "access_level": m.access_level,
        "location_ids": m.location_ids, "related_ids": [], "extra": extra, "ai_summary": body.ai_summary, "views": 0, "downloads": 0,
        "citations": 0, "submitted_by": user["id"], "created_at": now, "updated_at": now, "published_at": None,
    })
    sub_id = None
    if not body.as_draft:
        sub_id = f"sub-{content_id}"
        analysis = body.ai_analysis
        if not analysis:  # contributor skipped the AI step: analyse now so reviewers still get assistance
            analysis = get_ai().analyze(m.model_dump(), exclude_id=content_id)
        db.insert("submissions", {"id": sub_id, "content_id": content_id, "submitted_by": user["id"], "submitted_at": now,
                                  "status": "pending", "ai_analysis": analysis, "notes": body.notes, "updated_at": now})
    return {"content_id": content_id, "submission_id": sub_id, "status": status}


def _submission_rows(where: str, params: list[Any]) -> list[dict[str, Any]]:
    rows = db.fetch_all(
        f"""SELECT s.id AS submission_id, s.status AS submission_status, s.submitted_at, s.notes, s.ai_analysis,
                   u.name AS submitter_name, u.organization AS submitter_org, c.*
            FROM submissions s JOIN content c ON c.id = s.content_id JOIN users u ON u.id = s.submitted_by
            WHERE {where} ORDER BY s.submitted_at DESC""", params)
    for r in rows:
        rv = db.fetch_one("SELECT r.decision, r.comments, r.created_at, u.name AS reviewer FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.submission_id = ? ORDER BY r.created_at DESC", [r["submission_id"]])
        r["last_review"] = rv
    return rows


@router.get("/submissions")
def list_submissions(user=Depends(require_user)):
    """Contributor view: own content in every state (drafts included)."""
    rows = db.fetch_all("SELECT * FROM content WHERE submitted_by = ? ORDER BY updated_at DESC", [user["id"]])
    subs = {s["content_id"]: s for s in _submission_rows("s.submitted_by = ?", [user["id"]])}
    for r in rows:
        s = subs.get(r["id"])
        r["submission_id"] = s["submission_id"] if s else None
        r["submitted_at"] = s["submitted_at"] if s else None
        r["last_review"] = s["last_review"] if s else None
    return rows


@router.get("/reviews/queue")
def review_queue(status: str = "pending", admin=Depends(require_admin)):
    if status not in ("pending", "approved", "rejected", "changes_requested", "all"):
        raise HTTPException(422, "Unknown status")
    if status == "all":
        rows = _submission_rows("1=1", [])
    else:
        rows = _submission_rows("s.status = ?", [status])
    counts = {r["status"]: r["n"] for r in db.fetch_all("SELECT status, COUNT(*) AS n FROM submissions GROUP BY status")}
    counts["published"] = db.fetch_one("SELECT COUNT(*) AS n FROM content WHERE status='published'")["n"]
    return {"items": rows, "counts": counts}


@router.post("/reviews/{submission_id}/reanalyze")
def reanalyze(submission_id: str, admin=Depends(require_admin)):
    s = db.fetch_one("SELECT * FROM submissions WHERE id = ?", [submission_id])
    if not s:
        raise HTTPException(404, "Submission not found")
    c = db.fetch_one("SELECT * FROM content WHERE id = ?", [s["content_id"]])
    text = ""
    url = c.get("file_url") or ""
    if url.startswith("/files/"):
        p = UPLOAD_DIR / url[len("/files/"):]
        if p.exists():
            text, _ = _extract_text(p)
    analysis = get_ai().analyze(c, file_text=text, filename=c.get("file_name"), exclude_id=c["id"])
    db.update("submissions", "id", submission_id, {"ai_analysis": analysis, "updated_at": db.now_iso()})
    return analysis


@router.post("/reviews/{submission_id}")
def decide(submission_id: str, body: ReviewDecision, admin=Depends(require_admin)):
    s = db.fetch_one("SELECT * FROM submissions WHERE id = ?", [submission_id])
    if not s:
        raise HTTPException(404, "Submission not found")
    if s["status"] != "pending":
        raise HTTPException(409, f"Submission already {s['status']}")
    now = db.now_iso()
    edits = body.edits.model_dump(exclude_none=True) if body.edits else {}
    content_update: dict[str, Any] = {"updated_at": now}
    for field in ("title", "tags", "ai_summary", "region", "research_area", "content_type", "location_ids"):
        if field in edits:
            content_update[field] = edits[field]
    if body.decision == "approved":
        content_update.update({"status": "published", "published_at": now})
    else:
        content_update["status"] = body.decision
    db.update("content", "id", s["content_id"], content_update)
    db.update("submissions", "id", submission_id, {"status": body.decision, "updated_at": now})
    db.insert("reviews", {"id": f"rev-{uuid.uuid4().hex[:10]}", "submission_id": submission_id, "reviewer_id": admin["id"],
                          "decision": body.decision, "comments": body.comments, "edits": edits or None, "created_at": now})
    indexed = False
    if body.decision == "approved":
        get_index().rebuild()  # publish → immediately discoverable in search
        indexed = s["content_id"] in get_index().by_id
    return {"ok": True, "content_id": s["content_id"], "status": content_update["status"], "indexed": indexed,
            "index_size": len(get_index().docs)}
