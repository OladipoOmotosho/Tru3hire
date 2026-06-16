"""
Scam Report Schemas - Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional


class ScamReportRequest(BaseModel):
    """Request body for submitting a scam report."""
    
    job_url: Optional[str] = Field(
        None, 
        description="URL of the suspicious job posting"
    )
    job_text: str = Field(
        ..., 
        min_length=50, 
        description="The job posting text (required, min 50 chars)"
    )
    reason: str = Field(
        ..., 
        min_length=20, 
        description="Why the user thinks this is a scam"
    )
    email: Optional[str] = Field(
        None, 
        description="Optional email for follow-up"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_url": "https://example.com/fake-job",
                "job_text": "Make $5000/day working from home! No experience needed. Send $100 training fee to get started...",
                "reason": "Asks for upfront payment and promises unrealistic income",
                "email": "reporter@example.com"
            }
        }


class ScamReportResponse(BaseModel):
    """Response after submitting a scam report."""
    
    success: bool
    message: str
    report_id: int


class ScamReportStats(BaseModel):
    """Statistics about scam reports."""
    
    total_reports: int
    message: str = "Thank you to our community for helping protect job seekers!"
