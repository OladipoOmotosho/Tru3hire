"""
Report Routes - API endpoints for scam report submissions
"""

from fastapi import APIRouter, HTTPException, Request
from app.schemas.report import (
    ScamReportRequest,
    ScamReportResponse,
    ScamReportStats,
)
from app.database import create_scam_report, get_scam_report_count
from app.config.rate_limits import limiter, REPORT_LIMIT

router = APIRouter(prefix="/api", tags=["reports"])


@router.post("/report-scam", response_model=ScamReportResponse)
@limiter.limit(REPORT_LIMIT)
async def submit_scam_report(
    report: ScamReportRequest,
    request: Request,
):
    """
    Submit a scam report.
    
    Users can report suspicious job postings to help train our AI
    and warn the community.
    
    - **job_url**: Optional URL of the suspicious posting
    - **job_text**: The job posting text (required)
    - **reason**: Why the user believes this is a scam (required)
    - **email**: Optional email for follow-up
    """
    
    try:
        # Get client IP for rate limiting (future)
        client_ip = request.client.host if request.client else None
        
        # Save to database
        report_id = create_scam_report(
            job_text=report.job_text,
            reason=report.reason,
            job_url=report.job_url,
            email=report.email,
            ip_address=client_ip
        )
        
        return ScamReportResponse(
            success=True,
            message="Thank you for your report! It helps protect job seekers.",
            report_id=report_id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit report: {str(e)}"
        )


@router.get("/report-scam/stats", response_model=ScamReportStats)
async def get_report_stats():
    """
    Get scam report statistics.
    
    Returns the total number of reports submitted by the community.
    """
    
    total = get_scam_report_count()
    
    return ScamReportStats(
        total_reports=total,
        message=f"Our community has submitted {total} reports to protect job seekers!"
    )
