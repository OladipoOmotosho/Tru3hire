"""
Adzuna Job Fetching Service

Fetches jobs from Adzuna API and ranks them using TrueScore.
Free tier: 250 calls/day
"""

import os
import httpx
from typing import Optional, List, Dict
from datetime import datetime

# =============================================================================
# Configuration
# =============================================================================

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"

# Default to Canada
DEFAULT_COUNTRY = "ca"


# =============================================================================
# Data Models
# =============================================================================

class AdzunaJob:
    """Represents a job from Adzuna API."""
    
    def __init__(self, data: dict):
        self.id = data.get("id", "")
        self.title = data.get("title", "")
        self.description = data.get("description", "")
        self.company = data.get("company", {}).get("display_name", "Unknown")
        self.location = data.get("location", {}).get("display_name", "")
        self.salary_min = data.get("salary_min")
        self.salary_max = data.get("salary_max")
        self.contract_type = data.get("contract_type", "")
        self.category = data.get("category", {}).get("label", "")
        self.created = data.get("created", "")
        self.redirect_url = data.get("redirect_url", "")
        
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "company": self.company,
            "location": self.location,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "salary_display": self._format_salary(),
            "contract_type": self.contract_type,
            "category": self.category,
            "created": self.created,
            "days_ago": self._days_since_posted(),
            "redirect_url": self.redirect_url,
        }
    
    def _format_salary(self) -> str:
        """Format salary range for display."""
        if self.salary_min and self.salary_max:
            return f"${int(self.salary_min):,} - ${int(self.salary_max):,}"
        elif self.salary_min:
            return f"${int(self.salary_min):,}+"
        elif self.salary_max:
            return f"Up to ${int(self.salary_max):,}"
        return "Not specified"
    
    def _days_since_posted(self) -> int:
        """Calculate days since job was posted."""
        if not self.created:
            return 0
        try:
            created_date = datetime.fromisoformat(self.created.replace("Z", "+00:00"))
            return (datetime.now(created_date.tzinfo) - created_date).days
        except:
            return 0
    
    def get_full_text(self) -> str:
        """Get full text for TrueScore analysis."""
        parts = [
            f"Title: {self.title}",
            f"Company: {self.company}",
            f"Location: {self.location}",
            f"Description: {self.description}",
        ]
        if self.salary_min or self.salary_max:
            parts.append(f"Salary: {self._format_salary()}")
        return "\n".join(parts)


# =============================================================================
# API Functions
# =============================================================================


from app.services.query_resolver import resolve_signals
from app.services.facet_engine import generate_all_suggestions

async def search_jobs(
    query: str = "",
    location: str = "",
    province: str = "",
    city: str = "",
    country: str = DEFAULT_COUNTRY,
    page: int = 1,
    results_per_page: int = 20,
    job_type: str = "all",
) -> Dict:
    """
    Search for jobs using Adzuna API with Faceted Search enhancements.
    1. Parses query into structured signals (keywords vs facets).
    2. Searches Adzuna with cleaned keywords.
    3. Generates "Smart Suggestions" based on results.
    """
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return {
            "error": "Adzuna API credentials not configured",
            "jobs": [],
            "total": 0,
            "suggestions": [],
        }
    
    # 1. Resolve structured query from input
    # Combine query + explicit filters into signals for resolution
    signals = query.split() if query else []
    
    # Override/augment with explicit filters if provided
    if province:
        signals.append(province)
    if city:
        signals.append(city)
    if job_type != "all":
        signals.append(job_type)
        
    parsed_query = resolve_signals(signals, query or "")
    
    # Build API URL
    url = f"{ADZUNA_BASE_URL}/{country}/search/{page}"
    
    # Build query parameters
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": min(results_per_page, 50),
        "content-type": "application/json",
    }
    
    # Use resolved keywords for search (better quality than raw query)
    # If no keywords found (e.g. only filters), use original query or "job"
    search_what = " ".join(parsed_query.keywords)
    if not search_what and query:
        search_what = query # Fallback
        
    # Handle job type (resolved from signals or explicit param)
    resolved_type = parsed_query.job_type or job_type
    
    if resolved_type == "fulltime":
        params["full_time"] = 1
    elif resolved_type == "parttime":
        params["part_time"] = 1
    elif resolved_type == "contract":
        params["contract"] = 1
    elif resolved_type == "remote":
        search_what = f"{search_what} remote" if search_what else "remote"
    elif resolved_type == "hybrid":
        search_what = f"{search_what} hybrid" if search_what else "hybrid"
    
    if search_what:
        params["what"] = search_what
    
    # Handle location filtering
    # Use resolved location if available, otherwise explicit params
    req_province = parsed_query.location_preference or province
    req_city = parsed_query.city_preference or city
    
    if req_province:
        params["location0"] = "Canada"
        params["location1"] = req_province
        if req_city:
            params["location2"] = req_city
    elif location:
        params["where"] = location
    
    # Sort by date
    params["sort_by"] = "date"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Parse jobs
        jobs = [AdzunaJob(job).to_dict() for job in data.get("results", [])]
        
        # Deduplication logic
        seen = set()
        unique_jobs = []
        for job in jobs:
            dedup_key = (
                job.get("title", "").lower().strip(),
                job.get("company", "").lower().strip(),
            )
            if dedup_key not in seen:
                seen.add(dedup_key)
                unique_jobs.append(job)
        jobs = unique_jobs
        
        # 3. Generate Smart Suggestions
        suggestions = generate_all_suggestions(
            jobs=jobs,
            facets=parsed_query.facets,
            max_total=6
        )
        
        return {
            "jobs": jobs,
            "total": data.get("count", 0),
            "page_count": len(jobs),
            "original_total": data.get("count", 0),
            "page": page,
            "results_per_page": results_per_page,
            "query": query,
            "parsed_query": parsed_query.model_dump(),
            "suggestions": [s.model_dump() for s in suggestions],
        }
    
    except httpx.HTTPStatusError as e:
        return {
            "error": f"Adzuna API error: {e.response.status_code}",
            "jobs": [],
            "total": 0,
            "suggestions": [],
        }
    except Exception as e:
        return {
            "error": f"Failed to fetch jobs: {str(e)}",
            "jobs": [],
            "total": 0,
            "suggestions": [],
        }


