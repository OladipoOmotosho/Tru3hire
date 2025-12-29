"""
Jobs API Routes

Endpoints for searching, fetching, and ranking jobs.
"""

from fastapi import APIRouter, Query
from typing import Optional

from app.services.jobs import search_jobs, search_and_rank_jobs, get_job_categories

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/search")
async def search_jobs_endpoint(
    q: str = Query("", description="Search keywords"),
    location: str = Query("", description="Location filter"),
    country: str = Query("ca", description="Country code (ca, us, gb)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=50, description="Results per page"),
):
    """
    Search for jobs from Adzuna.
    
    Returns raw job listings without TrueScore analysis.
    Use /jobs/ranked for analyzed results.
    """
    result = await search_jobs(
        query=q,
        location=location,
        country=country,
        page=page,
        results_per_page=limit,
    )
    return result


@router.get("/ranked")
async def get_ranked_jobs(
    q: str = Query("", description="Search keywords"),
    location: str = Query("", description="Location filter"),
    country: str = Query("ca", description="Country code (ca, us, gb)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(40, ge=1, le=50, description="Results per page (max 50)"),
    sort_by: str = Query("relevance", description="Sort by: relevance, truescore, date"),
    job_type: str = Query("all", description="Job type: all, fulltime, parttime, contract, remote, hybrid"),
):
    """
    Search for jobs and rank them by TrueScore.
    
    Each job is analyzed for:
    - Authenticity (real vs fake)
    - Hiring Likelihood
    - Resume Match (if resume uploaded)
    - Bias & Fairness
    - Company Reputation
    
    Sort options:
    - relevance: Adzuna's default relevance
    - truescore: Sort by TrueScore (highest first)
    - date: Sort by date posted (newest first)
    
    Job type options:
    - all, fulltime, parttime, contract, remote, hybrid
    """
    result = await search_and_rank_jobs(
        query=q,
        location=location,
        country=country,
        page=page,
        results_per_page=limit,
        sort_by=sort_by,
        job_type=job_type,
    )
    return result


@router.get("/categories")
async def get_categories(
    country: str = Query("ca", description="Country code"),
):
    """Get available job categories for filtering."""
    categories = await get_job_categories(country)
    return {"categories": categories}
