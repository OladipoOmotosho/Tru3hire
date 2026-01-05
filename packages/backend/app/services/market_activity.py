"""
Market Activity Service

Queries job market data to calculate hiring activity scores.
Uses Adzuna API to check:
1. How many similar jobs are posted by the same company
2. How many similar job titles exist in the market
3. Recent hiring activity from the company

This provides REAL market data instead of keyword-based guessing.
"""

import os
import httpx
import re
from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime

# =============================================================================
# Configuration
# =============================================================================

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
DEFAULT_COUNTRY = "ca"

# Cache for API results to avoid hitting rate limits
_market_cache: Dict[str, Tuple[dict, datetime]] = {}
CACHE_TTL_MINUTES = 60  # Cache results for 1 hour


# =============================================================================
# Data Models
# =============================================================================

@dataclass
class MarketActivityResult:
    """Result of market activity analysis."""
    
    # Raw counts
    company_job_count: int = 0          # Jobs from this company
    similar_title_count: int = 0        # Similar job titles in market
    market_total: int = 0               # Total jobs in this category
    
    # Computed scores (0-100)
    company_activity_score: int = 50    # Is company actively hiring?
    market_demand_score: int = 50       # Is this role in demand?
    hiring_activity_score: int = 50     # Combined score
    
    # Metadata
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    data_source: str = "adzuna"
    cached: bool = False
    error: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "company_job_count": self.company_job_count,
            "similar_title_count": self.similar_title_count,
            "market_total": self.market_total,
            "company_activity_score": self.company_activity_score,
            "market_demand_score": self.market_demand_score,
            "hiring_activity_score": self.hiring_activity_score,
            "company_name": self.company_name,
            "job_title": self.job_title,
            "data_source": self.data_source,
            "cached": self.cached,
        }


# =============================================================================
# Helper Functions
# =============================================================================

def _extract_job_title(job_text: str) -> Optional[str]:
    """
    Extract job title from job posting text.
    Looks for common patterns like "Job Title: X" or first line.
    """
    # Common patterns
    patterns = [
        r'(?:job\s*title|position|role)[:\s]+([^\n]+)',
        r'^([A-Z][A-Za-z\s]+(?:Developer|Engineer|Manager|Designer|Analyst|Specialist|Lead|Director|Coordinator|Associate|Consultant|Administrator))',
        r'^([^\n]{10,60})\n',  # First line if reasonable length
    ]
    
    for pattern in patterns:
        match = re.search(pattern, job_text, re.IGNORECASE | re.MULTILINE)
        if match:
            title = match.group(1).strip()
            # Clean up
            title = re.sub(r'\s+', ' ', title)
            if 5 <= len(title) <= 80:
                return title
    
    return None


def _simplify_job_title(title: str) -> str:
    """
    Simplify job title for search.
    "Senior Software Engineer II - Backend" -> "Software Engineer"
    """
    # Remove common prefixes/suffixes
    simplified = re.sub(
        r'^(senior|junior|lead|principal|staff|entry[- ]level|sr\.?|jr\.?)\s+',
        '',
        title,
        flags=re.IGNORECASE
    )
    simplified = re.sub(
        r'\s+(i{1,3}|iv|v|1|2|3|ii|iii|level\s*\d+|\-.*|intern|co-?op)$',
        '',
        simplified,
        flags=re.IGNORECASE
    )
    
    return simplified.strip()


def _get_cache_key(company: Optional[str], title: Optional[str]) -> str:
    """Generate cache key."""
    return f"{(company or '').lower()}:{(title or '').lower()}"


def _is_cache_valid(cache_key: str) -> bool:
    """Check if cached result is still valid."""
    if cache_key not in _market_cache:
        return False
    _, timestamp = _market_cache[cache_key]
    age_minutes = (datetime.now() - timestamp).total_seconds() / 60
    return age_minutes < CACHE_TTL_MINUTES


