"""
Phase 0 tests: embeddings provider visibility, enforced rate limits,
honest health/readiness.

Validates .agent/90-day-roadmap requirements 1-3 (Properties P1, P2, P3).
No external network calls: provider selection is tested via env patching,
rate limits via X-Forwarded-For bucketing, readiness via dependency mocking.
"""

import importlib

import pytest
from fastapi.testclient import TestClient

import main
from app.config import rate_limits
from app.ml import embeddings
from app.services import health


@pytest.fixture()
def client():
    # Context manager runs the lifespan (DB init against local SQLite)
    with TestClient(main.app) as c:
        yield c


# =============================================================================
# Requirement 1 — provider selection and visibility (Property P3)
# =============================================================================

class TestEmbeddingsProvider:
    def test_prefers_gemini_when_key_set(self, monkeypatch):
        monkeypatch.setenv("GEMINI_API_KEY", "test-key-not-real")
        status = embeddings.get_embedding_status()
        if not status["gemini_package_installed"]:
            pytest.skip("google-genai not installed in this environment")
        assert status["preferred_provider"] == "gemini"
        assert status["gemini_api_key_set"] is True

    def test_degrades_without_key(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        status = embeddings.get_embedding_status()
        assert status["preferred_provider"] in ("local", "none")
        assert status["gemini_api_key_set"] is False

    def test_health_service_maps_none_to_keyword_fallback(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        provider, degraded = health.get_embeddings_status()
        assert provider in ("local", "keyword-fallback")
        assert degraded is True  # anything but gemini is degraded

    def test_health_endpoint_reports_provider(self, client, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        res = client.get("/health")
        assert res.status_code == 200
        services = res.json()["services"]
        assert "embeddings_provider" in services
        assert services["embeddings_provider"] in ("gemini", "local", "keyword-fallback")

    def test_startup_succeeds_without_key(self, monkeypatch):
        """Graceful degradation: app must boot with no Gemini key (Req 1.5)."""
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        with TestClient(main.app) as c:
            assert c.get("/health").status_code == 200


# =============================================================================
# Requirement 2 — rate limiting (Property P2)
# =============================================================================

class TestRateLimits:
    def test_report_scam_returns_429_over_limit(self, client):
        """N requests under the limit pass; N+1 gets 429 with Retry-After."""
        limit_n = int(rate_limits.REPORT_LIMIT.split("/")[0])
        headers = {"X-Forwarded-For": "203.0.113.10"}  # unique bucket for this test
        body = {
            "job_text": "Suspicious posting: send a deposit to activate your account today.",
            "reason": "Asked for money upfront before any interview took place.",
        }

        statuses = []
        for _ in range(limit_n + 1):
            res = client.post("/api/report-scam", json=body, headers=headers)
            statuses.append(res.status_code)

        assert all(s != 429 for s in statuses[:limit_n]), f"unexpected 429 under limit: {statuses}"
        assert statuses[-1] == 429, f"expected 429 over limit, got: {statuses}"

    def test_429_includes_retry_after(self, client):
        headers = {"X-Forwarded-For": "203.0.113.11"}
        body = {
            "job_text": "Earn $900 daily completing simple app tasks, crypto payout same day.",
            "reason": "Classic task scam pattern with crypto payout.",
        }
        limit_n = int(rate_limits.REPORT_LIMIT.split("/")[0])
        last = None
        for _ in range(limit_n + 1):
            last = client.post("/api/report-scam", json=body, headers=headers)
        assert last is not None and last.status_code == 429
        assert "retry-after" in {k.lower() for k in last.headers.keys()}

    def test_buckets_isolated_by_forwarded_ip(self, client):
        """Two clients (different XFF) must not share a bucket."""
        body = {
            "job_text": "Immediate hire, no interview, pay a small training fee to begin work.",
            "reason": "Upfront fee requested - reporting for the community.",
        }
        limit_n = int(rate_limits.REPORT_LIMIT.split("/")[0])
        # Exhaust bucket A
        for _ in range(limit_n + 1):
            client.post("/api/report-scam", json=body, headers={"X-Forwarded-For": "203.0.113.12"})
        # Bucket B must still be open
        res = client.post("/api/report-scam", json=body, headers={"X-Forwarded-For": "203.0.113.13"})
        assert res.status_code != 429

    def test_limits_configurable_via_env(self, monkeypatch):
        monkeypatch.setenv("RL_REPORT", "99/minute")
        reloaded = importlib.reload(rate_limits)
        try:
            assert reloaded.REPORT_LIMIT == "99/minute"
        finally:
            monkeypatch.delenv("RL_REPORT")
            importlib.reload(rate_limits)

    def test_user_key_prefers_bearer_token_over_ip(self):
        class FakeRequest:
            def __init__(self, headers):
                self.headers = headers
                self.client = None

        a = rate_limits.user_or_ip_key(FakeRequest({"authorization": "Bearer token-a",
                                                    "x-forwarded-for": "1.2.3.4"}))
        b = rate_limits.user_or_ip_key(FakeRequest({"authorization": "Bearer token-b",
                                                    "x-forwarded-for": "1.2.3.4"}))
        anon = rate_limits.user_or_ip_key(FakeRequest({"x-forwarded-for": "1.2.3.4"}))
        assert a != b, "different users behind same NAT must not share a bucket"
        assert anon == "1.2.3.4", "no token falls back to forwarded IP"

    def test_ip_key_uses_first_forwarded_hop(self):
        class FakeRequest:
            def __init__(self, headers):
                self.headers = headers
                self.client = None

        key = rate_limits.client_ip_key(
            FakeRequest({"x-forwarded-for": "198.51.100.7, 10.0.0.1"})
        )
        assert key == "198.51.100.7"


# =============================================================================
# Requirement 3 — honest health / readiness (Property P1)
# =============================================================================

class TestHealthReadiness:
    def test_health_is_liveness_always_200(self, client):
        assert client.get("/health").status_code == 200

    def test_health_reports_real_database_state(self, client):
        services = client.get("/health").json()["services"]
        # Real check result, not a hardcoded "ok": value is ok|timeout|error: <Type>
        assert services["database"] == "ok" or services["database"].startswith(("error", "timeout"))

    def test_ready_consistent_with_component_checks(self, client):
        """P1: /health/ready is 503 ⟺ DB unreachable or model unloadable."""
        db_ok, _ = health.check_database()
        model_ok, _ = health.check_model()
        res = client.get("/health/ready")
        if db_ok and model_ok:
            assert res.status_code == 200
            assert res.json() == {"ready": True}
        else:
            assert res.status_code == 503
            assert res.json()["ready"] is False
            assert len(res.json()["failing"]) >= 1

    def test_ready_503_names_failing_component_when_db_down(self, client, monkeypatch):
        monkeypatch.setattr(health, "check_database", lambda: (False, "error: Simulated"))
        res = client.get("/health/ready")
        assert res.status_code == 503
        assert "database" in res.json()["failing"]

    def test_health_degraded_when_db_down(self, client, monkeypatch):
        monkeypatch.setattr(health, "check_database", lambda: (False, "error: Simulated"))
        res = client.get("/health")
        assert res.status_code == 200  # liveness stays 200
        assert res.json()["status"] == "degraded"

    def test_model_check_never_trains(self, monkeypatch, tmp_path):
        """A missing model is reported, not repaired (Req 3.4)."""
        from app.ml import predictor
        missing = tmp_path / "nope.joblib"
        monkeypatch.setattr(predictor, "MODEL_PATH", missing)
        ok, detail = health.check_model()
        assert ok is False
        assert detail == "missing"
        assert not missing.exists(), "health check must not create/train a model"
