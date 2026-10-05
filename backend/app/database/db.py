"""SQLite persistence layer.

A deliberately thin repository abstraction over the stdlib `sqlite3` module.
All SQL lives here so the storage engine (e.g. PostgreSQL) can be swapped later
without touching the API or service layers.
"""
from __future__ import annotations

import json
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from ..config import DB_PATH

_write_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY,
    description TEXT
);
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES roles(name),
    organization TEXT,
    title TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    established INTEGER,
    research_areas TEXT,     -- JSON list
    image TEXT,
    extra TEXT               -- JSON object
);
-- One table for every publishable item (paper, dataset, report, photo, video,
-- press_release, story, expedition). Type-specific fields live in `extra`.
CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    abstract TEXT,
    content_type TEXT NOT NULL,
    region TEXT,
    research_area TEXT,
    author TEXT,
    organization TEXT,
    year INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    tags TEXT,               -- JSON list
    keywords TEXT,           -- JSON list
    thumbnail TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size TEXT,
    file_format TEXT,
    license TEXT,
    access_level TEXT,
    location_ids TEXT,       -- JSON list
    related_ids TEXT,        -- JSON list (curated links)
    extra TEXT,              -- JSON object
    ai_summary TEXT,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    citations INTEGER DEFAULT 0,
    submitted_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES content(id),
    submitted_by TEXT NOT NULL REFERENCES users(id),
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL,    -- pending | approved | rejected | changes_requested
    ai_analysis TEXT,        -- JSON produced by AIService at upload time
    notes TEXT,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES submissions(id),
    reviewer_id TEXT NOT NULL REFERENCES users(id),
    decision TEXT NOT NULL,  -- approved | rejected | changes_requested
    comments TEXT,
    edits TEXT,              -- JSON: metadata edited by the reviewer
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,      -- view | search | download | media_play
    content_id TEXT,
    query TEXT,
    created_at TEXT NOT NULL,
    simulated INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
"""

JSON_COLUMNS = {"tags", "keywords", "location_ids", "related_ids", "extra", "research_areas", "ai_analysis", "edits"}


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_conn():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    d = dict(row)
    for k, v in d.items():
        if k in JSON_COLUMNS and isinstance(v, str):
            try:
                d[k] = json.loads(v)
            except json.JSONDecodeError:
                pass
    return d


def _encode(values: dict[str, Any]) -> dict[str, Any]:
    return {k: (json.dumps(v) if k in JSON_COLUMNS and v is not None else v) for k, v in values.items()}


def init_db(reset: bool = False) -> bool:
    """Create tables. Returns True if the database was freshly created."""
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    fresh = reset or not Path(DB_PATH).exists()
    if reset and Path(DB_PATH).exists():
        Path(DB_PATH).unlink()
    with get_conn() as conn:
        conn.executescript(SCHEMA)
    return fresh


# ─────────────────────────────────────────────────────────────
# Generic helpers
# ─────────────────────────────────────────────────────────────

def insert(table: str, values: dict[str, Any]) -> None:
    vals = _encode(values)
    cols = ", ".join(vals.keys())
    qs = ", ".join("?" for _ in vals)
    with _write_lock, get_conn() as conn:
        conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({qs})", list(vals.values()))


def insert_many(table: str, rows: Iterable[dict[str, Any]]) -> None:
    rows = [_encode(r) for r in rows]
    if not rows:
        return
    cols = list(rows[0].keys())
    sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join('?' for _ in cols)})"
    with _write_lock, get_conn() as conn:
        conn.executemany(sql, [[r.get(c) for c in cols] for r in rows])


def update(table: str, key: str, key_value: Any, values: dict[str, Any]) -> None:
    vals = _encode(values)
    sets = ", ".join(f"{k} = ?" for k in vals)
    with _write_lock, get_conn() as conn:
        conn.execute(f"UPDATE {table} SET {sets} WHERE {key} = ?", [*vals.values(), key_value])


def fetch_one(sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
    with get_conn() as conn:
        return row_to_dict(conn.execute(sql, list(params)).fetchone())


def fetch_all(sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
    with get_conn() as conn:
        return [row_to_dict(r) for r in conn.execute(sql, list(params)).fetchall()]


def execute(sql: str, params: Iterable[Any] = ()) -> None:
    with _write_lock, get_conn() as conn:
        conn.execute(sql, list(params))
