"""
Resume-Job Matching Service using Hybrid Approach

This module provides smart resume-job matching using:
1. Skill extraction + weighted matching (65% weight)
2. Semantic embeddings (35% weight)
3. Experience level comparison (built into skill score)

TF-IDF has been removed in favor of semantic embeddings.
"""

import logging
import re
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)


# =============================================================================
# Text Preprocessing
# =============================================================================

def preprocess_text(text: str) -> str:
    """
    Clean and preprocess text for TF-IDF.
    """
    # Lowercase
    text = text.lower()
    
    # Remove special characters but keep spaces
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


# =============================================================================
# TF-IDF Resume Matcher
# =============================================================================

def calculate_resume_match(
    job_text: str, 
    resume_text: Optional[str],
    user_skills: Optional[List[str]] = None,
    user_experience_years: Optional[int] = None
) -> Dict:
    """
    Calculate resume-job match using hybrid approach.
    
    ENHANCED with:
    - Skill extraction + weighted matching (65%)
    - Semantic embeddings (35%)
    - Experience level comparison (built into skill score)
    - TF-IDF removed in favor of semantic embeddings
    
    Args:
        job_text: The job description text
        resume_text: The resume/CV text (optional)
        user_skills: List of user's known skills (optional)
        user_experience_years: Years of experience from profile (optional)
        
    Returns:
        dict with score, similarity, matched_terms, skill_details, method
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return {
            "score": 50,
            "similarity": 0.0,
            "matched_terms": [],
            "method": "none",
            "message": "No resume provided - upload for personalized matching",
            "skill_match": None,
            "experience_match": None
        }
    
    # Preprocess both texts
    job_clean = preprocess_text(job_text)
    resume_clean = preprocess_text(resume_text)
    
    # ==========================================================================
    # 1. SKILL MATCHING (65% weight)
    # ==========================================================================
    skill_score = 60  # Default neutral
    skill_result = None
    experience_info = None
    
    try:
        from app.ml.skill_matcher import calculate_skill_match, get_skill_display_name
        skill_result = calculate_skill_match(
            job_text=job_text,
            resume_text=resume_text,
            user_skills=user_skills,
            user_experience_years=user_experience_years
        )
        skill_score = skill_result.score
        experience_info = {
            "years_required": skill_result.experience_match.years_required,
            "years_candidate": skill_result.experience_match.years_candidate,
            "level_job": skill_result.experience_match.level_job,
            "level_candidate": skill_result.experience_match.level_candidate,
            "match_score": skill_result.experience_match.match_score
        }
        }
    except Exception:
        logger.exception("Skill matching failed")
    
    # ==========================================================================
    # 2. EMBEDDING SIMILARITY (35% weight)
    # ==========================================================================
    embedding_score, embedding_source = _calculate_embedding_score(job_text, resume_text)
    if embedding_score is None:
        embedding_score = 60  # Neutral fallback
        embedding_source = "none"
    
    # ==========================================================================
    # 3. COMBINE SCORES (TF-IDF removed - embeddings handle semantic matching)
    # ==========================================================================
    # Weighted combination: 65% skill match, 35% embedding
    base_score = int(
        (skill_score * 0.65) +
        (embedding_score * 0.35)
    )
    
    # ==========================================================================
    # 4. APPLY BONUSES
    # ==========================================================================
    bonus = 0
    bonus_reasons = []
    
    if skill_result:
        # Bonus for matching ALL required skills
        breakdown = skill_result.detailed_breakdown
        if breakdown.get("required_total", 0) > 0:
            if breakdown.get("required_matched") == breakdown.get("required_total"):
                bonus += 5
                bonus_reasons.append("100% required skills")
        
        # Bonus for having many additional skills
        if breakdown.get("bonus_skills_count", 0) >= 10:
            bonus += 3
            bonus_reasons.append("10+ bonus skills")
        elif breakdown.get("bonus_skills_count", 0) >= 5:
            bonus += 2
            bonus_reasons.append("5+ bonus skills")
    
    final_score = base_score + bonus
    
    # Ensure bounds
    final_score = max(0, min(100, final_score))
    
    # Determine method string
    method = f"skill_embed_{embedding_source}"
    
    # Get matching terms for display (still useful for UI)
    matched_terms = _get_matching_terms(job_clean, resume_clean)
    
    # Build skill match details if available
    skill_match_details = None
    if skill_result:
        # get_skill_display_name already imported
        skill_match_details = {
            "matched": [get_skill_display_name(s) for s in skill_result.matched_skills],
            "missing_required": [get_skill_display_name(s) for s in skill_result.missing_required],
            "missing_preferred": [get_skill_display_name(s) for s in skill_result.missing_preferred],
            "bonus_skills": [get_skill_display_name(s) for s in skill_result.bonus_skills],
            "breakdown": skill_result.detailed_breakdown
        }
    
    return {
        "score": final_score,
        "base_score": base_score,
        "bonus": bonus,
        "bonus_reasons": bonus_reasons,
        "matched_terms": matched_terms[:10],
        "method": method,
        "embedding_score": embedding_score,
        "embedding_source": embedding_source,
        "skill_score": skill_score,
        "skill_match": skill_match_details,
        "experience_match": experience_info,
    }


def _calculate_embedding_score(job_text: str, resume_text: str) -> tuple:
    """
    Calculate semantic embedding score.
    Returns (score, source) where source is 'gemini', 'local', or None if unavailable.
    """
    try:
        # Use cached version for better performance in batch searches
        from app.ml.embeddings import calculate_similarity_with_cached_resume
        similarity, source = calculate_similarity_with_cached_resume(job_text, resume_text)
        
        if source == "none":
            return None, None
        
        # Convert similarity (0-1) to score (0-100)
        # Embedding similarities tend to be higher, so we use a different scale
        # 0.3 similarity = 45 (poor match)
        # 0.6 similarity = 70 (good match)
        # 0.9 similarity = 95 (excellent match)
        score = int(30 + (similarity * 70))
        return max(0, min(100, score)), source
    except Exception:
        logger.exception("Embedding calculation failed")
        return None, None


def _get_matching_terms(job_text: str, resume_text: str) -> list:
    """Find the most important matching terms."""
    job_words = set(job_text.split())
    resume_words = set(resume_text.split())
    
    # Common meaningful words (exclude very short words)
    matching = [w for w in (job_words & resume_words) if len(w) > 3]
    
    # Sort by length (longer = more specific = more valuable)
    matching.sort(key=len, reverse=True)
    
    return matching




