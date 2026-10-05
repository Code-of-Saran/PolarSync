"""Hybrid semantic search over published PolarSync content.

Pipeline:
  query → preprocessing (tokenise, stem, thesaurus expansion)
        → embedding (active provider)
        → cosine similarity over the in-memory vector index
        → metadata filtering (type / region / area / year / author / media type)
        → ranking: 0.4·semantic + 0.4·keyword(BM25) + 0.2·metadata relevance
        → grouped results + extractive AI insight

The vector index is a numpy matrix (exact search). For a prototype corpus this
is faster and simpler than FAISS; the class boundary allows swapping in a
vector database later without changing the API.
"""
from __future__ import annotations

import hashlib
import math
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

import numpy as np

from ..database import db
from .embeddings import EmbeddingProvider, LSAProvider
from .text import RESEARCH_AREAS, VOCABULARY, concept_hits, expand_query, normalize, stem, stems, tokenize

W_SEMANTIC, W_KEYWORD, W_META = 0.4, 0.4, 0.2

GROUPS = {
    "paper": "research", "dataset": "datasets", "report": "reports",
    "photo": "media", "video": "media", "press_release": "media",
    "story": "learn", "tour": "learn", "quiz": "learn", "kit": "learn",
    "expedition": "expeditions",
}

TYPE_INTENTS = {
    "dataset": ["dataset", "datasets", "data", "time series", "csv", "netcdf", "measurements"],
    "paper": ["paper", "papers", "study", "studies", "article", "publication", "research"],
    "report": ["report", "reports", "assessment", "summary report"],
    "photo": ["photo", "photos", "photograph", "photographs", "image", "images", "pictures", "gallery"],
    "video": ["video", "videos", "film", "documentary", "footage", "time-lapse"],
    "press_release": ["press", "news", "announcement", "press release"],
    "story": ["story", "stories", "learn", "students", "kids", "explain"],
    "quiz": ["quiz", "test my knowledge"],
    "tour": ["tour", "virtual tour", "walkthrough"],
    "kit": ["lesson", "teacher", "classroom", "educator"],
    "expedition": ["expedition", "voyage", "journey"],
}

REGION_ALIASES = {"Antarctica": "Antarctica", "Arctic": "Arctic", "Himalaya": "Himalaya", "Southern Ocean": "Southern Ocean"}

# Calibration of raw cosine similarity into a 0–1 relevance signal
CALIBRATION = {"sentence-transformers": (0.12, 0.62), "lsa": (0.03, 0.55)}


def _doc_text(d: dict[str, Any]) -> str:
    parts = [d.get("title") or "", d.get("description") or "", d.get("abstract") or "",
             " ".join(d.get("tags") or []), " ".join(d.get("keywords") or []),
             d.get("region") or "", d.get("research_area") or ""]
    return ". ".join(p for p in parts if p)


def _bm25_tokens(d: dict[str, Any]) -> list[str]:
    title = stems(d.get("title") or "")
    tags = stems(" ".join((d.get("tags") or []) + (d.get("keywords") or [])))
    body = stems(" ".join([d.get("description") or "", d.get("abstract") or ""]))
    meta = stems(" ".join([d.get("region") or "", d.get("research_area") or "", d.get("author") or "", d.get("organization") or ""]))
    return title * 3 + tags * 2 + body + meta


