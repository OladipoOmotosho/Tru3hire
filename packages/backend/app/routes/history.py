"""
History Routes - API endpoints for analysis history
"""

from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel, constr

from app.dependencies import get_current_user
from app.database import (
    ignore_user_skill_gap,
    get_user_history,
    get_user_stats,
    get_analysis_by_id,
    get_user_skill_gaps,
)

router = APIRouter()


# =============================================================================
# Response Models
# =============================================================================

class HistoryItem(BaseModel):
    id: int
    job_text: str
    job_url: Optional[str] = None
    true_score: int
    risk_level: str
    created_at: str
    breakdown: Optional[dict] = None


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int


class HistoryStats(BaseModel):
    total_analyses: int
    avg_score: int
    danger_count: int
    safe_count: int


class HistoryStatsResponse(BaseModel):
    stats: HistoryStats


class SkillGap(BaseModel):
    skill: str
    count: int
    last_seen: Optional[str] = None


class SkillGapResponse(BaseModel):
    skills: List[SkillGap]


class IgnoreSkillRequest(BaseModel):
    skill: constr(strip_whitespace=True, min_length=1)


# =============================================================================
# History Endpoints
# =============================================================================

@router.get("/history/stats", response_model=HistoryStatsResponse)
async def get_history_stats(
    user_id: Optional[str] = Query(None, description="User ID for filtering")
):
    """
    Get aggregated stats for a user's analysis history.
    """
    stats = get_user_stats(user_id)
    return HistoryStatsResponse(stats=HistoryStats(**stats))


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    user_id: Optional[str] = Query(None, description="User ID for filtering")
):
    """
    Get analysis history for a user.
    """
    items = get_user_history(user_id, limit)
    
    # Convert datetime objects to strings for serialization
    for item in items:
        if item.get('created_at') and not isinstance(item['created_at'], str):
            item['created_at'] = item['created_at'].isoformat()
    
    return HistoryResponse(items=items, total=len(items))


@router.get("/history/{analysis_id}")
async def get_single_analysis(analysis_id: int):
    """
    Get a single analysis by ID.
    """
    item = get_analysis_by_id(analysis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Convert datetime objects to strings for serialization
    if item.get('created_at') and not isinstance(item['created_at'], str):
        item['created_at'] = item['created_at'].isoformat()
    
    return item


# =============================================================================
# Skill Gap Endpoints
# =============================================================================

@router.get("/skill-gaps", response_model=SkillGapResponse)
async def get_skill_gaps(
    user_id: str = Query(..., description="User ID (required)"),
    limit: int = Query(5, ge=1, le=50, description="Number of top skills to return")
):
    """
    Get aggregated skill gaps for a user.
    """
    skills = get_user_skill_gaps(user_id, limit)
    
    # Convert datetime objects to strings for serialization
    for skill in skills:
        if skill.get('last_seen') and not isinstance(skill['last_seen'], str):
            skill['last_seen'] = skill['last_seen'].isoformat()
    
    return SkillGapResponse(skills=skills)


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
