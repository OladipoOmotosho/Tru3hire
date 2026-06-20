"""
Integration test for the discovery pipeline (Task 10.5).

End-to-end proof of the reported bug fix: an explicit "intern" query must not
surface senior-titled roles. Adzuna (`search_jobs`), the LLM signal extractor,
and the expensive TrueScore/embedding steps are mocked so the test exercises the
real orchestrator wiring (retrieval-query build → hard exclusions → seniority
filter → rank) without any network calls.
"""

from unittest.mock import patch

import pytest

from app.services import search_orchestrator as so
from app.services.signal_extractor import SignalExtractionResult

ADZUNA_JOBS = [
    {"id": "intern-1", "title": "Software Engineer Intern", "description": "internship", "company": "A", "location": "Toronto"},
    {"id": "senior-1", "title": "Senior Software Engineer", "description": "5+ years", "company": "B", "location": "Toronto"},
    {"id": "plain-1", "title": "Software Engineer", "description": "build things", "company": "C", "location": "Toronto"},
    {"id": "lead-1", "title": "Lead Software Engineer", "description": "lead a team", "company": "D", "location": "Toronto"},
]


async def _fake_search_jobs(query, **kwargs):
    # Every retrieval sub-query returns the same pool; the orchestrator dedups.
    return {"jobs": [dict(j) for j in ADZUNA_JOBS], "total": len(ADZUNA_JOBS)}


async def _fake_truescores(jobs):
    return {}


async def _fake_embeddings(query, jobs):
    return {}


def _fake_extract(*_args, **_kwargs):
    # Deterministic signals that resolve to role=software engineer, seniority=intern.
    return SignalExtractionResult(
        signals=["software engineer", "intern"],
        original_query="software engineer intern",
        fallback_used=False,
    )


@pytest.mark.asyncio
async def test_intern_query_excludes_senior_titles():
    with (
        patch.object(so, "extract_signals", side_effect=_fake_extract),
        patch.object(so, "search_jobs", side_effect=_fake_search_jobs),
        patch.object(so, "_compute_truescores_async", side_effect=_fake_truescores),
        patch.object(so, "_compute_embedding_scores_async", side_effect=_fake_embeddings),
    ):
        result = await so.enhanced_search(query="software engineer intern blockchain", limit=10)

    titles = [j.get("title", "") for j in result.jobs]
    # The whole point: no senior/lead roles for an explicit intern search.
    assert "Senior Software Engineer" not in titles
    assert "Lead Software Engineer" not in titles
    # Intern (and the unspecified role) survive.
    assert "Software Engineer Intern" in titles
    assert result.excluded_count >= 2


@pytest.mark.asyncio
async def test_extraction_runs_once_per_search():
    """Efficiency (10.4): the LLM extractor is called exactly once, even though
    several Adzuna sub-queries are issued."""
    with (
        patch.object(so, "extract_signals", side_effect=_fake_extract) as mock_extract,
        patch.object(so, "search_jobs", side_effect=_fake_search_jobs) as mock_search,
        patch.object(so, "_compute_truescores_async", side_effect=_fake_truescores),
        patch.object(so, "_compute_embedding_scores_async", side_effect=_fake_embeddings),
    ):
        await so.enhanced_search(query="software engineer intern unique-xyz", limit=10)

    assert mock_extract.call_count == 1, "signal extraction must run once per search"
    # Multiple Adzuna sub-queries are still issued (recall), but none re-extract.
    assert mock_search.call_count >= 1
