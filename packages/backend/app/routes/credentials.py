"""
API Routes for Credential Pathways.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field

# Imports using absolute path logic for project structure
from app.services.credential_service import analyze_credentials
from app.dependencies import get_current_user

router = APIRouter()

class CredentialAnalysisRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Resume/CV text to analyze")
    target_role: str

class CredentialAnalysisResponse(BaseModel):
    pathway: Dict
    status: str
    steps: List[Dict[str, Any]]

@router.post("/analyze", response_model=CredentialAnalysisResponse)
async def analyze_user_credentials(
    request: CredentialAnalysisRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Analyze a user's resume against a target role's regulated pathway.
    """
    result = analyze_credentials(request.resume_text, request.target_role)
    
    if not result:
        # If no pathway found (e.g. role is "Cashier"), maybe return 404 or empty?
        # Let's 404 so frontend knows this feature is not applicable.
        raise HTTPException(status_code=404, detail=f"No regulated pathway found for role: {request.target_role}")
        
    return result

@router.get("/pathway")
async def get_pathway_definition(role: str = Query(..., description="Target role name like 'engineer'")):
    """
    Get the static pathway definition for a role (without user status).
    Returns basic structure assuming user has nothing completed.
    """
    result = analyze_credentials("", role)
    if not result:
        raise HTTPException(status_code=404, detail="Pathway not found")
        
    return result
