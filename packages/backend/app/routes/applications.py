"""
Application Tracking Routes

Endpoints for tracking job applications and recording outcomes.
This enables the feedback loop for improving interview probability predictions.
"""

import os
import jwt
import httpx
import time
from jwt import PyJWKClient
from fastapi import APIRouter, HTTPException, Query, Header, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.database import (
    save_application,
    get_user_applications,
    get_pending_feedback,
    save_application_outcome,
    get_company_stats,
    get_user_application_stats,
)

router = APIRouter(prefix="/applications", tags=["applications"])


# =============================================================================
# Clerk JWT Verification with JWKS
# =============================================================================

# Cache for JWKS client (reuse to avoid fetching keys on every request)
_jwks_client: Optional[PyJWKClient] = None
_jwks_client_created_at: float = 0
_JWKS_CACHE_TTL = 3600  # Refresh JWKS every hour

def _get_clerk_jwks_url() -> str:
    """Get the JWKS URL for the Clerk instance."""
    # Clerk JWKS URL format: https://<clerk-instance>.clerk.accounts.dev/.well-known/jwks.json
    # Or for production: https://api.clerk.com/.well-known/jwks.json
    clerk_issuer = os.environ.get("CLERK_ISSUER", "")
    
    if clerk_issuer:
        return f"{clerk_issuer}/.well-known/jwks.json"
    
    # Fallback: construct from publishable key
    clerk_pk = os.environ.get("CLERK_PUBLISHABLE_KEY", "")
    if clerk_pk:
        # Extract instance from pk_test_xxx or pk_live_xxx
        # The issuer is usually https://<something>.clerk.accounts.dev
        pass
    
    # Default for development - users should set CLERK_ISSUER env var
    return "https://api.clerk.com/.well-known/jwks.json"


