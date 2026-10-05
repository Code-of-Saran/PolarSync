"""AIService — metadata intelligence for PolarSync.

  summarize()         extractive summary (sentence centrality + topical density)
  generate_tags()     controlled-vocabulary concepts + statistical keyphrases
  classify_content()  content type, region and research area with confidences
  create_embedding()  vector from the active embedding provider
  analyze()           full upload analysis used by the contribute + review flow

Everything is computed from the submitted text — nothing is canned. Outputs are
*suggestions*: they are stored with the submission and must be accepted by a
human reviewer before publication. The interface is provider-agnostic so an LLM
backend can replace the extractive implementations later.
"""
from __future__ import annotations

import math
import re
import time
from collections import Counter, defaultdict
from typing import TYPE_CHECKING, Any

import numpy as np

from .text import (
    CONTENT_TYPE_CUES,
    REGION_CONCEPTS,
    RESEARCH_AREAS,
    STOPWORDS,
    VOCABULARY,
    concept_hits,
    normalize,
    split_sentences,
    stems,
    tokenize,
)

if TYPE_CHECKING:
    from .search_service import SearchIndex

TYPE_LABELS = {
    "paper": "Research Paper", "dataset": "Dataset", "report": "Report", "photo": "Photo Gallery",
    "image": "Photo Gallery", "story": "Science Story", "tour": "Virtual Tour", "quiz": "Quiz", "kit": "Educator Kit", "expedition": "Expedition", "video": "Video", "press_release": "Press Release",
}

EXTENSION_TYPE_HINTS = {
    ".csv": "dataset", ".nc": "dataset", ".netcdf": "dataset", ".tif": "dataset", ".tiff": "dataset", ".geojson": "dataset",
    ".xlsx": "dataset", ".xls": "dataset", ".json": "dataset", ".h5": "dataset", ".hdf": "dataset",
    ".jpg": "photo", ".jpeg": "photo", ".png": "photo", ".webp": "photo",
    ".mp4": "video", ".mov": "video", ".webm": "video",
}

LOCATION_KEYWORDS = {
    "loc-maitri": ["maitri", "schirmacher"], "loc-bharati": ["bharati", "larsemann"], "loc-dakshin": ["dakshin gangotri"],
    "loc-himadri": ["himadri", "ny-alesund", "ny alesund", "svalbard"], "loc-indarc": ["indarc", "kongsfjorden"],
    "loc-brogger": ["brøggerbreen", "broggerbreen"], "loc-himansh": ["himansh", "spiti", "chandra"],
    "loc-chhota-shigri": ["chhota shigri"], "loc-gangotri": ["gangotri"], "loc-prydz": ["prydz"],
    "loc-so-transect": ["southern ocean", "transect"], "loc-cape-town": ["cape town"], "loc-seaice-zone": ["sea ice extent", "sea-ice zone"],
}


def _softmax_conf(scores: dict[str, float]) -> list[tuple[str, float]]:
    total = sum(scores.values())
    if total <= 0:
        return []
    return sorted(((k, v / total) for k, v in scores.items() if v > 0), key=lambda kv: -kv[1])


