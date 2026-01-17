"""
Jobs API Routes

Endpoints for searching, fetching, and ranking jobs.
"""

from fastapi import APIRouter, Query, Body
from typing import Optional
from pydantic import BaseModel

from app.services.jobs import search_jobs, search_and_rank_jobs, get_job_categories
from app.data.canada_locations import (
    get_all_provinces,
    get_cities_for_province,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


# Request body model for POST /ranked
class RankedJobsBody(BaseModel):
    resume_text: str = ""


# Request body model for POST /scores (progressive loading)
class JobScoresBody(BaseModel):
    jobs: list  # List of job dicts with at least 'id' and 'description'
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
        cities = get_cities_for_province(province)
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
    sort_by: str = Query("relevance", description="Sort by: relevance, truescore, date"),
    job_type: str = Query("all", description="Job type: all, fulltime, parttime, contract, remote, hybrid"),
    body: RankedJobsBody = Body(default=RankedJobsBody()),
):
    """
    Search for jobs and rank them by TrueScore.
    
    Each job is analyzed for:
    - Resume Match (if resume provided) - 35%
    - Authenticity (real vs fake) - 30%
    - Hiring Activity - 25%
    - Company Reputation - 10%
    
    Location filtering:
    - Use province and city for precise Canadian location filtering
    - Falls back to general location parameter if province not provided
    
    Sort options:
    - relevance: Adzuna's default relevance
    - truescore: Sort by TrueScore (highest first)
    - date: Sort by date posted (newest first)
    
    Job type options:
    - all, fulltime, parttime, contract, remote, hybrid
    
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
# Progressive Loading Endpoint
# =============================================================================

@router.post("/scores")
async def get_job_scores(body: JobScoresBody):
    """
    Calculate TrueScores for a batch of jobs (progressive loading).
    
    This endpoint enables instant job display on the frontend.
    Jobs are shown immediately, then scores are fetched separately.
    
    Request body:
    - jobs: List of job dicts with 'id', 'title', 'company', 'description', 'location'
    - resume_text: User's resume for personalized matching
    
    Returns:
    - scores: Dict mapping job_id to score data
    """
    from app.services.scorer import true_score_aggregator
    
    scores = {}
    resume_text = body.resume_text if body.resume_text else None
    
    for job in body.jobs:
        try:
            job_id = job.get("id", "")
            job_text = f"""
            {job.get('title', '')} at {job.get('company', '')}
            Location: {job.get('location', '')}
            {job.get('description', '')}
            """
            
            analysis = true_score_aggregator.analyze(
                job_text=job_text,
                resume_text=resume_text,
            )
            
            scores[job_id] = {
                "true_score": analysis.true_score,
                "risk_level": analysis.risk_level,
                "breakdown": {
                    "authenticity": analysis.breakdown.authenticity,
                    "hiring_likelihood": analysis.breakdown.hiring_likelihood,
                    "resume_match": analysis.breakdown.resume_match,
                    "company_reputation": analysis.breakdown.company_reputation,
                },
            }
        except Exception as e:
            scores[job.get("id", "")] = {
                "true_score": 70,
                "risk_level": "caution",
                "breakdown": None,
                "error": str(e),
            }
    
    return {"scores": scores}
