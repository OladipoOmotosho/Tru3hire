"""
Jobs API Routes

Endpoints for searching, fetching, and ranking jobs.
"""

from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

from app.services.jobs import search_jobs, search_and_rank_jobs, get_job_categories
from app.data.canada_locations import (
    get_all_provinces,
    get_cities_for_province,
    get_province_name,
)
from app.services.quick_scorer import quick_scorer

router = APIRouter(prefix="/jobs", tags=["jobs"])


# =============================================================================
# Type Aliases for FastAPI Validation
# =============================================================================

JobType = Literal["all", "fulltime", "parttime", "contract", "remote", "hybrid", "intern"]
SortBy = Literal["relevance", "truescore", "date", "eligibility"]


# =============================================================================
# Request Body Models
# =============================================================================

# Request body model for POST /ranked
class RankedJobsBody(BaseModel):
    resume_text: str = ""
    user_location: str = ""  # Added for eligibility scoring


# Request body model for POST /scores (progressive loading)
class JobScoresBody(BaseModel):
    jobs: List[Dict[str, Any]] = Field(..., max_length=100)  # Limit batch size
    resume_text: str = ""


# =============================================================================
# Location Endpoints
# =============================================================================

@router.get("/locations")
async def get_locations(
    province: Optional[str] = Query(None, description="Province name to get cities for"),
):
    """
    Get Canadian provinces and cities for location filtering.
    
    - Without province: Returns list of all provinces
    - With province: Returns list of cities in that province
    """
    if province:
        # Resolve code ("ON") to full name ("Ontario") for lookup
        province_full = get_province_name(province) or province
        cities = get_cities_for_province(province_full)
        return {
            "province": province,
            "cities": cities,
        }
    else:
        provinces = get_all_provinces()
        return {
            "provinces": provinces,
        }


# =============================================================================
# Job Search Endpoints
# =============================================================================

