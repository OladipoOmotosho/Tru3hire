"""
Analysis Routes - POST /analyze endpoint for TrueScore calculation.
"""

import re
import json
import logging
from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends, Request, Response, BackgroundTasks
from app.services.analytics import record_event
from typing import Optional, List, Dict

from app.config.rate_limits import limiter, ANALYZE_LIMIT

from app.schemas import AnalysisResponse, CompanyInfo
from app.services.scorer import true_score_aggregator
from app.services.company_db import check_company, CompanyStatus
from app.services.authenticity import validate_job_content
from app.services.resume_parser import parse_resume
from app.services.url_scraper import scrape_job_url
from app.database import (
    save_analysis,
    save_user_skill_gaps
)
from app.dependencies import get_optional_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analysis"])


def extract_company_name(job_text: str) -> Optional[str]:
    """
    Extract company name from job posting text.
    
    Looks for patterns like:
    - "About [Company Name]"
    - "[Company Name] is hiring"
    - "Join [Company Name]"
    - "at [Company Name]"
    """
    patterns = [
        r"About\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+is|\s*$|\.|,|\n)",
        r"([A-Z][A-Za-z0-9\s&.,'-]+?)\s+is\s+(?:hiring|looking|seeking)",
        r"Join\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+as|\s+and|\.|,|\n)",
        r"work(?:ing)?\s+at\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s+|\.|,|\n)",
        r"([A-Z][A-Za-z0-9\s&.,'-]+?)\s+team\s+is",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, job_text[:1000])  # Check first 1000 chars
        if match:
            company = match.group(1).strip()
            
            # Clean up common trailing phrases that get captured
            trailing_phrases = [
                r"\s+For\s+over.*$",
                r"\s+for\s+over.*$", 
                r"\s+has\s+been.*$",
                r"\s+is\s+a.*$",
                r"\s+We\s+are.*$",
                r"\s+Our\s+.*$",
                r"\s+Since\s+\d.*$",
            ]
            for phrase in trailing_phrases:
                company = re.sub(phrase, "", company, flags=re.IGNORECASE)
            
            company = company.strip()
            
            # Clean up and validate
            if 2 <= len(company) <= 50:
                return company
    
    return None


def get_status_label(status: CompanyStatus) -> str:
    """Get human-readable status label."""
    labels = {
        CompanyStatus.VERIFIED_LEGIT: "Verified Legitimate",
        CompanyStatus.LIKELY_LEGIT: "Likely Legitimate",
        CompanyStatus.UNKNOWN: "Unknown",
        CompanyStatus.SUSPICIOUS: "Suspicious",
        CompanyStatus.KNOWN_SCAM: "Known Scam",
    }
    return labels.get(status, "Unknown")


def get_risk_level(status: CompanyStatus) -> str:
    """Get risk level from status."""
    risk_map = {
        CompanyStatus.VERIFIED_LEGIT: "low",
        CompanyStatus.LIKELY_LEGIT: "low",
        CompanyStatus.UNKNOWN: "unknown",
        CompanyStatus.SUSPICIOUS: "medium",
        CompanyStatus.KNOWN_SCAM: "high",
    }
    return risk_map.get(status, "unknown")


