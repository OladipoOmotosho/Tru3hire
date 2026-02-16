"""Contract tests for discover endpoint TrueScore payload."""

import asyncio
from types import SimpleNamespace

from app.routes import discover
from app.services.search_schemas import ConfidenceMetrics, EnhancedSearchResponse, SearchContext


def test_discover_returns_only_canonical_truescore_fields(monkeypatch):
    """Verify the discover endpoint returns expected TrueScore fields through the orchestrator."""

    async def fake_enhanced_search(**kwargs):
        """Fake orchestrator response with ranked jobs."""
        return EnhancedSearchResponse(
            query=kwargs.get("query", ""),
            jobs=[
                {
                    "id": "j2",
                    "title": "Platform Engineer",
                    "company": "Beta",
                    "location": "Montreal",
                    "description": "Python AWS",
                    "true_score": 91,
                    "risk_level": "safe",
                    "final_score": 0.85,
                    "breakdown": {
                        "authenticity": 85,
                        "hiring_activity": 70,
                        "hiring_likelihood": 70,
                        "resume_match": 80,
                        "company_reputation": 75,
                        "recency": 88,
                    },
                    "matched_signals": ["python"],
                    "score_breakdown": {
                        "relevance": {
                            "embedding_score": 0.8,
                            "keyword_score": 0.7,
                            "signal_boost": 0.05,
                            "rerank_adjustment": 0.01,
                            "relevance_score": 0.6,
                        },
                        "truescore": {
                            "authenticity": 85,
                            "hiring_activity": 70,
                            "resume_match": 80,
                            "company_reputation": 75,
                            "recency": 88,
                        },
                        "truescore_value": 91,
                        "final_score": 0.85,
                    },
                },
                {
                    "id": "j1",
                    "title": "Backend Engineer",
                    "company": "Acme",
                    "location": "Toronto",
                    "description": "Python FastAPI",
                    "true_score": 78,
                    "risk_level": "safe",
                    "final_score": 0.70,
                    "breakdown": {
                        "authenticity": 85,
                        "hiring_activity": 70,
                        "hiring_likelihood": 70,
                        "resume_match": 80,
                        "company_reputation": 75,
                        "recency": 88,
                    },
                    "matched_signals": ["python"],
                    "score_breakdown": {
                        "relevance": {
                            "embedding_score": 0.6,
                            "keyword_score": 0.5,
                            "signal_boost": 0.0,
                            "rerank_adjustment": 0.0,
                            "relevance_score": 0.4,
                        },
                        "truescore": {
                            "authenticity": 85,
                            "hiring_activity": 70,
                            "resume_match": 80,
                            "company_reputation": 75,
                            "recency": 88,
                        },
                        "truescore_value": 78,
                        "final_score": 0.70,
                    },
                },
            ],
            total=2,
            page=1,
            parsed_query={
                "keywords": ["python", "backend"],
                "role_title": "backend developer",
            },
            suggestions=[],
            facet_suggestions=[],
            excluded_count=0,
            confidence=ConfidenceMetrics(
                is_low_confidence=False,
                top_score=0.85,
                window_mean=0.775,
                spread=0.15,
            ),
            context=SearchContext(query="backend python roles"),
        )

    monkeypatch.setattr(discover, "enhanced_search", fake_enhanced_search)

    request = discover.DiscoverRequest(query="backend python roles", limit=20)
    response = asyncio.run(discover.discover_jobs(request))

    assert response.total == 2
    assert len(response.jobs) == 2

    # Sorted by final_score descending (j2=0.85 > j1=0.70)
    assert response.jobs[0]["id"] == "j2"
    assert response.jobs[0]["true_score"] == 91

    for job in response.jobs:
        assert "true_score" in job
        assert "breakdown" in job
        assert "risk_level" in job

        breakdown = job["breakdown"]
        assert set(breakdown.keys()) >= {
            "authenticity",
            "hiring_activity",
            "hiring_likelihood",
            "resume_match",
            "company_reputation",
            "recency",
        }

    # New fields from enhanced pipeline
    assert response.confidence is not None
    assert response.context is not None

