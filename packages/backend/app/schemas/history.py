"""
History Schemas - Pydantic models for history API
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class HistoryItem(BaseModel):
    """A single analysis history item."""
    id: int
    job_text: str
    job_url: Optional[str] = None
    true_score: int
    risk_level: str
    breakdown: Optional[Dict[str, Any]] = None
    created_at: str


class HistoryResponse(BaseModel):
    """Response for history list endpoint."""
    items: List[HistoryItem]
    total: int


class UserStats(BaseModel):
    """Aggregated user statistics."""
    total_analyses: int
    avg_score: int
    danger_count: int
    safe_count: int


class StatsResponse(BaseModel):
    """Response for user stats endpoint."""
    stats: UserStats
    message: str = "Your analysis statistics"
