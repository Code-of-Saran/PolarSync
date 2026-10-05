"""Content, repository, media, expedition, education and location endpoints."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse

from ..config import UPLOAD_DIR
from ..database import db
from ..services import get_index
from ..services.search_service import GROUPS, card
from ..schemas import EventIn
from .deps import current_user, log_event

router = APIRouter(prefix="/api", tags=["content"])

REPOSITORY_TYPES = ("paper", "dataset", "report")
MEDIA_TYPES = ("photo", "video", "press_release")
EDUCATION_TYPES = ("story", "tour", "quiz", "kit")


def _locations_by_id() -> dict[str, dict[str, Any]]:
    return {l["id"]: l for l in db.fetch_all("SELECT * FROM locations")}


def _published(types: tuple[str, ...] | None = None) -> list[dict[str, Any]]:
    if types:
        qs = ",".join("?" for _ in types)
        return db.fetch_all(f"SELECT * FROM content WHERE status = 'published' AND content_type IN ({qs})", list(types))
    return db.fetch_all("SELECT * FROM content WHERE status = 'published'")


def _sort(items: list[dict[str, Any]], sort: str) -> list[dict[str, Any]]:
    if sort == "popular":
        return sorted(items, key=lambda d: -(d.get("views") or 0))
    if sort == "title":
        return sorted(items, key=lambda d: d["title"].lower())
    return sorted(items, key=lambda d: (d.get("published_at") or d.get("created_at") or ""), reverse=True)


def _facets(items: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    f = {"content_type": Counter(), "region": Counter(), "research_area": Counter(), "year": Counter()}
    topics: Counter = Counter()
    for d in items:
        f["content_type"][d["content_type"]] += 1
        f["region"][d.get("region") or "—"] += 1
        f["research_area"][d.get("research_area") or "—"] += 1
        f["year"][str(d.get("year"))] += 1
        topics.update(d.get("tags") or [])
    out = {k: dict(v.most_common()) for k, v in f.items()}
    out["topic"] = dict(topics.most_common(16))
    return out


# ── Repository ───────────────────────────────────────────────
@router.get("/repository")
def repository(
    content_type: str | None = None, region: str | None = None, research_area: str | None = None,
    year: str | None = None, topic: str | None = None, q: str | None = None, sort: str = "recent",
):
    items = _published(REPOSITORY_TYPES)
    facets = _facets(items)
    if content_type:
        items = [d for d in items if d["content_type"] in content_type.split(",")]
    if region:
        items = [d for d in items if d.get("region") in region.split(",")]
    if research_area:
        items = [d for d in items if d.get("research_area") in research_area.split(",")]
    if year:
        items = [d for d in items if str(d.get("year")) in year.split(",")]
    if topic:
        items = [d for d in items if topic in (d.get("tags") or [])]
    if q:
        # Repository quick-filter uses the hybrid index so it also matches by meaning
        hits = get_index().search(q, filters={}, limit=200, with_trace=False)
        rank = {r["id"]: r["relevance"] for r in hits["results"]}
        items = [dict(d, relevance=rank[d["id"]]) for d in items if d["id"] in rank]
        items.sort(key=lambda d: -d["relevance"])
    else:
        items = _sort(items, sort)
    return {"total": len(items), "items": [card(d) | ({"relevance": d["relevance"]} if "relevance" in d else {}) for d in items], "facets": facets}


# ── Single content record ────────────────────────────────────
@router.get("/content/{content_id}")
def get_content(content_id: str, track: bool = False, user=Depends(current_user)):
    d = db.fetch_one("SELECT * FROM content WHERE id = ?", [content_id])
    if not d:
        raise HTTPException(404, "Content not found")
    if d["status"] != "published":
        if not user or (user["role"] != "admin" and d.get("submitted_by") != user["id"]):
            raise HTTPException(404, "Content not found")
    if track and d["status"] == "published":
        db.execute("UPDATE content SET views = views + 1 WHERE id = ?", [content_id])
        log_event("view", content_id)
        d["views"] = (d.get("views") or 0) + 1
    locs = _locations_by_id()
    d["locations"] = [locs[i] for i in d.get("location_ids") or [] if i in locs]
    d["related"] = get_index().related(content_id, k=6) if d["status"] == "published" else []
    sub = db.fetch_one("SELECT s.*, u.name AS submitter_name FROM submissions s JOIN users u ON u.id = s.submitted_by WHERE s.content_id = ?", [content_id])
    if sub:
        review = db.fetch_one("SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.submission_id = ? ORDER BY r.created_at DESC", [sub["id"]])
        d["provenance"] = {
            "submitted_by": sub["submitter_name"], "submitted_at": sub["submitted_at"], "status": sub["status"],
            "reviewed_by": review["reviewer_name"] if review else None, "reviewed_at": review["created_at"] if review else None,
            "review_comment": review["comments"] if review else None,
            "ai_assisted": bool(sub.get("ai_analysis")),
        }
    d.pop("submitted_by", None)
    return d


@router.get("/content/{content_id}/related")
def related(content_id: str, k: int = 6):
    return get_index().related(content_id, k=k)


@router.get("/content/{content_id}/download")
def download(content_id: str):
    d = db.fetch_one("SELECT * FROM content WHERE id = ? AND status = 'published'", [content_id])
    if not d:
        raise HTTPException(404, "Content not found")
    db.execute("UPDATE content SET downloads = downloads + 1 WHERE id = ?", [content_id])
    log_event("download", content_id)
    url = d.get("file_url") or ""
    if url.startswith("/files/"):
        path = UPLOAD_DIR / url[len("/files/"):]
        if path.exists():
            return FileResponse(path, filename=d.get("file_name") or path.name)
    # Seeded sample records have no binary file: return a metadata record instead
    meta = {k: d.get(k) for k in ("id", "title", "content_type", "author", "organization", "year", "region", "research_area",
                                  "description", "abstract", "tags", "keywords", "license", "file_format", "file_size")}
    meta["note"] = "PolarSync prototype: this sample record has no attached binary file. This file contains its catalogue metadata."
    body = json.dumps(meta, indent=2, ensure_ascii=False)
    return PlainTextResponse(body, media_type="application/json",
                             headers={"Content-Disposition": f'attachment; filename="{content_id}-metadata.json"'})


@router.get("/content/{content_id}/citation")
def citation(content_id: str):
    d = db.fetch_one("SELECT * FROM content WHERE id = ?", [content_id])
    if not d:
        raise HTTPException(404, "Content not found")
    kind = {"paper": "Research paper", "dataset": "Dataset", "report": "Report"}.get(d["content_type"], d["content_type"].title())
    return {"text": f"{d.get('author')} ({d.get('year')}). {d['title']}. {kind}. {d.get('organization')}. PolarSync Repository, record {d['id']}."}


@router.post("/events")
def track_event(ev: EventIn):
    if ev.kind == "media_play" and ev.content_id:
        db.execute("UPDATE content SET views = views + 1 WHERE id = ?", [ev.content_id])
    log_event(ev.kind, ev.content_id, ev.query)
    return {"ok": True}


# ── Media & expeditions ──────────────────────────────────────
@router.get("/media")
def media(media_type: str | None = None, region: str | None = None, q: str | None = None):
    items = _published(MEDIA_TYPES)
    if media_type:
        items = [d for d in items if d["content_type"] in media_type.split(",")]
    if region:
        items = [d for d in items if d.get("region") in region.split(",")]
    if q:
        hits = get_index().search(q, filters={"content_type": list(MEDIA_TYPES)}, limit=100, with_trace=False)
        rank = {r["id"]: r["score"] for r in hits["results"]}
        items = sorted([d for d in items if d["id"] in rank], key=lambda d: -rank[d["id"]])
    else:
        items = _sort(items, "recent")
    locs = _locations_by_id()
    out = []
    for d in items:
        c = card(d)
        c["location_name"] = next((locs[i]["name"] for i in d.get("location_ids") or [] if i in locs), d.get("region"))
        c["abstract"] = d.get("abstract")
        c["created_at"] = d.get("created_at")
        out.append(c)
    counts = Counter(d["content_type"] for d in _published(MEDIA_TYPES))
    return {"total": len(out), "items": out, "counts": dict(counts)}


@router.get("/expeditions")
def expeditions():
    items = _published(("expedition",))
    return [card(d) | {"abstract": d.get("abstract")} for d in _sort(items, "recent")]


@router.get("/expeditions/{exp_id}")
def expedition(exp_id: str):
    d = db.fetch_one("SELECT * FROM content WHERE id = ? AND content_type = 'expedition' AND status = 'published'", [exp_id])
    if not d:
        raise HTTPException(404, "Expedition not found")
    locs = _locations_by_id()
    ids = {rid for st in d["extra"].get("stages", []) for rid in st.get("related_ids", [])} | set(d.get("related_ids") or [])
    linked = {}
    if ids:
        qs = ",".join("?" for _ in ids)
        linked = {r["id"]: card(r) for r in db.fetch_all(f"SELECT * FROM content WHERE status='published' AND id IN ({qs})", list(ids))}
    for st in d["extra"].get("stages", []):
        st["location"] = locs.get(st.get("location_id"))
        st["related"] = [linked[i] for i in st.get("related_ids", []) if i in linked]
    d["locations"] = [locs[i] for i in d.get("location_ids") or [] if i in locs]
    d["related"] = [linked[i] for i in d.get("related_ids") or [] if i in linked]
    d["media"] = [card(m) for m in db.fetch_all("SELECT * FROM content WHERE status='published' AND content_type IN ('photo','video') ")
                  if (m.get("extra") or {}).get("expedition_id") == exp_id]
    return d


# ── Education ────────────────────────────────────────────────
@router.get("/education")
def education():
    items = _published(EDUCATION_TYPES)
    grouped: dict[str, list] = {t: [] for t in EDUCATION_TYPES}
    for d in _sort(items, "recent"):
        grouped[d["content_type"]].append(card(d))
    return grouped


# ── Locations (map ↔ knowledge connection) ───────────────────
def _content_for_location(loc_id: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [d for d in items if loc_id in (d.get("location_ids") or [])]


@router.get("/locations")
def locations(category: str | None = None, q: str | None = None):
    locs = db.fetch_all("SELECT * FROM locations")
    items = _published()
    out = []
    for l in locs:
        if category and l["category"] not in category.split(","):
            continue
        if q and q.lower() not in (l["name"] + " " + l["region"] + " " + (l["description"] or "")).lower():
            continue
        linked = _content_for_location(l["id"], items)
        counts = Counter(GROUPS.get(d["content_type"], "other") for d in linked)
        out.append(l | {"counts": dict(counts), "total_linked": len(linked)})
    return out


@router.get("/locations/{loc_id}")
def location(loc_id: str):
    l = db.fetch_one("SELECT * FROM locations WHERE id = ?", [loc_id])
    if not l:
        raise HTTPException(404, "Location not found")
    linked = _content_for_location(loc_id, _published())
    grouped: dict[str, list] = {}
    for d in _sort(linked, "popular"):
        grouped.setdefault(GROUPS.get(d["content_type"], "other"), []).append(card(d))
    nearby = [x for x in db.fetch_all("SELECT * FROM locations WHERE region = ? AND id != ?", [l["region"], loc_id])]
    topics = Counter(t for d in linked for t in (d.get("tags") or []))
    return l | {"content": grouped, "counts": {k: len(v) for k, v in grouped.items()}, "total_linked": len(linked),
                "nearby": nearby[:4], "top_topics": [t for t, _ in topics.most_common(8)]}


def file_path_for(url: str) -> Path | None:
    if url and url.startswith("/files/"):
        return UPLOAD_DIR / url[len("/files/"):]
    return None
