"""
Analytics events route.

Public, rate-limited endpoint for the frontend (and later, the browser
extension) to report funnel events that only the client can see — viewed,
reasons-expanded, shared, return. Server-observable events (check_run,
search_run, scam_report) are emitted directly by their endpoints.

Count-only: the payload is just an allow-listed event type. No PII is accepted.
"""

import logging

from fastapi import APIRouter, Body, HTTPException, Request, Response

from app.config.rate_limits import EVENTS_LIMIT, limiter
from app.services.analytics import ALLOWED_EVENTS, record_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analytics"])


@router.post("/events")
@limiter.limit(EVENTS_LIMIT)
async def track_event(
    request: Request,
    response: Response,
    event_type: str = Body(..., embed=True),
) -> dict:
    """Record a single funnel event. Rejects unknown event types."""
    if event_type not in ALLOWED_EVENTS:
        raise HTTPException(status_code=400, detail="Unknown event type")
    record_event(event_type)
    return {"ok": True}
