"""
Real dependency checks for the liveness/readiness endpoints.

Liveness (/health): always 200 while the process is up; reports component
status including a `degraded` flag so silent fallbacks become visible.
Readiness (/health/ready): 503 unless the database round-trips and the scam
classifier artifact is loadable.

Invariant (design.md Property P1): /health/ready is 503 ⟺ DB unreachable or
model unloadable. These checks must never train a model or trigger warmups.
"""

import asyncio
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Cached result of the one-time model load check. None = not yet checked.
_model_load_ok: Optional[bool] = None


def check_database() -> Tuple[bool, str]:
    """Execute a real round-trip (SELECT 1) against the active database."""
    try:
        from app.database import get_db_connection

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            return True, "ok"
        finally:
            conn.close()
    except Exception as e:
        logger.warning("Health DB check failed: %s", e)
        return False, f"error: {type(e).__name__}"


def check_model() -> Tuple[bool, str]:
    """
    Verify the scam classifier artifact exists and is loadable.

    Loads at most once per process (cached), and never triggers
    auto-training — a missing model is reported, not repaired here.
    """
    global _model_load_ok

    from app.ml.predictor import MODEL_PATH

    if not MODEL_PATH.exists():
        return False, "missing"

    if _model_load_ok is None:
        try:
            import joblib

            joblib.load(MODEL_PATH)
            _model_load_ok = True
        except Exception as e:
            logger.error("Health model check: artifact unloadable: %s", e)
            _model_load_ok = False

    return (True, "ok") if _model_load_ok else (False, "unloadable")


def get_embeddings_status() -> Tuple[str, bool]:
    """
    Report the active embeddings provider.

    Returns (provider, degraded) where provider is one of
    "gemini" | "local" | "keyword-fallback". Anything but "gemini" means
    semantic features run in a degraded mode (or not at all).
    """
    try:
        from app.ml.embeddings import get_embedding_status

        status = get_embedding_status()
        provider = status.get("preferred_provider") or "none"
    except Exception as e:
        logger.warning("Health embeddings check failed: %s", e)
        provider = "none"

    if provider == "none":
        # Resume matching falls back to TF-IDF keyword similarity
        provider = "keyword-fallback"
    return provider, provider != "gemini"


async def run_checks(db_timeout: float = 2.0) -> dict:
    """Run all dependency checks without blocking the event loop."""
    loop = asyncio.get_running_loop()

    try:
        db_ok, db_detail = await asyncio.wait_for(
            loop.run_in_executor(None, check_database), timeout=db_timeout
        )
    except asyncio.TimeoutError:
        db_ok, db_detail = False, "timeout"

    model_ok, model_detail = await loop.run_in_executor(None, check_model)
    provider, emb_degraded = get_embeddings_status()

    return {
        "db_ok": db_ok,
        "db": db_detail,
        "model_ok": model_ok,
        "model": model_detail,
        "embeddings_provider": provider,
        "embeddings_degraded": emb_degraded,
        "ready": db_ok and model_ok,
    }
