"""Contract tests for /jobs/scores progressive TrueScore payload."""

import asyncio
from types import SimpleNamespace

from app.routes import jobs


def test_jobs_scores_returns_canonical_truescore_breakdown(monkeypatch):
    def fake_score_batch(_jobs, _resume_text=None):
        return {
            "job-1": SimpleNamespace(
                true_score=84,
                risk_level="safe",
                cached=False,
                breakdown={
                    "authenticity": 88,
                    "hiring_activity": 75,
                    "hiring_likelihood": 75,
                    "resume_match": 82,
                    "company_reputation": 70,
                    "recency": 90,
                },
            ),
            "job-2": SimpleNamespace(
                true_score=66,
                risk_level="caution",
                cached=True,
                breakdown={
                    "authenticity": 72,
                    "hiring_activity": 58,
                    "hiring_likelihood": 58,
                    "resume_match": 61,
                    "company_reputation": 62,
                    "recency": 68,
                },
            ),
        }

    monkeypatch.setattr(jobs.quick_scorer, "score_batch", fake_score_batch)

    body = jobs.JobScoresBody(
        jobs=[
            {
                "id": "job-1",
                "title": "Backend Engineer",
                "company": "Acme",
                "description": "Python FastAPI",
                "location": "Toronto",
                "days_ago": 1,
            },
            {
                "id": "job-2",
                "title": "Platform Engineer",
                "company": "Beta",
                "description": "AWS Python",
                "location": "Montreal",
                "days_ago": 4,
            },
        ],
        resume_text="Experienced Python backend engineer",
    )

    response = asyncio.run(jobs.get_job_scores(body))

    assert "scores" in response
    assert set(response["scores"].keys()) == {"job-1", "job-2"}

    for score_payload in response["scores"].values():
        assert "true_score" in score_payload
        assert "risk_level" in score_payload
        assert "breakdown" in score_payload
        assert "cached" in score_payload

        breakdown = score_payload["breakdown"]
        assert set(breakdown.keys()) >= {
            "authenticity",
            "hiring_activity",
            "hiring_likelihood",
            "resume_match",
            "company_reputation",
            "recency",
        }

        # Ensure deprecated discover-specific fields never appear
        assert "discovery_score" not in score_payload
        assert "score_breakdown" not in score_payload
