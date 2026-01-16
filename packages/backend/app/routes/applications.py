"""
Application Tracking Routes

Endpoints for tracking job applications and recording outcomes.
This enables the feedback loop for improving interview probability predictions.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.database import (
    save_application,
    get_user_applications,
    get_pending_feedback,
    save_application_outcome,
    get_company_stats,
    get_user_application_stats,
)

router = APIRouter(prefix="/applications", tags=["applications"])


# =============================================================================
# Request/Response Models
# =============================================================================

class ApplicationCreate(BaseModel):
    job_title: str
    company_name: str
    job_id: Optional[str] = None
    job_url: Optional[str] = None
    true_score_at_apply: Optional[int] = None
    job_age_days: Optional[int] = None


class OutcomeCreate(BaseModel):
    outcome: str  # 'no_response', 'rejected', 'interview', 'offer'
    days_to_response: Optional[int] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    job_title: str
    company_name: str
    job_url: Optional[str]
    true_score_at_apply: Optional[int]
    job_age_days: Optional[int]
    applied_at: str
    outcome: Optional[str]
    days_to_response: Optional[int]


class CompanyStatsResponse(BaseModel):
    company_name: str
    total_applications: int
    total_responses: int
    total_interviews: int
    total_offers: int
    avg_response_days: Optional[float]
    response_rate: Optional[float]


class UserStatsResponse(BaseModel):
    total_applications: int
    tracked_outcomes: int
    no_response: int
    rejected: int
    interviews: int
    offers: int
    avg_days_to_response: Optional[float]
    avg_truescore_applied: Optional[float]
    response_rate: Optional[float]
    interview_rate: Optional[float]


# =============================================================================
# Endpoints
# =============================================================================

@router.post("", status_code=201)
async def create_application(
    application: ApplicationCreate,
    user_id: str = Query(..., description="User ID from Clerk"),
):
    """
    Log a new job application.
    
    Call this when a user clicks "I Applied" on a job.
    """
    try:
        app_id = save_application(
            user_id=user_id,
            job_title=application.job_title,
            company_name=application.company_name,
            job_id=application.job_id,
            job_url=application.job_url,
            true_score_at_apply=application.true_score_at_apply,
            job_age_days=application.job_age_days,
        )
        return {"success": True, "application_id": app_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_applications(
    user_id: str = Query(..., description="User ID from Clerk"),
    limit: int = Query(50, ge=1, le=100, description="Max applications to return"),
):
    """
    Get all applications for a user.
    
    Includes outcome if feedback has been provided.
    """
    applications = get_user_applications(user_id, limit)
    return {"applications": applications, "count": len(applications)}


@router.get("/pending")
async def list_pending_feedback(
    user_id: str = Query(..., description="User ID from Clerk"),
    days_threshold: int = Query(7, ge=1, le=30, description="Days since application"),
):
    """
    Get applications awaiting feedback.
    
    Returns applications older than X days with no outcome recorded.
    Use this to prompt users for feedback.
    """
    pending = get_pending_feedback(user_id, days_threshold)
    return {"pending": pending, "count": len(pending)}


@router.post("/{application_id}/outcome", status_code=201)
async def record_outcome(
    application_id: int,
    outcome_data: OutcomeCreate,
):
    """
    Record the outcome of an application.
    
    Valid outcomes:
    - no_response: Never heard back
    - rejected: Got a rejection
    - interview: Got an interview!
    - offer: Got an offer!
    """
    try:
        outcome_id = save_application_outcome(
            application_id=application_id,
            outcome=outcome_data.outcome,
            days_to_response=outcome_data.days_to_response,
            notes=outcome_data.notes,
        )
        return {"success": True, "outcome_id": outcome_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_user_stats(
    user_id: str = Query(..., description="User ID from Clerk"),
):
    """
    Get aggregated application statistics for a user.
    
    Returns interview rate, response rate, average TrueScore, etc.
    """
    stats = get_user_application_stats(user_id)
    
    # Calculate derived rates
    total = stats.get("total_applications", 0) or 0
    tracked = stats.get("tracked_outcomes", 0) or 0
    interviews = stats.get("interviews", 0) or 0
    no_response = stats.get("no_response", 0) or 0
    
    response_rate = None
    interview_rate = None
    
    if tracked > 0:
        response_rate = (tracked - no_response) / tracked
        interview_rate = interviews / tracked
    
    return {
        **stats,
        "response_rate": response_rate,
        "interview_rate": interview_rate,
    }


@router.get("/companies/{company_name}/stats")
async def get_company_response_stats(company_name: str):
    """
    Get response statistics for a specific company.
    
    Shows aggregated data from all users who applied.
    """
    stats = get_company_stats(company_name)
    
    if not stats:
        return {
            "company_name": company_name,
            "message": "No data yet for this company",
            "total_applications": 0,
        }
    
    return stats
