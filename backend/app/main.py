"""PolarSync API — FastAPI application."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import analytics, auth, content, search, workflow
from .config import CORS_ORIGINS, UPLOAD_DIR
from .database import db, seed
from .services import get_ai, get_index, init_services, services

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("polarsync")

DROP_ORDER = ["reviews", "submissions", "events", "sessions", "content", "locations", "users", "roles"]


def seed_database(reset: bool = False) -> None:
    if reset:
        with db.get_conn() as conn:
            for t in DROP_ORDER:
                conn.execute(f"DROP TABLE IF EXISTS {t}")
    fresh = db.init_db() or reset
    if not fresh and db.fetch_one("SELECT COUNT(*) AS n FROM content")["n"] == 0:
        fresh = True
    if fresh:
        log.info("Seeding prototype sample data ...")
        seed.seed_base()
    if services.index is None:
        init_services()
    else:
        get_index().rebuild()
    if fresh:
        seed.seed_pending(get_ai())
        seed.seed_events()
        log.info("Seed complete")


@asynccontextmanager
async def lifespan(_: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    seed_database(reset=os.environ.get("POLARSYNC_RESET") == "1")
    yield


app = FastAPI(
    title="PolarSync API",
    version="2.0.0",
    description="Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal — SIH 2026 prototype (SIH26063).",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in (auth.router, content.router, search.router, workflow.router, analytics.router):
    app.include_router(r)

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(UPLOAD_DIR)), name="files")


@app.get("/api/health")
def health():
    idx = services.index
    return {"status": "ok", "documents_indexed": len(idx.docs) if idx else 0, "embeddings": idx.provider.model_label if idx else None}
