"""Request/response schemas (pydantic)."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization: str | None = None
    title: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class ContentMeta(BaseModel):
    title: str = ""
    description: str = ""
    abstract: str | None = None
    content_type: str = "paper"
    region: str | None = None
    research_area: str | None = None
    author: str | None = None
    organization: str | None = None
    year: int | None = None
    keywords: list[str] = Field(default_factory=list)
    license: str | None = "CC BY 4.0"
    access_level: str | None = "Public"
    location_ids: list[str] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    meta: ContentMeta
    upload_id: str | None = None


class SubmissionCreate(BaseModel):
    meta: ContentMeta
    upload_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    ai_summary: str | None = None
    ai_analysis: dict[str, Any] | None = None
    as_draft: bool = False
    notes: str | None = None


class ReviewEdits(BaseModel):
    title: str | None = None
    tags: list[str] | None = None
    ai_summary: str | None = None
    region: str | None = None
    research_area: str | None = None
    content_type: str | None = None
    location_ids: list[str] | None = None


class ReviewDecision(BaseModel):
    decision: Literal["approved", "rejected", "changes_requested"]
    comments: str | None = None
    edits: ReviewEdits | None = None


class EventIn(BaseModel):
    kind: Literal["view", "download", "media_play", "search"]
    content_id: str | None = None
    query: str | None = None
