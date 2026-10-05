"""Contributor dashboard, admin command centre, analytics and AI insights."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from ..database import db, seed
from ..services import get_ai, get_index
from ..services.search_service import GROUPS
from ..services.text import concept_hits
from .deps import require_admin, require_user

router = APIRouter(prefix="/api", tags=["analytics"])


# Broad concepts that fire on almost any polar query; excluded from "topic" rankings
GENERIC_CONCEPTS = {"Cryosphere", "Antarctica", "Arctic", "Himalaya", "Southern Ocean", "Research Station", "Field Observation", "Time Series", "Expedition"}


def _days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _daily_series(kind: str, days: int = 30) -> list[dict]:
    rows = db.fetch_all("SELECT substr(created_at,1,10) AS d, COUNT(*) AS n, SUM(simulated) AS sim FROM events WHERE kind = ? AND created_at >= ? GROUP BY d ORDER BY d",
                        [kind, _days_ago(days)])
    by_day = {r["d"]: r for r in rows}
    out = []
    for i in range(days, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        r = by_day.get(d)
        out.append({"date": d, "count": r["n"] if r else 0, "live": (r["n"] - (r["sim"] or 0)) if r else 0})
    return out


def _top_search_topics(days: int = 30) -> list[dict]:
    rows = db.fetch_all("SELECT query, COUNT(*) AS n FROM events WHERE kind='search' AND query IS NOT NULL AND created_at >= ? GROUP BY lower(query) ORDER BY n DESC",
                        [_days_ago(days)])
    concepts: Counter = Counter()
    for r in rows:
        hits = concept_hits(r["query"])
        for c in hits:
            if c not in GENERIC_CONCEPTS:
                concepts[c] += r["n"]
    return [{"topic": c, "searches": n} for c, n in concepts.most_common(8)]


# ── Contributor dashboard ────────────────────────────────────
@router.get("/dashboard")
def dashboard(user=Depends(require_user)):
    rows = db.fetch_all("SELECT id, title, content_type, region, status, views, downloads, updated_at, created_at, thumbnail FROM content WHERE submitted_by = ? ORDER BY updated_at DESC",
                        [user["id"]])
    counts = Counter(r["status"] for r in rows)
    reviews = db.fetch_all(
        """SELECT r.decision, r.comments, r.created_at, c.title, c.id AS content_id FROM reviews r
           JOIN submissions s ON s.id = r.submission_id JOIN content c ON c.id = s.content_id
           WHERE s.submitted_by = ? ORDER BY r.created_at DESC LIMIT 6""", [user["id"]])
    published = [r for r in rows if r["status"] == "published"]
    return {
        "user": user,
        "stats": {"total": len(rows), "under_review": counts.get("under_review", 0), "published": counts.get("published", 0),
                  "drafts": counts.get("draft", 0), "rejected": counts.get("rejected", 0), "changes_requested": counts.get("changes_requested", 0),
                  "total_views": sum(r["views"] or 0 for r in published), "total_downloads": sum(r["downloads"] or 0 for r in published)},
        "items": rows,
        "recent_reviews": reviews,
    }


# ── Analytics overview ───────────────────────────────────────
@router.get("/analytics")
def analytics():
    published = db.fetch_all("SELECT id, title, content_type, region, research_area, tags, views, downloads, thumbnail, published_at, created_at FROM content WHERE status = 'published'")
    by_type = Counter(d["content_type"] for d in published)
    by_group = Counter(GROUPS.get(d["content_type"], "other") for d in published)
    by_region = Counter(d["region"] or "—" for d in published)
    by_area = Counter(d["research_area"] or "—" for d in published if d["content_type"] in ("paper", "dataset", "report"))
    topics = Counter(t for d in published for t in (d["tags"] or []))
    events = {r["kind"]: r for r in db.fetch_all("SELECT kind, COUNT(*) AS n, SUM(simulated) AS sim FROM events WHERE created_at >= ? GROUP BY kind", [_days_ago(30)])}
    total_events = sum(r["n"] for r in events.values()) or 1
    sim_events = sum(r["sim"] or 0 for r in events.values())
    most_viewed = sorted(published, key=lambda d: -(d["views"] or 0))[:8]
    most_downloaded = sorted([d for d in published if d["content_type"] in ("paper", "dataset", "report")], key=lambda d: -(d["downloads"] or 0))[:5]
    # monthly publications (last 12 months)
    monthly: dict[str, Counter] = defaultdict(Counter)
    for d in published:
        ts = d["published_at"] or d["created_at"]
        monthly[ts[:7]][GROUPS.get(d["content_type"], "other")] += 1
    months = []
    now = datetime.now(timezone.utc)
    for i in range(11, -1, -1):
        y, m = now.year, now.month - i
        while m <= 0:
            y, m = y - 1, m + 12
        key = f"{y}-{m:02d}"
        months.append({"month": key, **{g: monthly[key].get(g, 0) for g in ("research", "datasets", "reports", "media", "learn", "expeditions")}})
    users = db.fetch_one("SELECT COUNT(*) AS n FROM users")["n"]
    return {
        "totals": {
            "content": len(published), "papers": by_type.get("paper", 0), "datasets": by_type.get("dataset", 0), "reports": by_type.get("report", 0),
            "media": by_type.get("photo", 0) + by_type.get("video", 0) + by_type.get("press_release", 0),
            "learning": sum(by_type.get(t, 0) for t in ("story", "tour", "quiz", "kit")), "expeditions": by_type.get("expedition", 0),
            "locations": db.fetch_one("SELECT COUNT(*) AS n FROM locations")["n"], "users": users,
        },
        "by_type": dict(by_type), "by_group": dict(by_group), "by_region": dict(by_region.most_common()), "by_research_area": dict(by_area.most_common()),
        "popular_topics": [{"topic": t, "count": n} for t, n in topics.most_common(10)],
        "search_topics": _top_search_topics(),
        "top_queries": db.fetch_all("SELECT query, COUNT(*) AS n FROM events WHERE kind='search' AND query IS NOT NULL AND created_at >= ? GROUP BY lower(query) ORDER BY n DESC LIMIT 8", [_days_ago(30)]),
        "most_viewed": [{k: d[k] for k in ("id", "title", "content_type", "region", "views", "downloads", "thumbnail")} for d in most_viewed],
        "most_downloaded": [{k: d[k] for k in ("id", "title", "content_type", "downloads")} for d in most_downloaded],
        "engagement": {k: {"total": events[k]["n"] if k in events else 0, "live": (events[k]["n"] - (events[k]["sim"] or 0)) if k in events else 0}
                       for k in ("view", "search", "download", "media_play")},
        "series": {k: _daily_series(k) for k in ("view", "search", "download", "media_play")},
        "monthly_publications": months,
        "simulated_share": round(sim_events / total_events, 3),
        "note": "Content counts are live from the database. Engagement includes a simulated 60-day baseline (flagged) plus live events recorded during this demo.",
    }


@router.get("/analytics/insights")
def insights():
    published = db.fetch_all("SELECT content_type, region, views, downloads, published_at, created_at FROM content WHERE status = 'published'")
    repo = [d for d in published if d["content_type"] in ("paper", "dataset", "report")]
    out = []
    year = datetime.now(timezone.utc).year
    this_year = [d for d in published if (d["published_at"] or d["created_at"]).startswith(str(year))]
    kinds = len({d["content_type"] for d in this_year})
    out.append({"icon": "trend", "text": f"{len(this_year)} records have been published in {year} so far, spanning {kinds} content type{'s' if kinds != 1 else ''}.",
                "href": "/repository"})
    topics = _top_search_topics()
    if topics:
        out.append({"icon": "search", "text": f"{topics[0]['topic']} is currently the most searched topic ({topics[0]['searches']} searches in 30 days), followed by {topics[1]['topic'] if len(topics) > 1 else '—'}.",
                    "href": f"/search?q={topics[0]['topic']}"})
    if repo:
        reg = Counter(d["region"] for d in repo).most_common(1)[0]
        out.append({"icon": "globe", "text": f"{reg[0]} accounts for {round(100 * reg[1] / len(repo))}% of repository research records ({reg[1]} of {len(repo)}).",
                    "href": f"/repository?region={reg[0]}"})
    ds = [d for d in repo if d["content_type"] == "dataset"]
    pp = [d for d in repo if d["content_type"] == "paper"]
    if ds and pp:
        dsr = sum(d["downloads"] or 0 for d in ds) / len(ds)
        ppr = sum(d["downloads"] or 0 for d in pp) / len(pp)
        out.append({"icon": "download", "text": f"Datasets average {dsr:.0f} downloads per record versus {ppr:.0f} for papers — data reuse is a key outcome.",
                    "href": "/repository?content_type=dataset"})
    pending = db.fetch_all("SELECT submitted_at FROM submissions WHERE status = 'pending' ORDER BY submitted_at")
    if pending:
        oldest = datetime.strptime(pending[0]["submitted_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        days = max(0, (datetime.now(timezone.utc) - oldest).days)
        out.append({"icon": "review", "text": f"{len(pending)} submissions are awaiting review; the oldest has waited {days} day{'s' if days != 1 else ''}.",
                    "href": "/admin"})
    return {"insights": out, "generated_at": db.now_iso(), "method": "Computed from live database statistics"}


# ── Admin command centre ─────────────────────────────────────
@router.get("/dashboard/admin")
def admin_dashboard(admin=Depends(require_admin)):
    pending = db.fetch_one("SELECT COUNT(*) AS n FROM submissions WHERE status = 'pending'")["n"]
    new30 = db.fetch_one("SELECT COUNT(*) AS n FROM submissions WHERE submitted_at >= ?", [_days_ago(30)])["n"]
    published = db.fetch_one("SELECT COUNT(*) AS n FROM content WHERE status = 'published'")["n"]
    users = db.fetch_one("SELECT COUNT(*) AS n FROM users")["n"]
    recent = db.fetch_all(
        """SELECT s.id, s.status, s.submitted_at, c.id AS content_id, c.title, c.content_type, c.region, u.name AS submitter
           FROM submissions s JOIN content c ON c.id = s.content_id JOIN users u ON u.id = s.submitted_by ORDER BY s.submitted_at DESC LIMIT 8""")
    return {
        "cards": {"pending_reviews": pending, "new_contributions": new30, "published_content": published, "total_users": users},
        "recent_contributions": recent,
        "search_activity": _daily_series("search", 14),
        "content_activity": _daily_series("view", 14),
        "popular_topics": _top_search_topics(),
        "index": get_index().stats(),
    }


@router.post("/admin/reset-demo")
def reset_demo(admin=Depends(require_admin)):
    """Restore the original seed data (useful between demo runs)."""
    from ..main import seed_database

    seed_database(reset=True)
    return {"ok": True, "index": get_index().stats()}
