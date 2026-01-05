"""
History Routes - API endpoints for analysis history
"""

from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.history import (
    HistoryResponse,
    HistoryItem,
    StatsResponse,
    UserStats,
)
from app.database import (
    get_user_history, 
    get_user_stats, 
    get_analysis_by_id,
    get_user_skill_gaps
)

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    user_id: Optional[str] = Query(None, description="User ID for filtering"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return")
):
    """
    Get analysis history.
    
    For MVP, returns all analyses. When user auth is implemented,
    can filter by user_id.
    """
    items = get_user_history(user_id=user_id, limit=limit)
    
    # Convert to Pydantic models
    history_items = [
        HistoryItem(
            id=item["id"],
            job_text=item["job_text"][:200] + "..." if len(item["job_text"]) > 200 else item["job_text"],
            job_url=item.get("job_url"),
            true_score=item["true_score"],
            risk_level=item["risk_level"],
            breakdown=item.get("breakdown"),
            created_at=str(item["created_at"]),
        )
        for item in items
    ]
    
    return HistoryResponse(
        items=history_items,
        total=len(history_items)
    )


@router.get("/history/stats", response_model=StatsResponse)
async def get_stats(
    user_id: Optional[str] = Query(None, description="User ID for filtering")
):
    """
    Get aggregated statistics for analysis history.
    
    Returns:
    - Total analyses count
    - Average TrueScore
    - Danger/safe job counts
    """
    stats = get_user_stats(user_id=user_id)
    
    return StatsResponse(
        stats=UserStats(**stats),
        message=f"You've analyzed {stats['total_analyses']} jobs"
    )


@router.get("/history/{analysis_id}")
async def get_single_analysis(analysis_id: int):
    """
    Get a single analysis by ID.
    """
    analysis = get_analysis_by_id(analysis_id)
    
    if not analysis:
        return {"error": "Analysis not found", "id": analysis_id}
    
    
    return analysis


@router.get("/skill-gaps")
async def get_skill_gaps(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(5, description="Number of skills to return")
):
    """
    Get top missing skills for a user.
    """
    skills = get_user_skill_gaps(user_id=user_id, limit=limit)
    return {"skills": skills}
