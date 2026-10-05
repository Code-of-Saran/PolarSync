from __future__ import annotations

from typing import Any

from fastapi import Depends, Header, HTTPException

from ..database import db


def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any] | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    return db.fetch_one(
        "SELECT u.id, u.name, u.email, u.role, u.organization, u.title FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
        [token],
    )


def require_user(user: dict[str, Any] | None = Depends(current_user)) -> dict[str, Any]:
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user


def require_admin(user: dict[str, Any] = Depends(require_user)) -> dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user


def log_event(kind: str, content_id: str | None = None, query: str | None = None) -> None:
    db.insert("events", {"kind": kind, "content_id": content_id, "query": query, "created_at": db.now_iso(), "simulated": 0})
