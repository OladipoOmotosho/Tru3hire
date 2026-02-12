"""Contract tests for discover endpoint TrueScore payload."""

import asyncio
from types import SimpleNamespace

from app.routes import discover


class _ParsedQueryStub:
    def __init__(self):
        self.keywords = ["python", "backend"]
        self.role_title = "backend developer"
        self.seniority = None
        self.location_preference = ""
        self.city_preference = ""
        self.job_type = "all"
        self.exclude_terms = []

    def model_dump(self):
        return {
            "keywords": self.keywords,
            "role_title": self.role_title,
            "seniority": self.seniority,
            "location_preference": self.location_preference,
            "city_preference": self.city_preference,
            "job_type": self.job_type,
            "exclude_terms": self.exclude_terms,
        }


def test_discover_returns_only_canonical_truescore_fields(monkeypatch):
    async def fake_extract_signals(_query: str):
        return SimpleNamespace(signals=["python", "backend"], fallback_used=False)

    def fake_resolve_signals(_signals, _query):
        return _ParsedQueryStub()

    async def fake_search_jobs(**_kwargs):
        return {
            "jobs": [
                {
                    "id": "j1",
                    "title": "Backend Engineer",
                    "company": "Acme",
                    "location": "Toronto",
                    "description": "Python FastAPI",
                    "salary_display": "$100,000",
                    "category": "IT Jobs",
                    "days_ago": 2,
                    "redirect_url": "https://example.com/j1",
                },
                {
                    "id": "j2",
                    "title": "Platform Engineer",
                    "company": "Beta",
                    "location": "Montreal",
                    "description": "Python AWS",
                    "salary_display": "$110,000",
                    "category": "IT Jobs",
                    "days_ago": 1,
                    "redirect_url": "https://example.com/j2",
                },
            ],
            "total": 2,
        }

    class _FakeAggregator:
        @staticmethod
        def analyze(job_text: str):
            if "Platform Engineer" in job_text:
                score = 91
            else:
                score = 78
            return SimpleNamespace(
                true_score=score,
                risk_level="safe",
                breakdown=SimpleNamespace(
                    authenticity=85,
                    hiring_activity=70,
                    resume_match=80,
                    company_reputation=75,
                    recency=88,
                ),
            )

    def fake_analyze_results(_jobs, _parsed_query):
        return SimpleNamespace(suggestions=[], facet_suggestions=[], distribution={})

    monkeypatch.setattr(discover, "extract_signals", fake_extract_signals)
    monkeypatch.setattr(discover, "resolve_signals", fake_resolve_signals)
    monkeypatch.setattr(discover, "search_jobs", fake_search_jobs)
    monkeypatch.setattr(discover, "true_score_aggregator", _FakeAggregator())
    monkeypatch.setattr(discover, "analyze_results", fake_analyze_results)

    request = discover.DiscoverRequest(query="backend python roles", limit=20)
    response = asyncio.run(discover.discover_jobs(request))

    assert response.total == 2
    assert len(response.jobs) == 2

    # Sorted by canonical true_score descending
    assert response.jobs[0]["id"] == "j2"
    assert response.jobs[0]["true_score"] == 91

    for job in response.jobs:
        assert "true_score" in job
        assert "breakdown" in job
        assert "risk_level" in job

        # Legacy discover-specific fields should not exist
        assert "discovery_score" not in job
        assert "score_breakdown" not in job

        breakdown = job["breakdown"]
        assert set(breakdown.keys()) >= {
            "authenticity",
            "hiring_activity",
            "hiring_likelihood",
            "resume_match",
            "company_reputation",
            "recency",
        }
