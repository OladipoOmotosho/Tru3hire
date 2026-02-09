"""
Discover API Routes

AI-powered job discovery with natural language queries.
Single stateless endpoint - frontend owns context.
"""

import logging
from fastapi import APIRouter, Body, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field

from app.services.signal_extractor import extract_signals
from app.services.query_resolver import resolve_signals, ParsedJobQuery
from app.services.job_ranker import rank_jobs, ScoredJob
from app.services.refinement_analyzer import analyze_results, Refinement
from app.services.jobs import search_jobs

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


class DiscoverResponse(BaseModel):
    """Response from AI-powered job discovery."""
    jobs: List[dict]
    total: int
    page: int
    parsed_query: dict
    suggestions: List[dict]
    excluded_count: int
    debug: Optional[dict] = None


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/discover")
async def discover_jobs(request: DiscoverRequest) -> DiscoverResponse:
    """
    AI-powered job discovery with natural language queries.
    
    Pipeline:
    1. Extract signals from query + refinements (Gemini or fallback)
    2. Resolve signals to structured query (deterministic rules)
    3. Search jobs from Adzuna
    4. Rank and filter jobs (weighted scoring)
    5. Analyze results for refinement suggestions
    
    The endpoint is stateless - frontend manages refinement context.
    """
    try:
        # Combine query with refinements
        full_query = request.query
        if request.refinements:
            full_query = f"{request.query}, {', '.join(request.refinements)}"
        
        # Step 1: Extract signals
        extraction_result = await extract_signals(full_query)
        signals = extraction_result.signals
        
        # Step 2: Resolve signals to structured query
        parsed_query = resolve_signals(signals, request.query)
        
        # Step 3: Fetch jobs from Adzuna
        # Build search query from keywords
        search_query = " ".join(parsed_query.keywords) if parsed_query.keywords else request.query
        
        # Add refinements as search terms if no keywords extracted
        if not parsed_query.keywords and request.refinements:
            search_query = f"{request.query} {' '.join(request.refinements)}"
        
        search_result = await search_jobs(
            query=search_query,
            province=request.province or (parsed_query.location_preference or ""),
            city=request.city or (parsed_query.city_preference or ""),
            page=request.page,
            results_per_page=request.limit,
            job_type=parsed_query.job_type or "all",
        )
        
        jobs = search_result.get("jobs", [])
        total = search_result.get("total", 0)
        
        if search_result.get("error"):
            return DiscoverResponse(
                jobs=[],
                total=0,
                page=request.page,
                parsed_query=parsed_query.model_dump(),
                suggestions=[],
                excluded_count=0,
                debug={"error": search_result.get("error")},
            )
        
        # Step 4: Rank and filter jobs
        scored_jobs = rank_jobs(jobs, parsed_query)
        excluded_count = len(jobs) - len(scored_jobs)
        
        # Convert to response format
        ranked_jobs = []
        for sj in scored_jobs:
            job_dict = sj.job.copy()
            job_dict["discovery_score"] = sj.score
            job_dict["score_breakdown"] = sj.breakdown.model_dump()
            ranked_jobs.append(job_dict)
        
        # Step 5: Analyze for refinement suggestions
        analysis = analyze_results(ranked_jobs, parsed_query)
        
        return DiscoverResponse(
            jobs=ranked_jobs,
            total=total,
            page=request.page,
            parsed_query=parsed_query.model_dump(),
            suggestions=[s.model_dump() for s in analysis.suggestions],
            excluded_count=excluded_count,
            debug={
                "signals": signals,
                "fallback_used": extraction_result.fallback_used,
                "distribution": analysis.distribution,
                "search_query": search_query,
                "job_type": parsed_query.job_type or "all",
                "search_error": search_result.get("error"),
            },
        )
    except Exception as e:
        logger.exception(f"Discover endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Discovery failed: {str(e)}")


@router.post("/discover/signals")
async def extract_query_signals(query: str = Body(..., embed=True)) -> dict:
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
        raise HTTPException(status_code=500, detail=f"Signal extraction failed: {str(e)}")

