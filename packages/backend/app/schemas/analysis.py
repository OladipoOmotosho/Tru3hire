"""
Pydantic schemas for the TrueScore Analysis API.

These models define the request/response structure for the /analyze endpoint.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


# =============================================================================
# Request Schemas
# =============================================================================

class AnalysisRequest(BaseModel):
    """Request body for job analysis."""
    job_text: str = Field(..., min_length=50, description="Job posting text (min 50 chars)")
    job_url: Optional[str] = Field(None, description="Optional URL of the job posting")
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_text": "We are looking for a Senior Software Engineer to join our team...",
                "job_url": "https://example.com/jobs/123"
            }
        }


# =============================================================================
# Response Schemas
# =============================================================================

class TrueScoreBreakdown(BaseModel):
    """Breakdown of the 5 TrueScore metrics."""
    authenticity: int = Field(..., ge=0, le=100, description="Fake job detection score (25%)")
    hiring_likelihood: int = Field(..., ge=0, le=100, description="Recency/activity score (25%)")
    resume_match: int = Field(..., ge=0, le=100, description="Resume fit score (25%)")
    bias_fairness: int = Field(..., ge=0, le=100, description="Bias detection score (15%)")
    company_reputation: int = Field(..., ge=0, le=100, description="Company sentiment score (10%)")


class Insight(BaseModel):
    """A single insight from the analysis."""
    type: str = Field(..., description="Insight type: 'warning', 'positive', or 'tip'")
    icon: str = Field(..., description="Emoji icon for the insight")
    message: str = Field(..., description="Human-readable insight message")


class Recommendation(BaseModel):
    """A recommendation for improving job fit."""
    action: str = Field(..., description="Recommended action")
    impact: str = Field(..., description="Expected impact: 'high', 'medium', 'low'")


class AnalysisResponse(BaseModel):
    """Complete response from job analysis."""
    true_score: int = Field(..., ge=0, le=100, description="Overall TrueScore (0-100)")
    risk_level: str = Field(..., description="Risk level: 'safe', 'caution', 'danger'")
    breakdown: TrueScoreBreakdown = Field(..., description="Score breakdown by metric")
    insights: List[Insight] = Field(default=[], description="Analysis insights")
    recommendations: List[Recommendation] = Field(default=[], description="Improvement suggestions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "true_score": 78,
                "risk_level": "safe",
                "breakdown": {
                    "authenticity": 85,
                    "hiring_likelihood": 70,
                    "resume_match": 80,
                    "bias_fairness": 75,
                    "company_reputation": 82
                },
                "insights": [
                    {"type": "positive", "icon": "✅", "message": "Job posting appears legitimate"},
                    {"type": "warning", "icon": "⚠️", "message": "Some gendered language detected"}
                ],
                "recommendations": [
                    {"action": "Add Python to your resume", "impact": "high"}
                ]
            }
        }


# =============================================================================
# Health Check Schema
# =============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    services: dict = Field(default={}, description="Status of dependent services")
