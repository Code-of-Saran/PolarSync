"""Domain models.

Persistence is a single SQLite schema (see `app/database/db.py`). These typed
models document the entities and how type-specific records map onto the shared
`content` table: ResearchPaper, Dataset, Report, Media, Story and Expedition are
all `Content` rows distinguished by `content_type`, with type-specific fields in
`extra` (e.g. dataset `coverage`, video `duration`, expedition `stages`).
"""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ContentType = Literal["paper", "dataset", "report", "photo", "video", "press_release", "story", "tour", "quiz", "kit", "expedition"]
ContentStatus = Literal["draft", "under_review", "changes_requested", "approved", "published", "rejected"]


class Role(BaseModel):
    name: Literal["public", "contributor", "admin"]
    description: str


class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization: str | None = None
    title: str | None = None


class Location(BaseModel):
    id: str
    name: str
    description: str
    lat: float
    lng: float
    category: Literal["station", "expedition", "dataset", "media", "event"]
    region: str
    established: int | None = None
    research_areas: list[str] = Field(default_factory=list)
    image: str | None = None


class Metadata(BaseModel):
    """Descriptive metadata shared by all content (Dublin-Core-like)."""
    title: str
    description: str | None = None
    abstract: str | None = None
    author: str | None = None
    organization: str | None = None
    year: int | None = None
    region: str | None = None
    research_area: str | None = None
    keywords: list[str] = Field(default_factory=list)
    license: str | None = None
    access_level: str | None = None


class Tag(BaseModel):
    tag: str
    confidence: float | None = None
    source: Literal["human", "vocabulary", "keyphrase"] = "human"


class Content(Metadata):
    id: str
    content_type: ContentType
    status: ContentStatus
    tags: list[str] = Field(default_factory=list)
    thumbnail: str | None = None
    file_url: str | None = None
    location_ids: list[str] = Field(default_factory=list)
    related_ids: list[str] = Field(default_factory=list)
    extra: dict[str, Any] = Field(default_factory=dict)
    ai_summary: str | None = None
    created_at: str
    updated_at: str


class ResearchPaper(Content):
    content_type: Literal["paper"] = "paper"


class Dataset(Content):
    content_type: Literal["dataset"] = "dataset"


class Report(Content):
    content_type: Literal["report"] = "report"


class Media(Content):
    content_type: Literal["photo", "video", "press_release"]


class Story(Content):
    content_type: Literal["story"] = "story"


class Submission(BaseModel):
    id: str
    content_id: str
    submitted_by: str
    submitted_at: str
    status: Literal["pending", "approved", "rejected", "changes_requested"]
    ai_analysis: dict[str, Any] | None = None
    notes: str | None = None


class Review(BaseModel):
    id: str
    submission_id: str
    reviewer_id: str
    decision: Literal["approved", "rejected", "changes_requested"]
    comments: str | None = None
    edits: dict[str, Any] | None = None
    created_at: str
