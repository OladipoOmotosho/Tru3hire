"""
Company Verification API Routes

Endpoints for checking company trustworthiness and reporting companies.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.company_db import (
    check_company, 
    report_company, 
    get_company_db,
    CompanyStatus
)

router = APIRouter(prefix="/company", tags=["company"])


class CompanyCheckResponse(BaseModel):
    """Response for company check endpoint."""
    company_name: str
    status: str
    status_label: str
    confidence: float
    match_type: str
    matched_name: Optional[str] = None
    scam_reports: int = 0
    legit_reports: int = 0
    notes: Optional[str] = None
    risk_level: str  # "low", "medium", "high", "unknown"


class ReportRequest(BaseModel):
    """Request body for reporting a company."""
    company_name: str
    is_scam: bool
    notes: Optional[str] = None


class ReportResponse(BaseModel):
    """Response for report endpoint."""
    success: bool
    message: str


def _get_status_label(status: CompanyStatus) -> str:
    """Get human-readable status label."""
    labels = {
        CompanyStatus.VERIFIED_LEGIT: "Verified Legitimate",
        CompanyStatus.LIKELY_LEGIT: "Likely Legitimate",
        CompanyStatus.UNKNOWN: "Unknown",
        CompanyStatus.SUSPICIOUS: "Suspicious",
        CompanyStatus.KNOWN_SCAM: "Known Scam",
    }
    return labels.get(status, "Unknown")


def _get_risk_level(status: CompanyStatus) -> str:
    """Get risk level from status."""
    risk_map = {
        CompanyStatus.VERIFIED_LEGIT: "low",
        CompanyStatus.LIKELY_LEGIT: "low",
        CompanyStatus.UNKNOWN: "unknown",
        CompanyStatus.SUSPICIOUS: "medium",
        CompanyStatus.KNOWN_SCAM: "high",
    }
    return risk_map.get(status, "unknown")


@router.get("/check", response_model=CompanyCheckResponse)
async def check_company_endpoint(
    name: str = Query(..., min_length=1, description="Company name to check")
):
    """
    Check if a company is known and trustworthy.
    
    Uses fuzzy matching to handle typos and variations.
    
    Returns:
    - status: verified_legit, likely_legit, unknown, suspicious, known_scam
    - confidence: 0.0 to 1.0 (how confident we are in the match)
    - risk_level: low, medium, high, unknown
    """
    result = check_company(name)
    
    return CompanyCheckResponse(
        company_name=result.company_name,
        status=result.status.value,
        status_label=_get_status_label(result.status),
        confidence=result.confidence,
        match_type=result.match_type,
        matched_name=result.matched_name,
        scam_reports=result.scam_reports,
        legit_reports=result.legit_reports,
        notes=result.notes,
        risk_level=_get_risk_level(result.status)
    )


@router.post("/report", response_model=ReportResponse)
async def report_company_endpoint(request: ReportRequest):
    """
    Submit a user report about a company.
    
    Reports are aggregated to determine company trustworthiness.
    Multiple reports are required to change a company's status.
    """
    if len(request.company_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Company name too short")
    
    success = report_company(
        company_name=request.company_name,
        is_scam=request.is_scam,
        notes=request.notes
    )
    
    report_type = "scam" if request.is_scam else "legitimate"
    
    return ReportResponse(
        success=success,
        message=f"Thank you for reporting {request.company_name} as {report_type}."
    )


@router.get("/stats")
async def get_company_stats():
    """
    Get statistics about the company database.
    
    Returns total companies, breakdown by status, and feature flags.
    """
    db = get_company_db()
    return db.get_stats()
