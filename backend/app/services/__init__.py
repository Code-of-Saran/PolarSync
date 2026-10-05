"""Service singletons, created once at application start-up."""
from __future__ import annotations

import logging

from .ai_service import AIService
from .embeddings import create_provider
from .search_service import SearchIndex

log = logging.getLogger("polarsync")


class Services:
    index: SearchIndex | None = None
    ai: AIService | None = None


services = Services()


def init_services() -> None:
    provider = create_provider()
    services.index = SearchIndex(provider)
    services.index.rebuild()
    services.ai = AIService(services.index)
    log.info("Search index ready: %s", services.index.stats())


def get_index() -> SearchIndex:
    assert services.index is not None
    return services.index


def get_ai() -> AIService:
    assert services.ai is not None
    return services.ai