def _hash(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


class SearchIndex:
    def __init__(self, provider: EmbeddingProvider):
        self.provider = provider
        self.lock = threading.RLock()
        self.docs: list[dict[str, Any]] = []
        self.by_id: dict[str, int] = {}
        self.E = np.zeros((0, 1))
        self._cache: dict[str, np.ndarray] = {}
        self.df: Counter = Counter()
        self.doc_tokens: list[Counter] = []
        self.doc_len: list[int] = []
        self.avgdl = 1.0
        self.area_centroids: dict[str, np.ndarray] = {}
        self.locations: list[dict[str, Any]] = []
        self.L = np.zeros((0, 1))
        self.built_at: str | None = None
        self.build_ms = 0

    # ── building ─────────────────────────────────────────────
    def rebuild(self) -> None:
        t0 = time.perf_counter()
        docs = db.fetch_all("SELECT * FROM content WHERE status = 'published'")
        locations = db.fetch_all("SELECT * FROM locations")
        texts = [_doc_text(d) for d in docs]
        with self.lock:
            if isinstance(self.provider, LSAProvider):
                # LSA learns its latent space from the corpus (incl. locations)
                loc_texts = [f"{l['name']}. {l['description']}. {' '.join(l.get('research_areas') or [])}" for l in locations]
                self.provider.fit(texts + loc_texts)
                self._cache.clear()
            E = self._embed_cached(texts)
            df: Counter = Counter()
            doc_tokens, doc_len = [], []
            for d in docs:
                toks = _bm25_tokens(d)
                c = Counter(toks)
                doc_tokens.append(c)
                doc_len.append(len(toks))
                df.update(c.keys())
            self.docs, self.E = docs, E
            self.by_id = {d["id"]: i for i, d in enumerate(docs)}
            self.df, self.doc_tokens, self.doc_len = df, doc_tokens, doc_len
            self.avgdl = (sum(doc_len) / len(doc_len)) if doc_len else 1.0
            # research-area centroids for the classifier
            groups: dict[str, list[int]] = defaultdict(list)
            for i, d in enumerate(docs):
                if d.get("research_area") in RESEARCH_AREAS:
                    groups[d["research_area"]].append(i)
            self.area_centroids = {}
            for area, idx in groups.items():
                c = E[idx].mean(axis=0)
                self.area_centroids[area] = c / (np.linalg.norm(c) or 1)
            self.locations = locations
            loc_texts = [f"{l['name']}. {l['description']}. {l['region']}. {' '.join(l.get('research_areas') or [])}" for l in locations]
            self.L = self._embed_cached(loc_texts) if loc_texts else np.zeros((0, E.shape[1] if E.size else 1))
            self.built_at = datetime.now(timezone.utc).isoformat()
            self.build_ms = round((time.perf_counter() - t0) * 1000)

    def _embed_cached(self, texts: list[str]) -> np.ndarray:
        keys = [_hash(t) for t in texts]
        missing = [(k, t) for k, t in zip(keys, texts) if k not in self._cache]
        if missing:
            vecs = self.provider.embed([t for _, t in missing])
            for (k, _), v in zip(missing, vecs):
                self._cache[k] = v
        if not texts:
            return np.zeros((0, self.provider.dim or 1))
        return np.vstack([self._cache[k] for k in keys])

    def embed(self, texts: list[str]) -> np.ndarray:
        with self.lock:
            return self.provider.embed(texts)

    # ── helpers used by AIService ────────────────────────────
    def idf_for(self, terms: list[str]) -> float:
        n = max(1, len(self.docs))
        vals = [math.log(1 + (n - self.df.get(t, 0) + 0.5) / (self.df.get(t, 0) + 0.5)) for t in terms]
        return sum(vals) / len(vals) if vals else 1.0

    def area_similarity(self, text: str) -> dict[str, float]:
        if not self.area_centroids:
            return {}
        v = self.embed([text])[0]
        return {a: float(v @ c) for a, c in self.area_centroids.items()}

    def similar_to_text(self, text: str, k: int = 4, exclude_id: str | None = None) -> list[dict[str, Any]]:
        if not self.docs:
            return []
        v = self.embed([text])[0]
        sims = self.E @ v
        out = []
        for i in np.argsort(-sims):
            d = self.docs[int(i)]
            if d["id"] == exclude_id:
                continue
            out.append({"id": d["id"], "title": d["title"], "content_type": d["content_type"], "region": d.get("region"),
                        "thumbnail": d.get("thumbnail"), "similarity": round(float(sims[int(i)]), 3)})
            if len(out) >= k:
                break
        return out

    def related(self, content_id: str, k: int = 6) -> list[dict[str, Any]]:
        with self.lock:
            i = self.by_id.get(content_id)
            if i is None:
                return []
            base = self.docs[i]
            sims = self.E @ self.E[i]
            locs = set(base.get("location_ids") or [])
            curated = set(base.get("related_ids") or [])
            scored = []
            for j, d in enumerate(self.docs):
                if j == i:
                    continue
                s = float(sims[j])
                reason = "Similar topic"
                if d["id"] in curated or content_id in (d.get("related_ids") or []):
                    s += 0.35
                    reason = "Linked record"
                shared = locs & set(d.get("location_ids") or [])
                if shared:
                    s += 0.12
                    if reason == "Similar topic":
                        reason = "Same location"
                scored.append((s, reason, d))
            scored.sort(key=lambda x: -x[0])
            return [{**_card(d), "similarity": round(min(s, 1.0), 3), "reason": reason} for s, reason, d in scored[:k]]

    # ── search ───────────────────────────────────────────────
    def _bm25(self, q_terms: dict[str, float]) -> np.ndarray:
        k1, b = 1.4, 0.75
        n = len(self.docs)
        scores = np.zeros(n)
        for term, wq in q_terms.items():
            df = self.df.get(term, 0)
            if not df:
                continue
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            for j, toks in enumerate(self.doc_tokens):
                tf = toks.get(term, 0)
                if tf:
                    scores[j] += wq * idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * self.doc_len[j] / self.avgdl))
        return scores

    def search(self, query: str, filters: dict[str, Any] | None = None, limit: int = 30, mode: str = "hybrid", with_trace: bool = True) -> dict[str, Any]:
        filters = {k: v for k, v in (filters or {}).items() if v not in (None, "", "all", "All")}
        trace: list[dict[str, Any]] = []
        t_all = time.perf_counter()
        with self.lock:
            docs, E = self.docs, self.E

            # 1. preprocessing
            t0 = time.perf_counter()
            q_tokens = tokenize(query)
            q_stems = [stem(t) for t in q_tokens]
            expanded, concepts = expand_query(query) if mode != "keyword" else ([], [])
            trace.append({"step": "Query preprocessing", "ms": _ms(t0),
                          "detail": f"{len(q_tokens)} terms: {', '.join(q_tokens[:8]) or '—'}"
                                    + (f" · expanded with {len(concepts)} concepts: {', '.join(concepts[:5])}" if concepts else "")})

            # 2. embedding + 3. similarity
            t0 = time.perf_counter()
            qv = None
            lo, hi = CALIBRATION.get(self.provider.name, (0.1, 0.6))
            if mode != "keyword" and len(docs):
                qv = self.provider.embed([query])[0]
                sims = E @ qv
                sem = np.clip((sims - lo) / (hi - lo), 0, 1)
            else:
                sims = np.zeros(len(docs))
                sem = np.zeros(len(docs))
            trace.append({"step": "Embedding", "ms": _ms(t0),
                          "detail": "skipped (keyword mode)" if mode == "keyword" else f"{self.provider.model_label} · {self.provider.dim}-d vector"})
            trace.append({"step": "Similarity search", "ms": 0,
                          "detail": "skipped" if mode == "keyword" else f"cosine similarity over {len(docs)} indexed records"})

            # keyword relevance (BM25)
            q_terms: dict[str, float] = {}
            for s in q_stems:
                q_terms[s] = 1.0
            for phrase in expanded:
                for s in stems(phrase):
                    q_terms.setdefault(s, 0.35)
            bm = self._bm25(q_terms) if q_terms else np.zeros(len(docs))
            kw = bm / max(bm.max(), 3.0) if len(bm) else bm

            # 4. metadata filtering
            t0 = time.perf_counter()
            mask = np.ones(len(docs), dtype=bool)
            for j, d in enumerate(docs):
                if not _passes(d, filters):
                    mask[j] = False
            trace.append({"step": "Metadata filtering", "ms": _ms(t0),
                          "detail": (", ".join(f"{k}={v}" for k, v in filters.items()) if filters else "no filters") + f" · {int(mask.sum())} candidates"})

            # metadata relevance from query intent
            t0 = time.perf_counter()
            qn = " " + normalize(query) + " "
            type_intents = {t for t, cues in TYPE_INTENTS.items() if any(f" {c} " in qn or f" {c}s " in qn for c in cues)}
            if "paper" in type_intents and len(type_intents) > 1:
                type_intents.discard("paper")  # "research" is generic when another type is named
            region_intents = {REGION_ALIASES[c] for c in concepts if c in REGION_ALIASES}
            area_intents = {a for a, cs in RESEARCH_AREAS.items() if any(c in concepts for c in cs)}
            now_year = datetime.now(timezone.utc).year
            max_views = max([d.get("views") or 0 for d in docs] + [1])
            meta = np.zeros(len(docs))
            for j, d in enumerate(docs):
                parts = []
                if region_intents:
                    parts.append(1.0 if d.get("region") in region_intents else 0.0)
                if type_intents:
                    parts.append(1.0 if d["content_type"] in type_intents else 0.0)
                if area_intents:
                    parts.append(1.0 if d.get("research_area") in area_intents else 0.0)
                intent = sum(parts) / len(parts) if parts else 0.5
                recency = max(0.0, 1 - (now_year - (d.get("year") or now_year)) / 6)
                popularity = math.log1p(d.get("views") or 0) / math.log1p(max_views)
                meta[j] = 0.75 * intent + 0.125 * recency + 0.125 * popularity

            # 5. ranking
            if mode == "keyword":
                final = kw.copy()
                keep = mask & (bm > 0)
            elif mode == "semantic":
                final = sem.copy()
                keep = mask & (sem > 0.2)
            else:
                final = W_SEMANTIC * sem + W_KEYWORD * kw + W_META * meta
                keep = mask & (final >= 0.34) & ((sem >= 0.3) | (kw >= 0.15))
            order = [int(j) for j in np.argsort(-final) if keep[int(j)]]
            trace.append({"step": "Hybrid ranking", "ms": _ms(t0),
                          "detail": "BM25 keyword score only" if mode == "keyword" else f"{W_SEMANTIC}×semantic + {W_KEYWORD}×keyword + {W_META}×metadata · {len(order)} relevant"})

            results = []
            for j in order[:limit]:
                d = docs[j]
                doc_stems = self.doc_tokens[j]
                matched = sorted({t for t, s in zip(q_tokens, q_stems) if doc_stems.get(s)})
                results.append({
                    **_card(d),
                    "abstract": d.get("abstract"),
                    "score": round(float(final[j]), 4),
                    "relevance": int(round(100 * min(1.0, float(final[j])))),
                    "breakdown": {"semantic": round(float(sem[j]), 3), "keyword": round(float(kw[j]), 3), "metadata": round(float(meta[j]), 3),
                                  "cosine": round(float(sims[j]), 3)},
                    "matched_terms": matched,
                    "semantic_match": bool(sem[j] >= 0.45 and kw[j] < 0.25),
                    "group": GROUPS.get(d["content_type"], "other"),
                })

            # facets over the relevant set (ignoring the limit)
            facets = {"content_type": Counter(), "region": Counter(), "research_area": Counter(), "year": Counter(), "author": Counter()}
            for j in order:
                d = docs[j]
                facets["content_type"][d["content_type"]] += 1
                facets["region"][d.get("region") or "—"] += 1
                facets["research_area"][d.get("research_area") or "—"] += 1
                facets["year"][str(d.get("year") or "—")] += 1
                facets["author"][d.get("author") or "—"] += 1

            # related topics: tags from top results not already in the query
            q_low = normalize(query)
            topic_counter: Counter = Counter()
            for r in results[:10]:
                for t in r.get("tags", []):
                    if t.lower() not in q_low:
                        topic_counter[t] += 1
            related_topics = [t for t, _ in topic_counter.most_common(8)]

            # matching locations
            locations = []
            if len(self.locations) and qv is not None:
                lsims = self.L @ qv
                for i in np.argsort(-lsims)[:4]:
                    loc = self.locations[int(i)]
                    name_hit = any(t in normalize(loc["name"]) for t in q_tokens)
                    if lsims[int(i)] >= (lo + 0.3) or name_hit:
                        locations.append({"id": loc["id"], "name": loc["name"], "region": loc["region"], "category": loc["category"],
                                          "image": loc.get("image"), "similarity": round(float(lsims[int(i)]), 3)})
            elif mode == "keyword":
                for loc in self.locations:
                    if any(t in normalize(loc["name"] + " " + loc["description"]) for t in q_tokens):
                        locations.append({"id": loc["id"], "name": loc["name"], "region": loc["region"], "category": loc["category"], "image": loc.get("image")})
                locations = locations[:4]

        return {
            "query": query,
            "mode": mode,
            "total": len(order),
            "results": results,
            "facets": {k: dict(v.most_common()) for k, v in facets.items()},
            "related_topics": related_topics,
            "locations": locations,
            "query_analysis": {"tokens": q_tokens, "concepts": concepts, "expanded_terms": expanded[:12],
                               "intents": {"type": sorted(type_intents), "region": sorted(region_intents), "research_area": sorted(area_intents)}},
            "pipeline": trace if with_trace else [],
            "weights": {"semantic": W_SEMANTIC, "keyword": W_KEYWORD, "metadata": W_META},
            "model": self.provider.model_label,
            "took_ms": _ms(t_all),
        }

    def stats(self) -> dict[str, Any]:
        return {"documents": len(self.docs), "locations": len(self.locations), "model": self.provider.model_label,
                "provider": self.provider.name, "dimensions": self.provider.dim, "built_at": self.built_at, "build_ms": self.build_ms,
                "vocabulary_concepts": len(VOCABULARY)}


