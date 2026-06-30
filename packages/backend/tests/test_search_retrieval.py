"""
Golden tests for the retrieval-layer recall fix.

Root cause being guarded: the Adzuna query used to AND-stack `title_only`
(role+seniority in the title), `what_phrase` (exact phrase), and seniority in
`what` — which returned 0 results for common queries like "data analyst intern".
The fix moves precision out of the brittle API constraints and into the ranker.

These are unit tests (no network): they assert the *shape* of what we send to
Adzuna and how retrieval queries are built. Both historic failure modes are
locked down — zero-recall (this file) and wrong-seniority (test_enhanced_search_*).
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.jobs import search_jobs
from app.services.query_resolver import ParsedJobQuery
from app.services.search_orchestrator import _build_retrieval_queries
from app.services.signal_extractor import SignalExtractionResult


# =============================================================================
# Retrieval query construction (orchestrator)
# =============================================================================

class TestRetrievalQueries:
    def test_primary_is_broad_with_dedicated_seniority_rewrite(self):
        pq = ParsedJobQuery(
            role_title="software engineer",
            seniority="intern",
            keywords=["software engineer"],
        )
        qs = _build_retrieval_queries(pq, "software engineer intern")
        # Broad primary carries NO seniority (max recall)...
        assert qs[0] == "software engineer"
        assert "intern" not in qs[0]
        # ...but a seniority-targeted rewrite still pulls intern roles into the pool.
        assert any("intern" in q for q in qs[1:])

    def test_no_seniority_query_is_unchanged(self):
        pq = ParsedJobQuery(role_title="frontend developer", keywords=["frontend developer"])
        qs = _build_retrieval_queries(pq, "frontend developer")
        assert qs[0] == "frontend developer"

    def test_senior_query_targets_senior_but_primary_broad(self):
        pq = ParsedJobQuery(
            role_title="data engineer",
            seniority="senior",
            keywords=["data engineer"],
        )
        qs = _build_retrieval_queries(pq, "senior data engineer")
        assert qs[0] == "data engineer"  # broad — fixes "2 results" over-constraint
        assert any(q.startswith("senior ") for q in qs[1:])

    def test_seniority_already_in_base_not_duplicated(self):
        pq = ParsedJobQuery(role_title="senior developer", seniority="senior", keywords=["senior developer"])
        qs = _build_retrieval_queries(pq, "senior developer")
        # No "senior senior developer"
        assert all("senior senior" not in q for q in qs)


# =============================================================================
# Adzuna parameter construction (jobs.py)
# =============================================================================

class _FakeResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"results": [], "count": 0}


class _FakeClient:
    """Captures the params dict passed to client.get."""

    def __init__(self, sink: dict):
        self._sink = sink

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, params=None):
        self._sink.update(params or {})
        return _FakeResponse()


@pytest.mark.asyncio
class TestAdzunaParams:
    async def test_external_parse_drops_title_only_and_phrase(self):
        pq = ParsedJobQuery(
            role_title="data analyst",
            seniority="intern",
            keywords=["data analyst"],
            original_query="data analyst intern",
        )
        captured: dict = {}
        with patch("app.services.jobs.ADZUNA_APP_ID", "x"), \
             patch("app.services.jobs.ADZUNA_APP_KEY", "y"), \
             patch("app.services.jobs.httpx.AsyncClient", return_value=_FakeClient(captured)):
            await search_jobs(query="data analyst", parsed_query=pq)

        assert "title_only" not in captured
        assert "what_phrase" not in captured
        # Orchestrator path: `what` is the verbatim retrieval variation; seniority
        # is NOT force-appended (the orchestrator decides that per-query).
        assert captured.get("what") == "data analyst"

    async def test_legacy_path_keeps_mild_seniority_bias(self):
        pq = ParsedJobQuery(
            role_title="data analyst",
            seniority="intern",
            keywords=["data analyst"],
            original_query="data analyst intern",
        )
        captured: dict = {}
        extraction = SignalExtractionResult(
            signals=[], original_query="data analyst intern", fallback_used=False, parsed_json=None
        )
        with patch("app.services.jobs.ADZUNA_APP_ID", "x"), \
             patch("app.services.jobs.ADZUNA_APP_KEY", "y"), \
             patch("app.services.jobs.extract_signals", new=AsyncMock(return_value=extraction)), \
             patch("app.services.jobs.resolve_signals", return_value=pq), \
             patch("app.services.jobs.httpx.AsyncClient", return_value=_FakeClient(captured)):
            # parsed_query=None → internal parse → legacy single-query path
            await search_jobs(query="data analyst intern")

        assert "title_only" not in captured
        assert "what_phrase" not in captured
        # Legacy path (no ranker) keeps seniority as a mild keyword bias.
        assert "intern" in captured.get("what", "")

    async def test_exclude_terms_still_passed(self):
        pq = ParsedJobQuery(
            role_title="developer",
            keywords=["developer"],
            exclude_terms=["senior", "manager"],
            original_query="developer",
        )
        captured: dict = {}
        with patch("app.services.jobs.ADZUNA_APP_ID", "x"), \
             patch("app.services.jobs.ADZUNA_APP_KEY", "y"), \
             patch("app.services.jobs.httpx.AsyncClient", return_value=_FakeClient(captured)):
            await search_jobs(query="developer", parsed_query=pq)

        assert captured.get("what_exclude") == "senior manager"