# =============================================================================
# Main API Functions
# =============================================================================

async def check_market_activity(
    job_text: str,
    company_name: Optional[str] = None,
    job_title: Optional[str] = None,
    country: str = DEFAULT_COUNTRY
) -> MarketActivityResult:
    """
    Check market activity for a job posting.
    
    Args:
        job_text: The full job posting text
        company_name: Optional company name (will extract if not provided)
        job_title: Optional job title (will extract if not provided)
        country: Country code for Adzuna (default: 'ca' for Canada)
    
    Returns:
        MarketActivityResult with activity scores and counts
    """
    result = MarketActivityResult()
    
    # Check if Adzuna is configured
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        result.error = "Adzuna API not configured"
        result.data_source = "fallback"
        return _fallback_activity_score(job_text, result)
    
    # Extract company and title if not provided
    if not company_name:
        from app.services.reputation import extract_company_name
        company_name = extract_company_name(job_text)
    
    if not job_title:
        job_title = _extract_job_title(job_text)
    
    result.company_name = company_name
    result.job_title = job_title
    
    # Check cache
    cache_key = _get_cache_key(company_name, job_title)
    if _is_cache_valid(cache_key):
        cached_result, _ = _market_cache[cache_key]
        result = MarketActivityResult(**cached_result)
        result.cached = True
        return result
    
    # Query Adzuna API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Query 1: Jobs from this company
            if company_name:
                company_count = await _count_company_jobs(client, company_name, country)
                result.company_job_count = company_count
            
            # Query 2: Similar job titles in market
            if job_title:
                simplified_title = _simplify_job_title(job_title)
                title_count, market_total = await _count_similar_titles(
                    client, simplified_title, country
                )
                result.similar_title_count = title_count
                result.market_total = market_total
        
        # Calculate scores
        result = _calculate_scores(result)
        
        # Cache the result
        _market_cache[cache_key] = (result.to_dict(), datetime.now())
        
    except httpx.TimeoutException:
        result.error = "API timeout"
        result = _fallback_activity_score(job_text, result)
    except Exception as e:
        result.error = str(e)
        result = _fallback_activity_score(job_text, result)
    
    return result


async def _count_company_jobs(
    client: httpx.AsyncClient,
    company_name: str,
    country: str
) -> int:
    """Count total jobs from a company on Adzuna."""
    url = f"{ADZUNA_BASE_URL}/{country}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 1,  # We only need the count
        "what": company_name,
        "what_and": company_name,  # Strict match
    }
    
    try:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("count", 0)
    except Exception:
        return 0


async def _count_similar_titles(
    client: httpx.AsyncClient,
    job_title: str,
    country: str
) -> Tuple[int, int]:
    """
    Count similar job titles in the market.
    Returns (similar_count, total_market).
    """
    url = f"{ADZUNA_BASE_URL}/{country}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 1,
        "what": job_title,
    }
    
    try:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        similar_count = data.get("count", 0)
        
        # Also get total market (all jobs)
        total_params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "results_per_page": 1,
        }
        total_response = await client.get(url, params=total_params)
        total_data = total_response.json()
        market_total = total_data.get("count", 0)
        
        return similar_count, market_total
    except Exception:
        return 0, 0