async def get_job_categories(country: str = DEFAULT_COUNTRY) -> List[Dict]:
    """Get available job categories for filtering."""
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []
    
    url = f"{ADZUNA_BASE_URL}/{country}/categories"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        return data.get("results", [])
    except:
        return []


# =============================================================================
# Job Ranking with TrueScore
# =============================================================================

async def search_and_rank_jobs(
    query: str = "",
    location: str = "",
    province: str = "",
    city: str = "",
    country: str = DEFAULT_COUNTRY,
    page: int = 1,
    results_per_page: int = 40,
    sort_by: str = "relevance",
    job_type: str = "all",
    resume_text: Optional[str] = None,
    user_location: Optional[str] = None, # Added for eligibility
) -> Dict:
    """
    Search for jobs and rank them by TrueScore.
    
    This fetches jobs from Adzuna, then runs each through
    our TrueScore analysis to rank them.
    
    Args:
        resume_text: Optional resume text for personalized matching
    
    sort_by options:
    - relevance: Keep Adzuna's default order
    - truescore: Sort by TrueScore (highest first)
    - date: Sort by days_ago (newest first)
    - eligibility: Sort by Eligibility Score (highest first)
    
    job_type options:
    - all: All jobs
    - fulltime, parttime, contract, remote, hybrid
    """
    from app.services.scorer import true_score_aggregator
    
    # First, fetch jobs
    result = await search_jobs(
        query=query,
        location=location,
        province=province,
        city=city,
        country=country,
        page=page,
        results_per_page=results_per_page,
        job_type=job_type,
    )
    
    if result.get("error") or not result.get("jobs"):
        return result
    
    # Score each job
    ranked_jobs = []
    for job in result["jobs"]:
        try:
            # Get full text for analysis
            job_text = f"""
            {job['title']} at {job['company']}
            Location: {job['location']}
            {job['description']}
            """
            
            # Run TrueScore analysis with resume for personalized matching
            analysis = true_score_aggregator.analyze(
                job_text=job_text,
                resume_text=resume_text,
                # Phase 3: Pass data for eligibility
                job_title=job['title'],
                job_location=job['location'],
                user_location=user_location or location or "", # Fallback to search location
            )
            
            ranked_jobs.append({
                **job,
                "true_score": analysis.true_score,
                "risk_level": analysis.risk_level,
                "breakdown": {
                    "authenticity": analysis.breakdown.authenticity,
                    "hiring_activity": analysis.breakdown.hiring_activity,
                    "hiring_likelihood": analysis.breakdown.hiring_likelihood,
                    "resume_match": analysis.breakdown.resume_match,
                    "company_reputation": analysis.breakdown.company_reputation,
                    "recency": analysis.breakdown.recency,
                    "eligibility_score": analysis.eligibility_score, # Add to breakdown
                },
                "eligibility_score": analysis.eligibility_score,
                "eligibility_badges": analysis.eligibility_badges,
            })
        except Exception as e:
            # If analysis fails, still include the job with neutral score
            ranked_jobs.append({
                **job,
                "true_score": 70,
                "risk_level": "caution",
                "breakdown": None,
                "error": str(e),
            })
    
    # Apply sorting based on sort_by parameter
    if sort_by == "truescore":
        ranked_jobs.sort(key=lambda x: x["true_score"], reverse=True)
    elif sort_by == "date":
        ranked_jobs.sort(key=lambda x: x.get("days_ago", 999))
    elif sort_by == "eligibility":
        # Sort by eligibility score (treat None as 0)
        ranked_jobs.sort(key=lambda x: x.get("eligibility_score") or 0, reverse=True)
    # else: keep relevance order from Adzuna
    
    return {
        **result,
        "jobs": ranked_jobs,
        "ranked": True,
        "sort_by": sort_by,
    }