@router.get("/search")
async def search_jobs_endpoint(
    q: str = Query("", description="Search keywords"),
    location: str = Query("", description="Location filter (legacy)"),
    province: str = Query("", description="Canadian province name"),
    city: str = Query("", description="City within the province"),
    country: str = Query("ca", description="Country code (ca, us, gb)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=50, description="Results per page"),
    job_type: JobType = Query("all", description="Job type: all, fulltime, parttime, contract, remote, hybrid"),
):
    """
    Search for jobs from Adzuna.
    
    Returns raw job listings without TrueScore analysis.
    Use /jobs/ranked for analyzed results.
    
    Location filtering:
    - Use province and city for precise Canadian location filtering
    - Falls back to general location parameter if province not provided
    """
    result = await search_jobs(
        query=q,
        location=location,
        province=province,
        city=city,
        country=country,
        page=page,
        results_per_page=limit,
        job_type=job_type,
    )
    return result


@router.post("/ranked")
async def get_ranked_jobs(
    q: str = Query("", description="Search keywords"),
    location: str = Query("", description="Location filter (legacy)"),
    province: str = Query("", description="Canadian province name"),
    city: str = Query("", description="City within the province"),
    country: str = Query("ca", description="Country code (ca, us, gb)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(40, ge=1, le=50, description="Results per page (max 50)"),
    sort_by: SortBy = Query("relevance", description="Sort by: relevance, truescore, date, eligibility"),
    job_type: JobType = Query("all", description="Job type: all, fulltime, parttime, contract, remote, hybrid, intern"),
    body: RankedJobsBody = Body(default=RankedJobsBody()),
):
    """
    Search for jobs and rank them by TrueScore.
    
    Each job is analyzed for:
    - Resume Match - 30% (re-normalized when resume missing)
    - Recency - 15%
    - Authenticity (real vs fake) - 25%
    - Hiring Activity - 20%
    - Company Reputation - 10%
    
    Location filtering:
    - Use province and city for precise Canadian location filtering
    - Falls back to general location parameter if province not provided
    
    Sort options:
    - relevance: Adzuna's default relevance
    - truescore: Sort by TrueScore (highest first)
    - date: Sort by date posted (newest first)
    - eligibility: Sort by Eligibility Score (highest first)
    
    Job type options:
    - all, fulltime, parttime, contract, remote, hybrid, intern
    
    Resume matching:
    - Pass resume_text for personalized TrueScore based on your resume
    - Uses semantic embeddings for accurate matching
    """
    result = await search_and_rank_jobs(
        query=q,
        location=location,
        province=province,
        city=city,
        country=country,
        page=page,
        results_per_page=limit,
        sort_by=sort_by,
        job_type=job_type,
        resume_text=body.resume_text if body.resume_text else None,
        user_location=body.user_location if body.user_location else None,
    )
    return result


@router.get("/categories")
async def get_categories(
    country: str = Query("ca", description="Country code"),
):
    """Get available job categories for filtering."""
    categories = await get_job_categories(country)
    return {"categories": categories}


# =============================================================================
# Progressive Loading Endpoint (Optimized)
# =============================================================================

@router.post("/scores")
async def get_job_scores(body: JobScoresBody):
    """
    Calculate TrueScores for a batch of jobs (progressive loading).
    
    Uses canonical TrueScore math with caching for consistency.
    - Single scoring model across analyze, jobs, and discover
    - Caches results for repeated requests
    
    Request body:
    - jobs: List of job dicts with 'id', 'title', 'company', 'description'
    - resume_text: User's resume for personalized matching
    
    Returns:
    - scores: Dict mapping job_id to score data
    """
    resume_text = body.resume_text or None
    
    # Batch score all jobs efficiently
    results = quick_scorer.score_batch(body.jobs, resume_text)
    
    # Convert to response format
    scores = {}
    for job_id, result in results.items():
        scores[job_id] = {
            "true_score": result.true_score,
            "risk_level": result.risk_level,
            "breakdown": result.breakdown,
            "cached": result.cached,
            "friction_signals": getattr(result, "friction_signals", []),
        }
    
    return {"scores": scores}


# =============================================================================
# Job Preview Endpoint (Full Description Fetch)
# =============================================================================

@router.get("/preview")
async def preview_job(
    url: str = Query(..., max_length=2048, description="Job posting URL to fetch full description from"),
):
    """
    Fetch the full job description from a job posting URL.

    Lightweight alternative to /analyze-url — only scrapes and returns text,
    does NOT run TrueScore analysis.
    """
    import socket
    import ipaddress
    from urllib.parse import urlparse

    # --- SSRF protection ---
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only http and https URLs are allowed")

    # Resolve all addresses (IPv4 + IPv6) for the hostname
    try:
        addr_infos = socket.getaddrinfo(
            parsed.hostname or "", None,
            family=socket.AF_UNSPEC, type=socket.SOCK_STREAM,
        )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Could not resolve hostname")

    if not addr_infos:
        raise HTTPException(status_code=400, detail="Could not resolve hostname")

    # Validate every resolved address — reject if any is private/loopback/etc.
    resolved_ip = None
    for info in addr_infos:
        addr = info[4][0]
        try:
            ip_obj = ipaddress.ip_address(addr)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid IP address")
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_multicast or ip_obj.is_reserved or ip_obj.is_link_local:
            raise HTTPException(status_code=400, detail="Internal URLs are not allowed")
        if resolved_ip is None:
            resolved_ip = addr  # Use first safe address for the request

    from app.services.url_scraper import scrape_job_url

    scraped = await scrape_job_url(url, resolved_ip=resolved_ip, host_header=parsed.hostname)

    if scraped.error:
        return {
            "description": None,
            "title": None,
            "company": None,
            "location": None,
            "salary": None,
            "error": scraped.error,
        }

    return {
        "description": scraped.job_text,
        "title": scraped.title,
        "company": scraped.company,
        "location": scraped.location,
        "salary": scraped.salary,
        "error": None,
    }