def _calculate_scores(result: MarketActivityResult) -> MarketActivityResult:
    """
    Calculate activity scores from raw counts.
    
    Scoring logic:
    - Company Activity: More jobs from company = higher score
    - Market Demand: More similar titles = higher demand
    - Hiring Activity: Combined score
    """
    # Company Activity Score (0-100)
    # 0 jobs = 30, 1-5 jobs = 50-70, 5-20 jobs = 70-85, 20+ jobs = 85-100
    if result.company_job_count == 0:
        result.company_activity_score = 30  # No presence = low activity
    elif result.company_job_count <= 5:
        result.company_activity_score = 50 + (result.company_job_count * 4)
    elif result.company_job_count <= 20:
        result.company_activity_score = 70 + min(15, (result.company_job_count - 5))
    else:
        result.company_activity_score = min(100, 85 + (result.company_job_count - 20) // 10)
    
    # Market Demand Score (0-100)
    # Based on how common this job title is
    if result.similar_title_count == 0:
        result.market_demand_score = 40  # Rare role
    elif result.similar_title_count < 50:
        result.market_demand_score = 50  # Uncommon
    elif result.similar_title_count < 200:
        result.market_demand_score = 65  # Moderate demand
    elif result.similar_title_count < 500:
        result.market_demand_score = 75  # Good demand
    elif result.similar_title_count < 1000:
        result.market_demand_score = 85  # High demand
    else:
        result.market_demand_score = 95  # Very high demand
    
    # Combined Hiring Activity Score
    # Weight: 60% company activity, 40% market demand
    result.hiring_activity_score = int(
        0.6 * result.company_activity_score + 
        0.4 * result.market_demand_score
    )
    
    return result


def _fallback_activity_score(job_text: str, result: MarketActivityResult) -> MarketActivityResult:
    """
    Fallback scoring when API is unavailable.
    Uses keyword-based heuristics.
    """
    result.data_source = "fallback_keywords"
    text_lower = job_text.lower()
    
    score = 50  # Base score
    
    # Positive signals (actively hiring)
    if any(term in text_lower for term in ["urgent", "immediate", "asap", "start today"]):
        score += 15
    if any(term in text_lower for term in ["growing team", "expanding", "new position"]):
        score += 10
    if any(term in text_lower for term in ["multiple openings", "several positions"]):
        score += 10
    if any(term in text_lower for term in ["competitive salary", "excellent benefits"]):
        score += 5
    
    # Negative signals (not actively hiring)
    if "talent pipeline" in text_lower or "future opportunities" in text_lower:
        score -= 20
    if "may not" in text_lower or "might not" in text_lower:
        score -= 15
    if "evergreen" in text_lower or "talent pool" in text_lower:
        score -= 15
    
    result.hiring_activity_score = max(0, min(100, score))
    result.company_activity_score = result.hiring_activity_score
    result.market_demand_score = result.hiring_activity_score
    
    return result


# =============================================================================
# Synchronous Wrapper
# =============================================================================

def check_market_activity_sync(
    job_text: str,
    company_name: Optional[str] = None,
    job_title: Optional[str] = None,
    country: str = DEFAULT_COUNTRY
) -> MarketActivityResult:
    """
    Synchronous wrapper for check_market_activity.
    Safe to use within FastAPI's async context.
    """
    import asyncio
    import concurrent.futures
    
    result = MarketActivityResult()
    
    # Check if Adzuna is configured
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        result.error = "Adzuna API not configured"
        result.data_source = "fallback"
        return _fallback_activity_score(job_text, result)
    
    # Extract company and title
    if not company_name:
        from app.services.reputation import extract_company_name
        company_name = extract_company_name(job_text)
    
    if not job_title:
        job_title = _extract_job_title(job_text)
    
    result.company_name = company_name
    result.job_title = job_title
    
    # Check cache first
    cache_key = _get_cache_key(company_name, job_title)
    if _is_cache_valid(cache_key):
        cached_result, _ = _market_cache[cache_key]
        result = MarketActivityResult(**cached_result)
        result.cached = True
        return result
    
    # Run async code in a separate thread to avoid event loop conflicts
    def run_async():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                check_market_activity(job_text, company_name, job_title, country)
            )
        finally:
            loop.close()
    
    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(run_async)
            result = future.result(timeout=15)  # 15 second timeout
    except concurrent.futures.TimeoutError:
        result.error = "API timeout"
        result = _fallback_activity_score(job_text, result)
    except Exception as e:
        result.error = str(e)
        result = _fallback_activity_score(job_text, result)
    
    return result

