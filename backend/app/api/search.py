from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Query

from ..database import db
from ..services import get_ai, get_index
from .deps import log_event

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def search(
    q: str = Query("", max_length=300),
    mode: str = Query("hybrid", pattern="^(hybrid|keyword|semantic)$"),
    content_type: str | None = None,
    media_type: str | None = None,
    region: str | None = None,
    research_area: str | None = None,
    year: str | None = None,
    author: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    log: bool = False,
):
    q = q.strip()
    if not q:
        return {"query": "", "total": 0, "results": [], "insight": None, "facets": {}, "related_topics": [], "locations": [], "pipeline": []}
    filters = {"content_type": content_type, "media_type": media_type, "region": region, "research_area": research_area, "year": year, "author": author}
    out = get_index().search(q, filters=filters, limit=limit, mode=mode)
    out["insight"] = get_ai().search_insight(q, out["results"], out["query_analysis"]["concepts"]) if mode != "keyword" else None
    if log:
        log_event("search", query=q)
    return out


@router.get("/suggest")
def suggest(q: str = Query("", max_length=200)):
    """Lightweight grouped results for the Ctrl+K command palette."""
    q = q.strip()
    if len(q) < 2:
        return {"groups": {}, "locations": []}
    out = get_index().search(q, limit=12, with_trace=False)
    groups: dict[str, list] = {}
    for r in out["results"]:
        groups.setdefault(r["group"], [])
        if len(groups[r["group"]]) < 4:
            groups[r["group"]].append({k: r[k] for k in ("id", "title", "content_type", "region", "year", "relevance", "thumbnail", "extra")})
    return {"groups": groups, "locations": out["locations"][:3], "took_ms": out["took_ms"]}


@router.get("/popular")
def popular(limit: int = 8):
    rows = db.fetch_all("SELECT query, COUNT(*) AS n FROM events WHERE kind = 'search' AND query IS NOT NULL GROUP BY lower(query) ORDER BY n DESC LIMIT ?", [limit])
    return [r["query"] for r in rows]


@router.get("/status")
def status():
    return get_index().stats()


@router.get("/compare")
def compare(q: str):
    """Side-by-side counts for keyword-only vs hybrid semantic search (demo aid)."""
    idx = get_index()
    kw = idx.search(q, mode="keyword", limit=10, with_trace=False)
    hy = idx.search(q, mode="hybrid", limit=10, with_trace=False)
    return {
        "keyword": {"total": kw["total"], "top": [r["title"] for r in kw["results"][:5]]},
        "hybrid": {"total": hy["total"], "top": [r["title"] for r in hy["results"][:5]]},
        "only_in_hybrid": [r["title"] for r in hy["results"] if r["id"] not in {k["id"] for k in kw["results"]}][:5],
    }
