"""
Tests for funnel analytics (Task 13).

Service tests run against a throwaway temp SQLite via monkeypatch (never the
configured/prod DB). Endpoint tests mock record_event so they exercise only the
route's allow-list logic.
"""

import sqlite3
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.services import analytics
from main import app

CREATE_TABLE = """
CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    anon_bucket TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""


@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    db = str(tmp_path / "analytics.db")
    conn = sqlite3.connect(db)
    conn.execute(CREATE_TABLE)
    conn.commit()
    conn.close()

    def factory():
        c = sqlite3.connect(db)
        c.row_factory = sqlite3.Row
        return c

    monkeypatch.setattr(analytics, "get_db_connection", factory)
    monkeypatch.setattr(analytics, "USE_POSTGRES", False)
    monkeypatch.setattr(analytics, "get_cursor", lambda conn: conn.cursor())
    return db


class TestRecordEvent:
    def test_inserts_an_allowed_event(self, temp_db):
        assert analytics.record_event("check_run") is True
        assert analytics.aggregate_counts().get("check_run") == 1

    def test_ignores_unknown_event(self, temp_db):
        assert analytics.record_event("definitely_not_allowed") is False
        assert analytics.aggregate_counts() == {}

    def test_never_raises_on_db_failure(self, monkeypatch):
        # Point at a connection factory that explodes — must return False, not raise.
        def boom():
            raise RuntimeError("db down")

        monkeypatch.setattr(analytics, "get_db_connection", boom)
        assert analytics.record_event("check_run") is False


class TestAggregateCounts:
    def test_k_anon_floor_suppresses_small_buckets(self, temp_db):
        for _ in range(5):
            analytics.record_event("search_run")
        for _ in range(3):
            analytics.record_event("shared")

        floored = analytics.aggregate_counts(k_anon_floor=5)
        assert floored.get("search_run") == 5
        assert "shared" not in floored  # 3 < 5 → suppressed

        raw = analytics.aggregate_counts(k_anon_floor=1)
        assert raw.get("shared") == 3


class TestEventsEndpoint:
    @pytest.fixture
    def disable_rate_limiter(self):
        from main import limiter

        limiter.enabled = False
        yield
        limiter.enabled = True

    @pytest.mark.asyncio
    async def test_accepts_allowed_event(self, disable_rate_limiter):
        with patch("app.routes.events.record_event") as rec:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/api/events", json={"event_type": "shared"})
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}
        rec.assert_called_once_with("shared")

    @pytest.mark.asyncio
    async def test_rejects_unknown_event(self, disable_rate_limiter):
        with patch("app.routes.events.record_event") as rec:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/api/events", json={"event_type": "garbage"})
        assert resp.status_code == 400
        rec.assert_not_called()
