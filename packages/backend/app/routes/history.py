"""
History Routes - API endpoints for analysis history
"""

from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel, constr

from app.dependencies import get_current_user
from app.database import ignore_user_skill_gap

router = APIRouter()

class IgnoreSkillRequest(BaseModel):
    skill: constr(strip_whitespace=True, min_length=1)

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
