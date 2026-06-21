"""
Task 12 (value without login): the discovery endpoint must work for an
anonymous user — no Authorization header — so job search is usable without an
account. Previously it required auth (`get_current_user`) even though the
user id was unused.
"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from app.services.search_schemas import EnhancedSearchResponse


@pytest.fixture
def disable_rate_limiter():
    from main import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.mark.asyncio
async def test_discover_works_without_auth(disable_rate_limiter):
    fake = EnhancedSearchResponse(query="software engineer intern", total=0)
    with patch(
        "app.routes.discover.enhanced_search",
        new_callable=AsyncMock,
        return_value=fake,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # No Authorization header — anonymous visitor.
            resp = await client.post(
                "/api/jobs/discover",
                json={"query": "software engineer intern", "limit": 10},
            )

    assert resp.status_code == 200, resp.text  # not 401
    assert resp.json()["total"] == 0


@pytest.mark.asyncio
async def test_discover_still_accepts_a_token(disable_rate_limiter):
    # A logged-in user (any bearer) must still be accepted; an invalid token is
    # treated as anonymous, not rejected, on this public value surface.
    fake = EnhancedSearchResponse(query="data analyst", total=0)
    with patch(
        "app.routes.discover.enhanced_search",
        new_callable=AsyncMock,
        return_value=fake,
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post(
                "/api/jobs/discover",
                json={"query": "data analyst", "limit": 10},
                headers={"Authorization": "Bearer not-a-real-token"},
            )

    assert resp.status_code == 200, resp.text
