"""Contract tests for discover endpoint TrueScore payload."""

from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
import pytest

from main import app
from app.services.search_schemas import ConfidenceMetrics, EnhancedSearchResponse, SearchContext


@pytest.fixture
def disable_rate_limiter():
    """Disable slowapi rate limiter for tests."""
    # Disable the limiter globally during tests
    from app.routes.discover import limiter
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.mark.asyncio
async def test_discover_returns_only_canonical_truescore_fields(disable_rate_limiter):
    """Verify the discover endpoint returns expected TrueScore fields through the orchestrator."""

    fake_result = EnhancedSearchResponse(
        query="backend python roles",
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

    with patch(
        "app.routes.discover.enhanced_search",
        new_callable=AsyncMock,
        return_value=fake_result,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/jobs/discover",
                json={"query": "backend python roles", "limit": 20},
            )

        assert resp.status_code == 200
        data = resp.json()

        assert data["total"] == 2
        assert len(data["jobs"]) == 2

        # Sorted by final_score descending (j2=0.85 > j1=0.70)
        assert data["jobs"][0]["id"] == "j2"
        assert data["jobs"][0]["true_score"] == 91

        for job in data["jobs"]:
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
        assert data["confidence"] is not None
        assert data["context"] is not None
