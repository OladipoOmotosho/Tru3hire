"""
Tests for application tracking: duplicate check, company stats upsert, API contracts.
Uses dependency override for auth to avoid requiring real Clerk JWT.
"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from app.routes.applications import get_current_user


# Override auth to return a test user ID
async def mock_get_current_user():
    return "test-user-application-tracking"


@pytest.fixture
def auth_override():
    """Override get_current_user for tests."""
    from fastapi import Depends
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_create_application_success(client, auth_override):
    """Creating an application returns 201 and application_id."""
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    resp = await client.post(
        "/api/applications",
        json={
            "job_title": "Software Engineer",
            "company_name": "TestCorp",
            "job_id": job_id,
            "job_url": f"https://example.com/job/{job_id}",
            "true_score_at_apply": 85,
            "job_age_days": 3,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data.get("success") is True
    assert "application_id" in data


@pytest.mark.asyncio
async def test_duplicate_application_returns_409(client, auth_override):
    """Creating a duplicate application (same user + job_id) returns 409."""
    job_id = f"job-dup-{uuid.uuid4().hex[:12]}"
    payload = {
        "job_title": "Duplicate Job",
        "company_name": "DupCorp",
        "job_id": job_id,
        "job_url": f"https://example.com/job/{job_id}",
    }
    # First create
    r1 = await client.post("/api/applications", json=payload)
    assert r1.status_code == 201

    # Duplicate by job_id
    r2 = await client.post("/api/applications", json=payload)
    assert r2.status_code == 409
    assert "already tracked" in r2.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_duplicate_application_by_url_returns_409(client, auth_override):
    """Creating a duplicate application (same user + job_url) returns 409."""
    url_suffix = uuid.uuid4().hex[:12]
    payload = {
        "job_title": "URL Dup Job",
        "company_name": "URLDupCorp",
        "job_url": f"https://example.com/job/url-dup-{url_suffix}",
    }
    r1 = await client.post("/api/applications", json=payload)
    assert r1.status_code == 201

    r2 = await client.post("/api/applications", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_record_outcome_updates_company_stats(client, auth_override):
    """Recording an outcome updates company_response_stats."""
    job_id = f"job-stats-{uuid.uuid4().hex[:12]}"
    # Create application
    r_create = await client.post(
        "/api/applications",
        json={
            "job_title": "Stats Test Job",
            "company_name": "StatsTestCompany",
            "job_id": job_id,
            "job_url": f"https://example.com/job/{job_id}",
        },
    )
    assert r_create.status_code == 201
    app_id = r_create.json()["application_id"]

    # Record outcome (interview)
    r_outcome = await client.post(
        f"/api/applications/{app_id}/outcome",
        json={"outcome": "interview", "days_to_response": 5},
    )
    assert r_outcome.status_code == 201

    # Fetch company stats
    r_stats = await client.get(
        "/api/applications/companies/StatsTestCompany/stats",
    )
    assert r_stats.status_code == 200
    data = r_stats.json()
    assert data.get("total_applications", 0) >= 1
    assert data.get("total_responses", 0) >= 1
    assert data.get("total_interviews", 0) >= 1


@pytest.mark.asyncio
async def test_company_stats_endpoint_returns_aggregates(client, auth_override):
    """GET /companies/{name}/stats returns expected structure."""
    # Unknown company returns graceful empty structure
    r = await client.get("/api/applications/companies/NonexistentCorp999/stats")
    assert r.status_code == 200
    data = r.json()
    assert "company_name" in data
    assert data.get("total_applications", 0) == 0 or "message" in data
