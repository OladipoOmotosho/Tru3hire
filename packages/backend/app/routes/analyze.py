"""
Analysis Routes - POST /analyze endpoint for TrueScore calculation.
"""

import re
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
    resume_file: Optional[UploadFile] = File(None, description="Optional resume PDF"),
):
    """
    Analyze a job posting and return the TrueScore.
    
    - **job_text**: The job description text (required, min 50 chars)
    - **job_url**: Optional URL of the job posting
    - **resume_file**: Optional resume file (PDF/DOCX) for match scoring
    
    Returns a comprehensive TrueScore breakdown with insights.
    """
    
    # Validate job text length
    if len(job_text.strip()) < 50:
        raise HTTPException(
            status_code=400, 
            detail="Job text must be at least 50 characters"
        )
    
    # Handle resume file if provided
    resume_text = None
    resume_metadata = None
    
    if resume_file:
        try:
            content = await resume_file.read()
            
            # Check if it's a PDF
            if content.startswith(b'%PDF') or resume_file.filename.lower().endswith('.pdf'):
                from app.services.resume_parser import extract_text_from_pdf, is_valid_pdf
                
                if is_valid_pdf(content):
                    resume_text, resume_metadata = extract_text_from_pdf(
                        content, 
                        resume_file.filename or "resume.pdf"
                    )
                    
                    if not resume_text or len(resume_text.strip()) < 50:
                        # PDF parsing failed or empty
                        resume_text = None
                        print(f"PDF extraction failed: {resume_metadata.get('error')}")
                else:
                    resume_text = None
            else:
                # Try to read as plain text
                try:
                    resume_text = content.decode('utf-8')
                except UnicodeDecodeError:
                    resume_text = None
                    
        except Exception as e:
            # Don't fail the request if resume can't be parsed
            print(f"Warning: Failed to parse resume: {e}")
            resume_text = None
    
    # =========================================================================
    # STEP 1: Company Verification
    # =========================================================================
    
    company_info = None
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
        resume_text=resume_text,
        job_url=job_url,
    )
    
    # =========================================================================
    # Save to History
    # =========================================================================
    
    try:
        save_analysis(
            job_text=job_text,
            true_score=result.true_score,
            risk_level=result.risk_level,
            breakdown={
                "authenticity": result.breakdown.authenticity,
                "hiring_likelihood": result.breakdown.hiring_likelihood,
                "resume_match": result.breakdown.resume_match,
                "bias_fairness": result.breakdown.bias_fairness,
                "company_reputation": result.breakdown.company_reputation,
            },
            job_url=job_url,
            user_id=None,  # TODO: Get from auth when implemented
        )
    except Exception as e:
        # Don't fail the request if history save fails
        print(f"Warning: Failed to save to history: {e}")
    
    # Convert to response schema
    return AnalysisResponse(
        true_score=result.true_score,
        risk_level=result.risk_level,
        breakdown=TrueScoreBreakdown(
            authenticity=result.breakdown.authenticity,
            hiring_likelihood=result.breakdown.hiring_likelihood,
            resume_match=result.breakdown.resume_match,
            bias_fairness=result.breakdown.bias_fairness,
            company_reputation=result.breakdown.company_reputation,
        ),
        insights=[
            Insight(type=i.type, icon=i.icon, message=i.message)
            for i in result.insights
        ],
        recommendations=[
            Recommendation(action=r.action, impact=r.impact)
            for r in result.recommendations
        ],
        company=company_info,
    )


@router.get("/health-check", tags=["health"])
async def api_health():
    """Quick health check for the API router."""
    return {"status": "ok", "router": "analyze"}