def _get_jwks_client() -> PyJWKClient:
    """Get or create a cached JWKS client."""
    global _jwks_client, _jwks_client_created_at
    
    current_time = time.time()
    
    # Check if cache expired or client doesn't exist
    if _jwks_client is None or (current_time - _jwks_client_created_at) > _JWKS_CACHE_TTL:
        jwks_url = _get_clerk_jwks_url()
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=_JWKS_CACHE_TTL)
        _jwks_client_created_at = current_time
    
    return _jwks_client


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    Extract and verify user_id from Clerk JWT token.
    
    This properly verifies the token signature using Clerk's JWKS public keys,
    preventing user_id spoofing.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = parts[1]
    
    try:
        # Get JWKS client and signing key
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Get expected issuer from environment
        clerk_issuer = os.environ.get("CLERK_ISSUER", "")
        
        # Decode and verify token with full validation
        decode_options = {
            "verify_signature": True,
            "verify_exp": True,            # Check expiration
            "verify_iat": True,            # Check issued-at
            "verify_nbf": True,            # Check not-before
            "require": ["sub", "exp", "iat"],  # Required claims
        }
        
        # Build decode kwargs
        decode_kwargs = {
            "algorithms": ["RS256"],
            "options": decode_options,
        }
        
        # Add issuer verification if configured
        if clerk_issuer:
            decode_kwargs["issuer"] = clerk_issuer
        
        payload = jwt.decode(
            token,
            signing_key.key,
            **decode_kwargs
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user ID")
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        # Catch JWKS fetch errors and other unexpected issues
        print(f"JWT verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")


# =============================================================================
# Request/Response Models
# =============================================================================

class ApplicationCreate(BaseModel):
    job_title: str
    company_name: str
    job_id: Optional[str] = None
    job_url: Optional[str] = None
    true_score_at_apply: Optional[int] = None
    job_age_days: Optional[int] = None


class OutcomeCreate(BaseModel):
    outcome: str  # 'no_response', 'rejected', 'interview', 'offer'
    days_to_response: Optional[int] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    job_title: str
    company_name: str
    job_url: Optional[str]
    true_score_at_apply: Optional[int]
    job_age_days: Optional[int]
    applied_at: str
    outcome: Optional[str]
    days_to_response: Optional[int]


class CompanyStatsResponse(BaseModel):
    company_name: str
    total_applications: int
    total_responses: int
    total_interviews: int
    total_offers: int
    avg_response_days: Optional[float]
    response_rate: Optional[float]


class UserStatsResponse(BaseModel):
    total_applications: int
    tracked_outcomes: int
    no_response: int
    rejected: int
    interviews: int
    offers: int
    avg_days_to_response: Optional[float]
    avg_truescore_applied: Optional[float]
    response_rate: Optional[float]
    interview_rate: Optional[float]


# =============================================================================
# Endpoints
# =============================================================================

@router.post("", status_code=201)
async def create_application(
    application: ApplicationCreate,
    user_id: str = Depends(get_current_user),  # Verified from JWT, not query param
):
    """
    Log a new job application.
    
    Call this when a user clicks "I Applied" on a job.
    Requires authenticated user (JWT token in Authorization header).
    """
    try:
        app_id = save_application(
            user_id=user_id,
            job_title=application.job_title,
            company_name=application.company_name,
            job_id=application.job_id,
            job_url=application.job_url,
            true_score_at_apply=application.true_score_at_apply,
            job_age_days=application.job_age_days,
        )
        return {"success": True, "application_id": app_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_applications(
    user_id: str = Query(..., description="User ID from Clerk"),
    limit: int = Query(50, ge=1, le=100, description="Max applications to return"),
):
    """
    Get all applications for a user.
    
    Includes outcome if feedback has been provided.
    """
    applications = get_user_applications(user_id, limit)
    return {"applications": applications, "count": len(applications)}


@router.get("/pending")
async def list_pending_feedback(
    user_id: str = Query(..., description="User ID from Clerk"),
    days_threshold: int = Query(7, ge=1, le=30, description="Days since application"),
):
    """
    Get applications awaiting feedback.
    
    Returns applications older than X days with no outcome recorded.
    Use this to prompt users for feedback.
    """
    pending = get_pending_feedback(user_id, days_threshold)
    return {"pending": pending, "count": len(pending)}


@router.post("/{application_id}/outcome", status_code=201)
async def record_outcome(
    application_id: int,
    outcome_data: OutcomeCreate,
):
    """
    Record the outcome of an application.
    
    Valid outcomes:
    - no_response: Never heard back
    - rejected: Got a rejection
    - interview: Got an interview!
    - offer: Got an offer!
    """
    try:
        outcome_id = save_application_outcome(
            application_id=application_id,
            outcome=outcome_data.outcome,
            days_to_response=outcome_data.days_to_response,
            notes=outcome_data.notes,
        )
        return {"success": True, "outcome_id": outcome_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_user_stats(
    user_id: str = Query(..., description="User ID from Clerk"),
):
    """
    Get aggregated application statistics for a user.
    
    Returns interview rate, response rate, average TrueScore, etc.
    """
    stats = get_user_application_stats(user_id)
    
    # Calculate derived rates
    total = stats.get("total_applications", 0) or 0
    tracked = stats.get("tracked_outcomes", 0) or 0
    interviews = stats.get("interviews", 0) or 0
    no_response = stats.get("no_response", 0) or 0
    
    response_rate = None
    interview_rate = None
    
    if tracked > 0:
        response_rate = (tracked - no_response) / tracked
        interview_rate = interviews / tracked
    
    return {
        **stats,
        "response_rate": response_rate,
        "interview_rate": interview_rate,
    }


@router.get("/companies/{company_name}/stats")
async def get_company_response_stats(company_name: str):
    """
    Get response statistics for a specific company.
    
    Shows aggregated data from all users who applied.
    """
    stats = get_company_stats(company_name)
    
    if not stats:
        return {
            "company_name": company_name,
            "message": "No data yet for this company",
            "total_applications": 0,
        }
    
    return stats