def _ms(t0: float) -> float:
    return round((time.perf_counter() - t0) * 1000, 1)


def _passes(d: dict[str, Any], f: dict[str, Any]) -> bool:
    if "content_type" in f:
        allowed = f["content_type"] if isinstance(f["content_type"], list) else str(f["content_type"]).split(",")
        if d["content_type"] not in allowed:
            return False
    if "media_type" in f:
        allowed = str(f["media_type"]).split(",")
        if d["content_type"] not in allowed:
            return False
    if "region" in f and d.get("region") not in str(f["region"]).split(","):
        return False
    if "research_area" in f and d.get("research_area") not in str(f["research_area"]).split(","):
        return False
    if "year" in f and str(d.get("year")) not in str(f["year"]).split(","):
        return False
    if "author" in f and str(f["author"]).lower() not in (d.get("author") or "").lower():
        return False
    return True


def _card(d: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": d["id"], "title": d["title"], "description": d.get("description"), "content_type": d["content_type"],
        "region": d.get("region"), "research_area": d.get("research_area"), "author": d.get("author"),
        "organization": d.get("organization"), "year": d.get("year"), "tags": d.get("tags") or [],
        "thumbnail": d.get("thumbnail"), "views": d.get("views") or 0, "location_ids": d.get("location_ids") or [],
        "extra": d.get("extra") or {}, "file_format": d.get("file_format"),
    }


def card(d: dict[str, Any]) -> dict[str, Any]:
    return _card(d)


__all__ = ["SearchIndex", "card", "concept_hits"]
