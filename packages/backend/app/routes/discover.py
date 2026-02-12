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
from app.services.refinement_analyzer import analyze_results, Refinement
from app.services.jobs import search_jobs
from app.services.scorer import true_score_aggregator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["discover"])


def _is_excluded_by_terms(job: dict, exclude_terms: List[str]) -> bool:
    """Filter out jobs that contain explicit exclusion terms."""
    if not exclude_terms:
        return False

    title = (job.get("title") or "").lower()
    description = (job.get("description") or "").lower()

    for term in exclude_terms:
        term_lower = term.lower().strip()
        if not term_lower:
            continue
        if term_lower in title or term_lower in description:
            return True

    return False


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
    facet_suggestions: List[dict] = []  # Spectrum expand/narrow tags
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
        # Strategy: Send ROLE + SENIORITY to Adzuna (simple query = more results)
        # Industry, company traits, and preferences are used for post-search RANKING
        if parsed_query.role_title:
            # Use the detected compound role title (e.g., "frontend developer")
            search_query = parsed_query.role_title
        elif parsed_query.keywords:
            # Fall back to extracted keywords
            search_query = " ".join(parsed_query.keywords)
        else:
            # Last resort: clean up original query by stripping filler words
            # Don't send full sentences to Adzuna — extract just the meaningful terms
            filler_words = {
                'i', 'want', 'need', 'looking', 'for', 'a', 'an', 'the', 'in',
                'at', 'with', 'that', 'is', 'are', 'was', 'be', 'to', 'of',
                'and', 'or', 'my', 'me', 'job', 'jobs', 'role', 'roles',
                'position', 'positions', 'work', 'working', 'company',
                'companies', 'team', 'would', 'like', 'prefer', 'preferably',
                'focused', 'based', 'find', 'search', 'looking',
            }
            words = request.query.lower().split()
            clean_words = [w for w in words if w not in filler_words]
            search_query = " ".join(clean_words) if clean_words else request.query
        
        # Prepend seniority to search (e.g., "senior frontend developer")
        # This lets Adzuna do first-pass seniority filtering
        if parsed_query.seniority and parsed_query.seniority.lower() not in search_query.lower():
            search_query = f"{parsed_query.seniority} {search_query}"
        
        # Fetch extra results so the ranker has more to score against preferences
        fetch_limit = min(request.limit * 2, 50)  # 2x requested, max 50
        
        search_result = await search_jobs(
            query=search_query,
            province=request.province or (parsed_query.location_preference or ""),
            city=request.city or (parsed_query.city_preference or ""),
            page=request.page,
            results_per_page=fetch_limit,
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
                facet_suggestions=[],
                excluded_count=0,
                debug={"error": search_result.get("error")},
            )
        
        # Step 4: Canonical TrueScore and filter exclusions
        ranked_jobs = []
        excluded_count = 0
        for job in jobs:
            if _is_excluded_by_terms(job, parsed_query.exclude_terms):
                excluded_count += 1
                continue

            job_text = f"""
            {job.get('title', '')} at {job.get('company', '')}
            Location: {job.get('location', '')}
            {job.get('description', '')}
            """

            try:
                analysis = true_score_aggregator.analyze(job_text=job_text)
                ranked_jobs.append({
                    **job,
                    "true_score": analysis.true_score,
                    "risk_level": analysis.risk_level,
                    "breakdown": {
                        "authenticity": analysis.breakdown.authenticity,
                        "hiring_activity": analysis.breakdown.hiring_activity,
                        "hiring_likelihood": analysis.breakdown.hiring_activity,
                        "resume_match": analysis.breakdown.resume_match,
                        "company_reputation": analysis.breakdown.company_reputation,
                        "recency": analysis.breakdown.recency,
                    },
                })
            except Exception as exc:
                logger.exception("TrueScore failed for discover job: %s", exc)
                ranked_jobs.append({
                    **job,
                    "true_score": 70,
                    "risk_level": "caution",
                    "breakdown": {
                        "authenticity": 70,
                        "hiring_activity": 60,
                        "hiring_likelihood": 60,
                        "resume_match": 50,
                        "company_reputation": 70,
                        "recency": 70,
                    },
                })

        # Rank by canonical TrueScore
        ranked_jobs.sort(key=lambda j: j.get("true_score", 0), reverse=True)
        
        # Trim to requested limit (we over-fetched for better ranking)
        ranked_jobs = ranked_jobs[:request.limit]
        
        # Step 5: Analyze for refinement suggestions
        analysis = analyze_results(ranked_jobs, parsed_query)
        
        return DiscoverResponse(
            jobs=ranked_jobs,
            total=total,
            page=request.page,
            parsed_query=parsed_query.model_dump(),
            suggestions=[s.model_dump() for s in analysis.suggestions],
            facet_suggestions=analysis.facet_suggestions,
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