@router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit(ANALYZE_LIMIT)
async def analyze_job(
    request: Request,
    response: Response,
    background_tasks: BackgroundTasks,
    job_text: str = Form(..., min_length=50, description="Job posting text"),
    job_url: Optional[str] = Form(None, description="Optional job URL"),
    # We keep request_user_id for backward compatibility but it will be ignored in favor of token if present
    request_user_id: Optional[str] = Form(None, alias="user_id", description="Legacy user ID (ignored if token present)"),
    resume_file: Optional[UploadFile] = File(None, description="Optional resume PDF/DOCX"),
    resume_text: Optional[str] = Form(None, description="Optional resume raw text (for saved resume)"),
    user_skills: Optional[str] = Form(None, description="JSON array of user skills"),
    user_preferences: Optional[str] = Form(None, description="JSON object with job_type and employment_type"),
    user: Optional[str] = Depends(get_optional_current_user),
):
    """
    Analyze a job posting and return the TrueScore.
    
    Resume can be provided in two ways:
    1. resume_file: Upload a PDF/DOCX file (will be parsed)
    2. resume_text: Send raw text directly (for saved resumes)
    """
    # Use authenticated user ID if available, otherwise None (anonymous)
    # We strictly ignore request_user_id for security, unless we want to allow 
    # impersonation in dev? No, strictly use token.
    final_user_id = user
    
    # This variable is deprecated but kept for potential future use or debugging if needed
    # user_skills processing happens later
    
    if len(job_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description is too short. Please provide at least 50 characters."
        )
    
    # Validate that the input is actually a job posting (not lorem ipsum, gibberish, etc.)
    is_valid, validation_reason = validate_job_content(job_text)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=validation_reason
        )
    
    # =========================================================================
    # STEP 1: Extract Resume Text (from file or use provided text)
    # =========================================================================
    
    final_resume_text = None
    
    # Priority: file upload > provided text
    if resume_file and resume_file.filename:
        try:
            content = await resume_file.read()
            parsed = parse_resume(content, resume_file.filename)
            final_resume_text = parsed.get("raw_text")
            # print(f"DEBUG: Parsed resume from file, got {len(final_resume_text) if final_resume_text else 0} chars")
        except Exception:
            # print(f"Warning: Failed to parse resume file: {e}")
            # Fall back to text if parsing fails
            if resume_text:
                final_resume_text = resume_text
    elif resume_text:
        final_resume_text = resume_text
        # print(f"DEBUG: Using provided resume text, {len(resume_text)} chars")
    
    # =========================================================================
    # STEP 2: Company Verification
    # =========================================================================
    
    company_info = None
    # Extract company name
    company_name = extract_company_name(job_text)
    
    if company_name:
        # First try local database (fast)
        result_company = check_company(company_name)
        
        # If unknown, try API verification (OpenCorporates/Wikidata)
        if result_company.status == CompanyStatus.UNKNOWN:
            try:
                from app.services.company_db import get_company_db
                db = get_company_db()
                result_company = await db.check_company_async(company_name, use_api=True)
            except Exception:
                # print(f"⚠️ API company verification failed: {e}")
                pass
                # Keep local result
        
        company_info = CompanyInfo(
            company_name=company_name,
            status=result_company.status.value,
            status_label=get_status_label(result_company.status),
            risk_level=get_risk_level(result_company.status),
            confidence=result_company.confidence,
            matched_name=result_company.matched_name,
            notes=result_company.notes
        )
    
    # =========================================================================
    # STEP 3: Run TrueScore ML Analysis
    # =========================================================================
    
    # Parse user skills and preferences from JSON strings
    parsed_skills: Optional[List[str]] = None
    parsed_prefs: Optional[Dict[str, str]] = None
    
    if user_skills:
        try:
            parsed_skills = json.loads(user_skills)
        except json.JSONDecodeError:
            pass
            # print(f"Warning: Could not parse user_skills JSON: {user_skills}")
    
    if user_preferences:
        try:
            parsed_prefs = json.loads(user_preferences)
        except json.JSONDecodeError:
            pass
            # print(f"Warning: Could not parse user_preferences JSON: {user_preferences}")
    
    result = true_score_aggregator.analyze(
        job_text=job_text,
        resume_text=final_resume_text,
        job_url=job_url,
        user_skills=parsed_skills,
        user_preferences=parsed_prefs,
    )
    
    # =========================================================================
    # STEP 3.5: Save Skills Gap (if applicable)
    # NOTE: We save skill gaps even if user_skills is empty/None.
    # If the user hasn't defined skills, then all required skills are "missing",
    # and we should show them as gaps to learn.
    # =========================================================================
    if final_user_id:
        # Check if we have missing skills to save
        # Skip saving skills for DANGER/High Risk jobs to prevent pollution
        if result.risk_level == "danger":
            pass
            # print(f"DEBUG: Skipping skill gap save for DANGER job (user {final_user_id})")
        elif result.skills_gap and result.skills_gap.missing_skills:
            try:
                save_user_skill_gaps(final_user_id, result.skills_gap.missing_skills)
                # print(f"✅ Saved {len(result.skills_gap.missing_skills)} skill gaps for user {final_user_id}")
            except Exception as e:
                logger.warning("Failed to save skill gaps: %s", e)
        else:
            pass
            # print(f"DEBUG: No missing skills detected for user {final_user_id}")
    
    # =========================================================================
    # STEP 4: Save to History
    # =========================================================================
    
    # print(f"DEBUG: Saving analysis for user {final_user_id}")
    try:
        save_analysis(
            job_text=job_text,
            true_score=result.true_score,
            risk_level=result.risk_level,
            breakdown={
                "authenticity": result.breakdown.authenticity,
                "hiring_activity": result.breakdown.hiring_activity,
                "hiring_likelihood": result.breakdown.hiring_likelihood,
                "resume_match": result.breakdown.resume_match,
                "recency": result.breakdown.recency,
                "company_reputation": result.breakdown.company_reputation,
            },
            job_url=job_url,
            user_id=final_user_id,
        )
    except Exception as e:
        logger.warning("Failed to save analysis to history: %s", e)
    
    # Funnel instrumentation (non-blocking, best-effort).
    background_tasks.add_task(record_event, "check_run")

    # Build response
    return {
        "true_score": result.true_score,
        "risk_level": result.risk_level,
        "breakdown": result.breakdown,
        "insights": result.insights,
        "recommendations": result.recommendations,
        "company": company_info,
        "friction_signals": result.friction_signals,
    }