class AIService:
    def __init__(self, index: "SearchIndex"):
        self.index = index

    # ── embeddings ───────────────────────────────────────────
    def create_embedding(self, text: str) -> list[float]:
        return self.index.embed([text])[0].tolist()

    # ── summarisation ────────────────────────────────────────
    def summarize(self, text: str, title: str = "", max_sentences: int = 3) -> str:
        sentences = split_sentences(text)
        if not sentences:
            return ""
        if len(sentences) <= 2:
            return " ".join(sentences)
        # sentence vectors in the shared embedding space
        vecs = self.index.embed(sentences)
        centroid = vecs.mean(axis=0)
        if title:
            centroid = 0.7 * centroid + 0.3 * self.index.embed([title])[0]
        centroid = centroid / (np.linalg.norm(centroid) or 1)
        centrality = vecs @ centroid
        scores = []
        for i, s in enumerate(sentences):
            density = sum(concept_hits(s).values()) / (len(tokenize(s)) + 1)
            position = 0.08 if i == 0 else (0.03 if i == len(sentences) - 1 else 0)
            length_pen = -0.1 if len(s) > 400 else 0
            scores.append(float(centrality[i]) + 0.6 * density + position + length_pen)
        k = 2 if len(sentences) <= 4 else max_sentences
        chosen = sorted(sorted(range(len(sentences)), key=lambda i: -scores[i])[:k])
        return " ".join(sentences[i] for i in chosen)

    # ── tagging ──────────────────────────────────────────────
    def _keyphrases(self, text: str, title: str, top: int = 8) -> list[tuple[str, float]]:
        raw = re.split(r"[^a-zA-Z0-9\-\s]|\s{2,}", normalize(title + ". " + text))
        cands: Counter = Counter()
        surface: dict[str, str] = {}
        title_norm = normalize(title)
        for chunk in raw:
            words = chunk.split()
            run: list[str] = []
            for w in words + ["."]:
                if w in STOPWORDS or len(w) < 3 or w == "." or w.isdigit():
                    for n in (1, 2, 3):
                        for i in range(len(run) - n + 1):
                            phrase = " ".join(run[i : i + n])
                            key = " ".join(stems(phrase)) or phrase
                            cands[key] += 1
                            surface.setdefault(key, phrase)
                    run = []
                else:
                    run.append(w)
        scored = []
        for key, tf in cands.items():
            n_words = key.count(" ") + 1
            idf = self.index.idf_for(key.split())
            boost = 1.6 if surface[key] in title_norm else 1.0
            scored.append((surface[key], tf * idf * (1 + 0.5 * (n_words - 1)) * boost))
        vocab_terms = {c.lower() for c in VOCABULARY} | {t for trig in VOCABULARY.values() for t in trig}
        scored = [(p, sc) for p, sc in scored if p not in vocab_terms and len(p) >= 4]
        scored.sort(key=lambda kv: -kv[1])
        out: list[tuple[str, float]] = []
        for phrase, sc in scored:
            overlap = next((i for i, (o, _) in enumerate(out) if phrase in o or o in phrase), None)
            if overlap is not None:
                o, osc = out[overlap]
                # prefer the more specific (longer) phrase when it is nearly as strong
                if len(phrase) > len(o) and sc >= 0.5 * osc:
                    out[overlap] = (phrase, max(sc, osc))
                continue
            out.append((phrase, sc))
            if len(out) >= top:
                break
        return out

    def generate_tags(self, text: str, title: str = "", max_tags: int = 8) -> list[dict[str, Any]]:
        hits = concept_hits(text)
        title_hits = concept_hits(title)
        concept_scores: dict[str, float] = {}
        for c, n in hits.items():
            concept_scores[c] = n + 2.5 * title_hits.get(c, 0)
        # generic concept should not dominate when specific children fire
        if "Cryosphere" in concept_scores and any(c in concept_scores for c in ("Sea Ice", "Ice Shelf", "Glaciology", "Snow", "Permafrost")):
            concept_scores["Cryosphere"] *= 0.6
        tags: list[dict[str, Any]] = []
        if concept_scores:
            mx = max(concept_scores.values())
            for c, s in sorted(concept_scores.items(), key=lambda kv: -kv[1]):
                tags.append({"tag": c, "confidence": round(min(0.98, 0.45 + 0.5 * s / mx), 2), "source": "vocabulary"})
        vocab_lower = {c.lower() for c in VOCABULARY} | {t for trig in VOCABULARY.values() for t in trig}
        # remember original casing of acronyms / proper nouns (e.g. HPLC, MODIS, Sentinel-1)
        casing = {w.lower(): w for w in re.findall(r"[A-Za-z][A-Za-z0-9\-]+", f"{title} {text}") if any(ch.isupper() for ch in w[1:]) or w.isupper()}
        kps = self._keyphrases(text, title)
        if kps:
            mx = kps[0][1] or 1
            for phrase, s in kps:
                if phrase in vocab_lower or len(phrase) < 4:
                    continue
                label = " ".join(casing.get(w, w.capitalize()) for w in phrase.split())
                if any(label.lower() == t["tag"].lower() for t in tags):
                    continue
                tags.append({"tag": label, "confidence": round(min(0.9, 0.35 + 0.45 * s / mx), 2), "source": "keyphrase"})
        tags.sort(key=lambda t: -t["confidence"])
        # keep a mix: up to max_tags, at least 2 keyphrases if available
        vocab = [t for t in tags if t["source"] == "vocabulary"][: max_tags - 2]
        keyp = [t for t in tags if t["source"] == "keyphrase"]
        merged = vocab + keyp[: max_tags - len(vocab)]
        return sorted(merged, key=lambda t: -t["confidence"])[:max_tags]

    # ── classification ───────────────────────────────────────
    def classify_content(self, text: str, title: str = "", filename: str | None = None) -> dict[str, Any]:
        full = f"{title}. {text}"
        hits = concept_hits(full)
        title_hits = concept_hits(title)

        # Region
        region_scores: dict[str, float] = {}
        for concept, region in REGION_CONCEPTS.items():
            region_scores[region] = hits.get(concept, 0) + 2 * title_hits.get(concept, 0)
        regions = _softmax_conf(region_scores)
        region = {"label": regions[0][0] if regions else "Unspecified", "confidence": round(regions[0][1], 2) if regions else 0.0,
                  "alternatives": [{"label": r, "confidence": round(c, 2)} for r, c in regions[1:3]]}

        # Research area: vocabulary evidence + embedding similarity to labelled centroids
        area_scores: dict[str, float] = defaultdict(float)
        for area, concepts in RESEARCH_AREAS.items():
            area_scores[area] += sum(hits.get(c, 0) + 1.5 * title_hits.get(c, 0) for c in concepts)
        ev_total = sum(area_scores.values()) or 1
        sims = self.index.area_similarity(full)
        combined = {a: 0.55 * (area_scores.get(a, 0) / ev_total) + 0.45 * max(0.0, sims.get(a, 0.0)) for a in set(area_scores) | set(sims)}
        areas = _softmax_conf(combined)
        area = {"label": areas[0][0] if areas else "General", "confidence": round(min(0.97, areas[0][1] * 1.6), 2) if areas else 0.0,
                "alternatives": [{"label": a, "confidence": round(c, 2)} for a, c in areas[1:3]]}

        # Content type: textual cues + file extension
        t = " " + normalize(full) + " "
        type_scores = {k: float(sum(t.count(cue) for cue in cues)) for k, cues in CONTENT_TYPE_CUES.items()}
        ext = None
        if filename:
            m = re.search(r"(\.[a-z0-9]+)$", filename.lower())
            ext = m.group(1) if m else None
            if ext in EXTENSION_TYPE_HINTS:
                hint = EXTENSION_TYPE_HINTS[ext]
                type_scores[hint if hint != "photo" else "image"] = type_scores.get(hint if hint != "photo" else "image", 0) + 4
            elif ext == ".pdf":
                type_scores["paper"] += 1
                type_scores["report"] += 1
        types = _softmax_conf(type_scores)
        top_type = types[0][0] if types else "paper"
        if top_type == "image":
            top_type = "photo"
        ctype = {"label": top_type, "display": TYPE_LABELS.get(top_type, top_type.title()), "confidence": round(types[0][1], 2) if types else 0.3,
                 "alternatives": [{"label": k if k != "image" else "photo", "confidence": round(c, 2)} for k, c in types[1:3]], "file_extension": ext}

        return {"content_type": ctype, "region": region, "research_area": area}

    def suggest_locations(self, text: str) -> list[str]:
        t = normalize(text)
        return [loc for loc, kws in LOCATION_KEYWORDS.items() if any(k in t for k in kws)]

    # ── quality ──────────────────────────────────────────────
    @staticmethod
    def quality_checks(meta: dict[str, Any], tags: list[dict[str, Any]], classification: dict[str, Any], text_len: int) -> list[dict[str, Any]]:
        required = ["title", "description", "content_type", "region", "author", "organization", "year", "license"]
        filled = sum(1 for f in required if str(meta.get(f) or "").strip())
        completeness = round(100 * filled / len(required))
        declared = (meta.get("content_type") or "").replace("image", "photo")
        predicted = classification["content_type"]["label"]
        cat_ok = declared == predicted or declared in [a["label"] for a in classification["content_type"]["alternatives"]]
        category = 92 if declared == predicted else (70 if cat_ok else 45)
        polar_concepts = [t for t in tags if t["source"] == "vocabulary"]
        relevance = min(98, 35 + 9 * len(polar_concepts) + int(20 * classification["region"]["confidence"]))
        desc_len = len(str(meta.get("description") or ""))
        richness = min(100, int(30 + desc_len / 6 + text_len / 60))
        return [
            {"key": "completeness", "label": "Metadata completeness", "score": completeness,
             "detail": f"{filled}/{len(required)} required fields provided"},
            {"key": "category", "label": "Content category match", "score": category,
             "detail": f"Declared '{declared or '—'}', AI predicts '{predicted}'"},
            {"key": "relevance", "label": "Polar-science relevance", "score": relevance,
             "detail": f"{len(polar_concepts)} controlled-vocabulary concepts detected"},
            {"key": "richness", "label": "Description richness", "score": richness,
             "detail": f"{desc_len} characters of description, {text_len} characters analysed"},
        ]

    # ── full analysis ────────────────────────────────────────
    def analyze(self, meta: dict[str, Any], file_text: str = "", filename: str | None = None, exclude_id: str | None = None) -> dict[str, Any]:
        t0 = time.perf_counter()
        title = meta.get("title") or ""
        body = " ".join(x for x in [meta.get("description"), meta.get("abstract"), file_text[:20000]] if x)
        if meta.get("keywords"):
            kw = meta["keywords"] if isinstance(meta["keywords"], str) else ", ".join(meta["keywords"])
            body += f" Keywords: {kw}."
        clean_file = _clean_document_text(file_text[:8000], title)
        source = clean_file if len(split_sentences(clean_file)) >= 3 else (meta.get("abstract") or meta.get("description") or clean_file)
        summary = self.summarize(source, title)
        if not summary:
            summary = (meta.get("description") or title).strip()
        tags = self.generate_tags(body, title)
        classification = self.classify_content(body, title, filename)
        key_topics = [t["tag"] for t in tags if t["source"] == "vocabulary"][:6]
        if len(key_topics) < 5:
            key_topics += [t["tag"] for t in tags if t["source"] == "keyphrase" and t["tag"] not in key_topics][: 5 - len(key_topics)]
        similar = self.index.similar_to_text(f"{title}. {body}", k=4, exclude_id=exclude_id)
        duplicate = next((s for s in similar if s["similarity"] >= 0.9), None)
        quality = self.quality_checks(meta, tags, classification, len(body))
        return {
            "summary": summary,
            "key_topics": key_topics,
            "tags": tags,
            "classification": classification,
            "suggested_location_ids": self.suggest_locations(f"{title} {body}"),
            "similar_content": similar,
            "possible_duplicate": duplicate,
            "quality_checks": quality,
            "overall_quality": round(sum(q["score"] for q in quality) / len(quality)),
            "model": {
                "embeddings": self.index.provider.model_label,
                "summarizer": "Extractive (embedding centrality + concept density)",
                "tagger": f"Controlled vocabulary ({len(VOCABULARY)} concepts) + TF-IDF keyphrases",
                "classifier": "Evidence scoring + embedding similarity to labelled centroids",
            },
            "analysed_characters": len(title) + len(body),
            "processing_ms": round((time.perf_counter() - t0) * 1000),
            "human_review_required": True,
        }

    # ── search insight ───────────────────────────────────────
    def search_insight(self, query: str, results: list[dict[str, Any]], concepts: list[str]) -> dict[str, Any] | None:
        if not results:
            return None
        top = results[:6]
        topic_counts: Counter = Counter()
        region_counts: Counter = Counter()
        type_counts: Counter = Counter()
        for r in top:
            for tag in r.get("tags", [])[:5]:
                topic_counts[tag] += 1
            if r.get("region"):
                region_counts[r["region"]] += 1
            type_counts[r["content_type"]] += 1
        generic = {"outreach", "quiz", "photography", "educator kit", "virtual tour", "press release", "documentary", "wildlife", "time-lapse", "classroom"}
        themes = [t for t, _ in topic_counts.most_common(10) if t.lower() not in {c.lower() for c in concepts} and t.lower() not in generic][:4]
        if not themes:
            themes = [t for t, _ in topic_counts.most_common(4)]
        regions = [r for r, _ in region_counts.most_common(2)]

        # Most query-relevant sentences from the top documents (extractive)
        sents: list[tuple[str, str]] = []
        for r in results[:4]:
            for s in split_sentences(r.get("abstract") or r.get("description") or "")[:6]:
                sents.append((s, r["id"]))
        evidence: list[dict[str, Any]] = []
        if sents:
            qv = self.index.embed([query])[0]
            sv = self.index.embed([s for s, _ in sents])
            sims = sv @ qv
            used_docs: set[str] = set()
            for i in np.argsort(-sims):
                s, doc = sents[int(i)]
                if doc in used_docs:
                    continue
                used_docs.add(doc)
                evidence.append({"sentence": s, "content_id": doc, "similarity": round(float(sims[int(i)]), 3)})
                if len(evidence) == 2:
                    break

        def join(items: list[str]) -> str:
            items = [i for i in items if i]
            if len(items) <= 1:
                return "".join(items)
            return ", ".join(items[:-1]) + " and " + items[-1]

        type_phrase = join([f"{n} {TYPE_LABELS.get(t, t).lower()}{'s' if n > 1 and not TYPE_LABELS.get(t, t).endswith('s') else ''}" for t, n in type_counts.most_common(3)])
        lead = f"Research related to “{query}” in PolarSync centres on {join([t.lower() for t in themes]) or 'polar science'}"
        lead += f", with most relevant records from {join(regions)}." if regions else "."
        summary = lead + f" The strongest matches include {type_phrase}."
        if evidence:
            summary += " " + evidence[0]["sentence"]
        return {
            "summary": summary,
            "themes": themes,
            "regions": regions,
            "evidence": evidence,
            "method": "Extractive insight composed from the top-ranked records (no generative model)",
        }

    # Simple idf-weighted word cloud for analytics
    def topic_frequencies(self, docs: list[dict[str, Any]]) -> list[tuple[str, int]]:
        c: Counter = Counter()
        for d in docs:
            for t in d.get("tags") or []:
                c[t] += 1
        return c.most_common(12)


def _clean_document_text(text: str, title: str = "") -> str:
    """Drop heading-like lines (no terminal punctuation) and the repeated title."""
    if not text:
        return ""
    keep = []
    t_norm = normalize(title).strip()
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if t_norm and normalize(line).strip() == t_norm:
            continue
        if len(line) < 120 and not re.search(r"[.!?:;]$", line):
            continue  # heading / caption / page furniture
        keep.append(line)
    return " ".join(keep)


def safe_log(x: float) -> float:
    return math.log(x) if x > 0 else 0.0
