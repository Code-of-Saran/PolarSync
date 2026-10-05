"""Populate a fresh database with prototype sample content."""
from __future__ import annotations

import hashlib
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

from . import db
from .seed_data import (
    APPROVED_HISTORY,
    CONTRIBUTOR_EXTRA,
    DATASETS,
    EDUCATION,
    EXPEDITIONS,
    LOCATIONS,
    MEDIA,
    PAPERS,
    PENDING_SUBMISSIONS,
    POPULAR_QUERIES,
    REJECTED_HISTORY,
    REPORTS,
    ROLES,
    USERS,
)


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(8).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 60_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    salt, _ = stored.split("$", 1)
    return hash_password(password, salt) == stored


def _content_row(c: dict) -> dict:
    row = dict(c)
    row.setdefault("abstract", None)
    row.setdefault("research_area", None)
    row.setdefault("file_url", None)
    row.setdefault("file_name", None)
    row.setdefault("file_size", None)
    row.setdefault("file_format", None)
    row.setdefault("ai_summary", None)
    row.setdefault("views", 0)
    row["updated_at"] = row.get("updated_at") or row["created_at"]
    row["published_at"] = row["created_at"] if row.get("status") == "published" else None
    return row


def seed_base() -> None:
    db.insert_many("roles", ROLES)
    db.insert_many("users", [
        {k: v for k, v in u.items() if k != "password"} | {"password_hash": hash_password(u["password"]), "created_at": "2026-01-01T00:00:00Z"}
        for u in USERS
    ])
    db.insert_many("locations", [{**l, "extra": l.get("extra", {}), "established": l.get("established")} for l in LOCATIONS])
    published = PAPERS + DATASETS + REPORTS + MEDIA + EXPEDITIONS + EDUCATION
    db.insert_many("content", [_content_row(c) for c in published])

    # Published items with an approval history
    for cid, user, submitted, decided, comment in APPROVED_HISTORY:
        sid = f"sub-{cid}"
        db.insert("submissions", {"id": sid, "content_id": cid, "submitted_by": user, "submitted_at": submitted, "status": "approved",
                                  "ai_analysis": None, "notes": None, "updated_at": decided})
        db.insert("reviews", {"id": f"rev-{cid}", "submission_id": sid, "reviewer_id": "u-admin", "decision": "approved",
                              "comments": comment, "edits": None, "created_at": decided})
        db.update("content", "id", cid, {"submitted_by": user})

    for item in REJECTED_HISTORY:
        c = item["content"]
        db.insert("content", _content_row(c) | {"submitted_by": item["submitted_by"]})
        sid = f"sub-{c['id']}"
        db.insert("submissions", {"id": sid, "content_id": c["id"], "submitted_by": item["submitted_by"], "submitted_at": item["submitted_at"],
                                  "status": "rejected", "ai_analysis": None, "notes": None, "updated_at": item["decided_at"]})
        db.insert("reviews", {"id": f"rev-{c['id']}", "submission_id": sid, "reviewer_id": "u-admin", "decision": "rejected",
                              "comments": item["comment"], "edits": None, "created_at": item["decided_at"]})

    for item in CONTRIBUTOR_EXTRA:
        c = item["content"]
        db.insert("content", _content_row(c) | {"submitted_by": item["submitted_by"]})
        if item.get("submission_status"):
            sid = f"sub-{c['id']}"
            db.insert("submissions", {"id": sid, "content_id": c["id"], "submitted_by": item["submitted_by"], "submitted_at": item["submitted_at"],
                                      "status": item["submission_status"], "ai_analysis": None, "notes": item.get("notes"), "updated_at": item["submitted_at"]})
            db.insert("reviews", {"id": f"rev-{c['id']}", "submission_id": sid, "reviewer_id": "u-admin", "decision": "changes_requested",
                                  "comments": item.get("review_comment"), "edits": None, "created_at": item["submitted_at"]})


def seed_pending(ai) -> None:
    """Pending submissions get a genuine AIService analysis at seed time."""
    for item in PENDING_SUBMISSIONS:
        c = item["content"]
        db.insert("content", _content_row(c) | {"submitted_by": item["submitted_by"]})
        analysis = ai.analyze(c, filename=c.get("file_name"), exclude_id=c["id"])
        db.update("content", "id", c["id"], {"ai_summary": analysis["summary"]})
        db.insert("submissions", {"id": f"sub-{c['id']}", "content_id": c["id"], "submitted_by": item["submitted_by"],
                                  "submitted_at": item["submitted_at"], "status": "pending", "ai_analysis": analysis,
                                  "notes": item.get("notes"), "updated_at": item["submitted_at"]})


def seed_events() -> None:
    """Simulated 60-day activity baseline (flagged simulated=1)."""
    rng = random.Random(2026)
    now = datetime.now(timezone.utc)
    content_ids = [c["id"] for c in PAPERS + DATASETS + REPORTS + MEDIA + EXPEDITIONS + EDUCATION]
    weights = [max(1, (c.get("views") or 100) // 100) for c in PAPERS + DATASETS + REPORTS + MEDIA + EXPEDITIONS + EDUCATION]
    media_ids = [c["id"] for c in MEDIA if c["content_type"] == "video"]
    dataset_ids = [c["id"] for c in DATASETS + PAPERS + REPORTS]
    queries = [q for q, _ in POPULAR_QUERIES]
    q_weights = [w for _, w in POPULAR_QUERIES]
    rows = []
    for day in range(60, 0, -1):
        date = now - timedelta(days=day)
        growth = 1 + (60 - day) / 60  # gentle upward trend
        weekday = 0.75 if date.weekday() >= 5 else 1.0
        for kind, base, pool, w in (("view", 34, content_ids, weights), ("search", 14, queries, q_weights),
                                    ("download", 7, dataset_ids, None), ("media_play", 5, media_ids, None)):
            n = int(rng.gauss(base * growth * weekday, base * 0.18))
            for _ in range(max(0, n)):
                ts = (date + timedelta(seconds=rng.randint(0, 86_399))).strftime("%Y-%m-%dT%H:%M:%SZ")
                pick = rng.choices(pool, weights=w)[0] if w else rng.choice(pool)
                rows.append({"kind": kind, "content_id": None if kind == "search" else pick, "query": pick if kind == "search" else None,
                             "created_at": ts, "simulated": 1})
    db.insert_many("events", rows)


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"