# =============================================================================
# URL Scraping + Analysis Endpoint
# =============================================================================

@router.post("/analyze-url")
@limiter.limit(ANALYZE_LIMIT)
async def analyze_job_url(
    request: Request,
    response: Response,
    job_url: str = Form(..., description="Job posting URL to scrape and analyze"),
    user: Optional[str] = Depends(get_optional_current_user),
):
    """
    Scrape a job posting URL and analyze it.
    
    This endpoint:
    1. Fetches and parses the job posting page
    2. Extracts job text, title, company, etc.
    3. Runs TrueScore analysis on the extracted content
    4. Returns results with scraped metadata
    """
    # Step 1: Scrape the URL
    scraped = await scrape_job_url(job_url)
    
    # Check for scraping errors
    if scraped.error:
        raise HTTPException(
            status_code=400,
            detail=scraped.error
        )
    
    # Check if we got enough content
    if not scraped.job_text or len(scraped.job_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not extract enough job content from this URL. Please copy and paste the job description text manually."
        )
    
    # NOTE: We intentionally skip validate_job_content() here.
    # That validator is designed to reject gibberish/lorem-ipsum in the
    # manual text-input flow. When applied to scraped pages it
    # false-positives because boilerplate (nav, cookies, footers) dilutes
    # the job-keyword ratio. The scraper's own length check above is
    # sufficient for URL-based analysis.

    # Step 2: Run TrueScore analysis on scraped text
    job_text = scraped.job_text
    
    # Extract company name from scraped data or text
    company_info = None
    company_name = scraped.company or extract_company_name(job_text)
    
    if company_name:
        result_company = check_company(company_name)
        
        # If unknown, try API verification
        if result_company.status == CompanyStatus.UNKNOWN:
            try:
                from app.services.company_db import get_company_db
                db = get_company_db()
                result_company = await db.check_company_async(company_name, use_api=True)
            except Exception as e:
                logger.warning("API company verification failed: %s", e, exc_info=True)
        
        company_info = CompanyInfo(
            company_name=company_name,
            status=result_company.status.value,
            status_label=get_status_label(result_company.status),
            risk_level=get_risk_level(result_company.status),
            confidence=result_company.confidence,
            matched_name=result_company.matched_name,
            notes=result_company.notes
        )
    
    # Step 3: Run ML analysis
    result = true_score_aggregator.analyze(
        job_text=job_text,
        resume_text=None,
        job_url=job_url,
        user_skills=None,
        user_preferences=None,
    )
    
    # Step 3.5: Save Skills Gap (if authenticated user)
    if user:
        if result.risk_level != "danger" and result.skills_gap and result.skills_gap.missing_skills:
            try:
                save_user_skill_gaps(user, result.skills_gap.missing_skills)
            except Exception as e:
                logger.warning("Failed to save skill gaps for URL analysis: %s", e)

    # Step 4: Save to history
    try:
        save_analysis(
            job_text=job_text,
            true_score=result.true_score,
            risk_level=result.risk_level,
            breakdown={
                "authenticity": result.breakdown.authenticity,
                "hiring_activity": result.breakdown.hiring_activity,
                "hiring_likelihood": result.breakdown.hiring_likelihood,
                "resume_match": result.breakdown.resume_match,
                "recency": result.breakdown.recency,
                "company_reputation": result.breakdown.company_reputation,
            },
            job_url=job_url,
            user_id=user,
        )
    except Exception as e:
        logger.warning("Failed to save URL analysis to history: %s", e, exc_info=True)
    
    # Return response with scraped metadata
    return {
        "true_score": result.true_score,
        "risk_level": result.risk_level,
        "breakdown": result.breakdown,
        "insights": result.insights,
        "recommendations": result.recommendations,
        "company": company_info,
        "friction_signals": result.friction_signals,
        "scraped": {
            "title": scraped.title,
            "company": scraped.company,
            "location": scraped.location,
            "salary": scraped.salary,
            "source_domain": scraped.source_domain,
        },
    }
