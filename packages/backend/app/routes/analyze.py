"""
Analysis Routes - POST /analyze endpoint for TrueScore calculation.
"""

import re
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from app.schemas import (
    AnalysisResponse,
    TrueScoreBreakdown,
    Insight,
    Recommendation,
    CompanyInfo,
)
from app.services.scorer import true_score_aggregator
from app.services.company_db import check_company, CompanyStatus
from app.database import save_analysis

router = APIRouter(prefix="/api", tags=["analysis"])
print("✅ MODULE RELOADED: app.routes.analyze")


def extract_company_name(job_text: str) -> Optional[str]:
    """
    Extract company name from job posting text.
    
    Looks for patterns like:
    - "About [Company Name]"
    - "[Company Name] is hiring"
    - "Join [Company Name]"
    - "at [Company Name]"
    """
    patterns = [
        r"About\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+is|\s*$|\.|,|\n)",
        r"([A-Z][A-Za-z0-9\s&.,'-]+?)\s+is\s+(?:hiring|looking|seeking)",
        r"Join\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+as|\s+and|\.|,|\n)",
        r"work(?:ing)?\s+at\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+|\.|,|\n)",
        r"([A-Z][A-Za-z0-9\s&.,'-]+?)\s+team\s+is",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, job_text[:1000])  # Check first 1000 chars
        if match:
            company = match.group(1).strip()
            # Clean up and validate
            if 2 <= len(company) <= 50:
                return company
    
    return None


def get_status_label(status: CompanyStatus) -> str:
    """Get human-readable status label."""
    labels = {
        CompanyStatus.VERIFIED_LEGIT: "Verified Legitimate",
        CompanyStatus.LIKELY_LEGIT: "Likely Legitimate",
        CompanyStatus.UNKNOWN: "Unknown",
        CompanyStatus.SUSPICIOUS: "Suspicious",
        CompanyStatus.KNOWN_SCAM: "Known Scam",
    }
    return labels.get(status, "Unknown")


def get_risk_level(status: CompanyStatus) -> str:
    """Get risk level from status."""
    risk_map = {
        CompanyStatus.VERIFIED_LEGIT: "low",
        CompanyStatus.LIKELY_LEGIT: "low",
        CompanyStatus.UNKNOWN: "unknown",
        CompanyStatus.SUSPICIOUS: "medium",
        CompanyStatus.KNOWN_SCAM: "high",
    }
    return risk_map.get(status, "unknown")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_job(
    job_text: str = Form(..., min_length=50, description="Job posting text"),
    job_url: Optional[str] = Form(None, description="Optional job URL"),
    request_user_id: Optional[str] = Form(None, alias="user_id", description="Optional user ID for history"),
    resume_file: Optional[UploadFile] = File(None, description="Optional resume PDF"),
):
    print(f"DEBUG: analyze_job called. UserID: {request_user_id}, JobURL: {job_url}, HasResume: {resume_file is not None}")
    """
    Analyze a job posting and return the TrueScore.
    """
    
    if len(job_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short. Please provide at least 50 characters."
        )
    
    # =========================================================================
    # STEP 1: Company Verification
    # =========================================================================
    
    company_info = None
    # Extract company name
    company_name = extract_company_name(job_text)
    
    if company_name:
        result_company = check_company(company_name)
        company_info = CompanyInfo(
            company_name=company_name,
            status=result_company.status.value,
            status_label=get_status_label(result_company.status),
            risk_level=get_risk_level(result_company.status),
            confidence=result_company.confidence,
            matched_name=result_company.matched_name,
            notes=result_company.notes
        )
    
    # =========================================================================
    # STEP 2: Run TrueScore ML Analysis
    # =========================================================================
    
    result = true_score_aggregator.analyze(
        job_text=job_text,
        resume_text=None,
        job_url=job_url,
    )
    
    # =========================================================================
    # Save to History
    # =========================================================================
    
    print(f"DEBUG: Saving analysis for user {request_user_id}")
    try:
        save_analysis(
            job_text=job_text,
            true_score=result.true_score,
            risk_level=result.risk_level,
            breakdown={
                "authenticity": result.breakdown.authenticity,
                "hiring_likelihood": result.breakdown.hiring_likelihood,
                "resume_match": result.breakdown.resume_match,
                "company_reputation": result.breakdown.company_reputation,
            },
            job_url=job_url,
            user_id=request_user_id,
        )
    except Exception as e:
        print(f"Warning: Failed to save to history: {e}")
    
    # Build response
    return {
        "true_score": result.true_score,
        "risk_level": result.risk_level,
        "breakdown": result.breakdown,
        "insights": result.insights,
        "recommendations": result.recommendations,
        "company": company_info,
    }
