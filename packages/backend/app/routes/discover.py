"""
Discover API Routes

AI-powered job discovery with natural language queries.
Now powered by the enhanced search orchestrator with hybrid ranking.
Frontend owns context for multi-turn refinement.
"""

import logging
from fastapi import APIRouter, Body, HTTPException, Request, Response, Depends

from app.config.rate_limits import limiter, DISCOVER_LIMIT, user_or_ip_key
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.signal_extractor import extract_signals
from app.services.query_resolver import resolve_signals
from app.services.search_orchestrator import enhanced_search
from app.services.search_schemas import SearchContext
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["discover"])


# =============================================================================
# Request/Response Models
# =============================================================================

class DiscoverRequest(BaseModel):
    """Request for AI-powered job discovery."""
    query: str = Field(..., min_length=1, max_length=500)
    refinements: List[str] = Field(default_factory=list, max_length=10)
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=40, ge=1, le=50)
    province: str = ""
    city: str = ""
    context: Optional[dict] = None  # Multi-turn search context


class DiscoverResponse(BaseModel):
    """Response from AI-powered job discovery."""
    jobs: List[dict]
    total: int
    page: int
    parsed_query: dict
    suggestions: List[dict]
    facet_suggestions: List[dict] = []
    excluded_count: int
    confidence: Optional[dict] = None
    context: Optional[dict] = None  # Return context for multi-turn
    debug: Optional[dict] = None


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/discover")
@limiter.limit(DISCOVER_LIMIT, key_func=user_or_ip_key)
async def discover_jobs(payload: DiscoverRequest, request: Request, response: Response, user_id: str = Depends(get_current_user)) -> DiscoverResponse:
    """
    AI-powered job discovery with natural language queries.

    Enhanced pipeline (via search_orchestrator):
    1. Extract signals from query + refinements (Gemini or fallback)
    2. Resolve signals to structured query (deterministic rules)
    3. Multi-query retrieval from Adzuna (original + rewrites)
    4. Apply hard exclusions (morphological variant expansion)
    5. Compute TrueScores (authenticity, hiring activity, etc.)
    6. Compute embedding similarity (Gemini with LRU cache)
    7. Hybrid ranking (embedding + keyword + signal + TrueScore)
    8. Lightweight reranking (phrase/title awareness)
    9. Confidence check → auto-retry with focused query if flat
    10. Generate refinement suggestions

    The endpoint is stateless - frontend manages refinement context.
    """
    try:
        # Parse context if provided for multi-turn refinement
        search_context = None
        if payload.context:
            try:
                search_context = SearchContext(**payload.context)
            except Exception:
                logger.warning("Invalid search context, ignoring")

        # Delegate to the orchestrator
        result = await enhanced_search(
            query=payload.query,
            refinements=payload.refinements,
            context=search_context,
            page=payload.page,
            limit=payload.limit,
            province=payload.province,
            city=payload.city,
        )

        return DiscoverResponse(
            jobs=result.jobs,
            total=result.total,
            page=result.page,
            parsed_query=result.parsed_query,
            suggestions=result.suggestions,
            facet_suggestions=result.facet_suggestions,
            excluded_count=result.excluded_count,
            confidence=result.confidence.model_dump() if result.confidence else None,
            context=result.context.model_dump() if result.context else None,
            debug=result.debug,
        )
    except Exception as e:
        logger.exception(f"Discover endpoint failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during discovery")


@router.post("/discover/signals")
@limiter.limit(DISCOVER_LIMIT, key_func=user_or_ip_key)
async def extract_query_signals(request: Request, response: Response, query: str = Body(..., embed=True), user_id: str = Depends(get_current_user)) -> dict:
    """
    Debug endpoint: Extract signals from a query without searching.

    Useful for testing signal extraction.
    """
    try:
        result = await extract_signals(query)
        parsed = resolve_signals(result.signals, query)

        return {
            "query": query,
            "signals": result.signals,
            "fallback_used": result.fallback_used,
            "parsed_query": parsed.model_dump(),
        }
    except Exception as e:
        logger.exception(f"Signal extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while extracting signals")


