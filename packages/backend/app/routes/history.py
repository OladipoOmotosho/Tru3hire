"""
History Routes - API endpoints for analysis history
"""

from fastapi import APIRouter, Query, Depends, HTTPException
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
    get_user_skill_gaps,
    ignore_user_skill_gap
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    user_id: str = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return")
):
    """
    Get analysis history for the authenticated user.
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
    user_id: str = Depends(get_current_user)
):
    """
    Get aggregated statistics for the authenticated user.
    """
    stats = get_user_stats(user_id=user_id)
    
    return StatsResponse(
        stats=UserStats(**stats),
        message=f"You've analyzed {stats['total_analyses']} jobs"
    )


@router.get("/history/{analysis_id}")
async def get_single_analysis(
    analysis_id: int,
    user_id: str = Depends(get_current_user)
):
    """
    Get a single analysis by ID.
    Enforces ownership check.
    """
    analysis = get_analysis_by_id(analysis_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Security: Verify ownership
    if analysis.get("user_id") and analysis["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
    
    return analysis


@router.get("/skill-gaps")
async def get_skill_gaps(
    user_id: str = Depends(get_current_user),
    limit: int = Query(5, description="Number of skills to return")
):
    """
    Get top missing skills for the authenticated user.
    """
    skills = get_user_skill_gaps(user_id=user_id, limit=limit)
    return {"skills": skills}


from pydantic import BaseModel
class IgnoreSkillRequest(BaseModel):
    skill: str
    # user_id is now inferred from token, but kept optional for backward compat if client sends it
    user_id: Optional[str] = None 

@router.post("/skill-gaps/ignore")
async def ignore_skill(
    request: IgnoreSkillRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Mark a skill as ignored so it doesn't appear in future gap analyses.
    """
    success = ignore_user_skill_gap(user_id, request.skill)
    return {"success": success}
