"""
Analysis Routes - POST /analyze endpoint for TrueScore calculation.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from app.schemas import (
    AnalysisResponse,
    TrueScoreBreakdown,
    Insight,
    Recommendation,
)
from app.services.scorer import true_score_aggregator

router = APIRouter(prefix="/api", tags=["analysis"])


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
    if resume_file:
        try:
            # For MVP: just read as text if possible
            # TODO: Use pypdf for PDF parsing
            content = await resume_file.read()
            try:
                resume_text = content.decode('utf-8')
            except UnicodeDecodeError:
                # Binary file (likely PDF), mock it for now
                resume_text = f"Resume uploaded: {resume_file.filename}"
        except Exception as e:
            # Don't fail if resume can't be read, just skip it
            resume_text = None
    
    # =========================================================================
    # Run TrueScore Analysis
    # =========================================================================
    
    result = true_score_aggregator.analyze(
        job_text=job_text,
        resume_text=resume_text,
        job_url=job_url,
    )
    
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
    )


@router.get("/health-check", tags=["health"])
async def api_health():
    """Quick health check for the API router."""
    return {"status": "ok", "router": "analyze"}
