"""Embedding providers.

Two interchangeable providers implement `fit(corpus)` + `embed(texts)`:

* SentenceTransformerProvider – neural sentence embeddings
  (sentence-transformers/all-MiniLM-L6-v2, 384-d). Used automatically when the
  optional `sentence-transformers` package is installed.
* LSAProvider – Latent Semantic Analysis (TF-IDF + truncated SVD) implemented
  with numpy only. Captures term co-occurrence ("ice shelf" ~ "glacier") without
  any ML dependency. Used as a fallback so the prototype always runs.

Select explicitly with env var POLARSYNC_EMBEDDER = "sentence-transformers" | "lsa" | "auto".
"""
from __future__ import annotations

import logging
import math
import os
from collections import Counter

import numpy as np

from .text import stems

log = logging.getLogger("polarsync.embeddings")


class EmbeddingProvider:
    name = "base"
    model_label = "base"
    dim = 0

    def fit(self, corpus: list[str]) -> None:  # pragma: no cover - interface
        pass

    def embed(self, texts: list[str]) -> np.ndarray:  # pragma: no cover - interface
        raise NotImplementedError


class LSAProvider(EmbeddingProvider):
    name = "lsa"

    def __init__(self, k: int = 96):
        self.k = k
        self.vocab: dict[str, int] = {}
        self.idf: np.ndarray | None = None
        self.components: np.ndarray | None = None  # (k, V)
        self.model_label = f"LSA-{k} (TF-IDF + SVD, local)"

    def _tf(self, text: str) -> Counter:
        toks = stems(text)
        # include bigrams so phrases like "sea ice" carry signal
        grams = toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:])]
        return Counter(grams)

    def fit(self, corpus: list[str]) -> None:
        tfs = [self._tf(t) for t in corpus]
        df: Counter = Counter()
        for tf in tfs:
            df.update(tf.keys())
        terms = [t for t, n in df.items() if n >= 1]
        self.vocab = {t: i for i, t in enumerate(sorted(terms))}
        n_docs = len(corpus)
        self.idf = np.zeros(len(self.vocab))
        for t, i in self.vocab.items():
            self.idf[i] = math.log((1 + n_docs) / (1 + df[t])) + 1
        X = self._matrix(tfs)
        # truncated SVD on the doc-term matrix
        _, s, vt = np.linalg.svd(X, full_matrices=False)
        k = min(self.k, vt.shape[0])
        self.components = vt[:k]
        self.dim = k

    def _matrix(self, tfs: list[Counter]) -> np.ndarray:
        X = np.zeros((len(tfs), len(self.vocab)))
        for r, tf in enumerate(tfs):
            for t, c in tf.items():
                i = self.vocab.get(t)
                if i is not None:
                    X[r, i] = (1 + math.log(c)) * self.idf[i]
        norms = np.linalg.norm(X, axis=1, keepdims=True)
        norms[norms == 0] = 1
        return X / norms

    def embed(self, texts: list[str]) -> np.ndarray:
        X = self._matrix([self._tf(t) for t in texts])
        E = X @ self.components.T
        norms = np.linalg.norm(E, axis=1, keepdims=True)
        norms[norms == 0] = 1
        return E / norms


class SentenceTransformerProvider(EmbeddingProvider):
    name = "sentence-transformers"
    MODEL = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self):
        from sentence_transformers import SentenceTransformer  # noqa: WPS433 (optional dep)

        try:
            self.model = SentenceTransformer(self.MODEL, local_files_only=True)
        except Exception:  # first run: download the model (~90 MB)
            log.info("Downloading %s ...", self.MODEL)
            self.model = SentenceTransformer(self.MODEL)
        getdim = getattr(self.model, "get_embedding_dimension", None) or self.model.get_sentence_embedding_dimension
        self.dim = getdim() or 384
        self.model_label = "all-MiniLM-L6-v2 (Sentence-Transformers, 384-d)"

    def embed(self, texts: list[str]) -> np.ndarray:
        return np.asarray(self.model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False))


def create_provider() -> EmbeddingProvider:
    choice = os.environ.get("POLARSYNC_EMBEDDER", "auto").lower()
    if choice in ("auto", "sentence-transformers", "st"):
        try:
            p = SentenceTransformerProvider()
            log.info("Embedding provider: %s", p.model_label)
            return p
        except Exception as exc:  # package missing / offline / blocked
            if choice != "auto":
                log.warning("sentence-transformers unavailable (%s); falling back to LSA", exc)
            else:
                log.info("sentence-transformers not available (%s); using LSA", type(exc).__name__)
    p = LSAProvider()
    log.info("Embedding provider: %s", p.model_label)
    return p
