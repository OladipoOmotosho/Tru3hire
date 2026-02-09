"""
Job Ranker Service

Explicit, explainable ranking formula.
Not pure semantic - includes rules and signals.

Score Formula:
    score = 0.45 * embedding_similarity  # Semantic match
          + 0.25 * keyword_match         # Exact terms matter
          + 0.15 * seniority_match       # Level alignment
          + 0.15 * trait_match           # Company traits

Returns score + breakdown for debugging.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel

from app.services.query_resolver import ParsedJobQuery
from app.ml.embeddings import get_local_embedding, cosine_similarity


# =============================================================================
# Configuration
# =============================================================================

# Scoring weights (must sum to 1.0)
WEIGHTS = {
    "embedding": 0.45,
    "keyword": 0.25,
    "seniority": 0.15,
    "trait": 0.15,
}


# =============================================================================
# Data Models
# =============================================================================

class ScoreBreakdown(BaseModel):
    """Detailed breakdown of how a job was scored."""
    embedding_score: float = 0.0
    keyword_score: float = 0.0
    seniority_score: float = 0.0
    trait_score: float = 0.0
    exclusion_penalty: float = 0.0
    final_score: float = 0.0


class ScoredJob(BaseModel):
    """A job with its score and breakdown."""
    job: Dict[str, Any]
    score: float
    breakdown: ScoreBreakdown
    excluded: bool = False
    exclusion_reason: Optional[str] = None


# =============================================================================
# Scoring Functions
# =============================================================================

def _calculate_embedding_score(
    job_text: str,
    query_keywords: List[str],
) -> float:
    """
    Calculate semantic similarity between job and query keywords.
    
    Uses local embeddings for consistency.
    """
    if not query_keywords:
        return 0.5  # Neutral score if no keywords
    
    # Create query text from keywords
    query_text = " ".join(query_keywords)
    
    # Get embeddings
    job_emb = get_local_embedding(job_text[:4000])  # Truncate for performance
    query_emb = get_local_embedding(query_text)
    
    if job_emb is None or query_emb is None:
        return 0.5  # Neutral if embeddings fail
    
    # Calculate cosine similarity (returns -1 to 1, normalize to 0-1)
    similarity = cosine_similarity(job_emb, query_emb)
    normalized = (similarity + 1) / 2
    
    return min(1.0, max(0.0, normalized))


def _calculate_keyword_score(
    job_text: str,
    keywords: List[str],
) -> float:
    """
    Calculate exact keyword match score.
    
    Exact matches matter for ATS and specificity.
    """
    if not keywords:
        return 0.5  # Neutral if no keywords
    
    job_lower = job_text.lower()
    matches = 0
    
    for keyword in keywords:
        if keyword.lower() in job_lower:
            matches += 1
    
    # Score as percentage of keywords found
    return matches / len(keywords)


def _calculate_seniority_score(
    job_text: str,
    target_seniority: Optional[str],
) -> float:
    """
    Calculate how well job matches target seniority level.
    """
    if not target_seniority:
        return 0.5  # Neutral if no seniority preference
    
    job_lower = job_text.lower()
    
    # Seniority patterns to look for
    seniority_patterns = {
        "senior": [r"\bsenior\b", r"\bsr\.\b", r"\bsr\s"],
        "lead": [r"\blead\b", r"\bteam lead\b", r"\btech lead\b"],
        "principal": [r"\bprincipal\b", r"\bstaff\b"],
        "junior": [r"\bjunior\b", r"\bjr\.\b", r"\bjr\s"],
        "entry": [r"\bentry\b", r"\bgraduate\b", r"\bnew grad\b"],
        "mid": [r"\bmid-level\b", r"\bmid level\b", r"\b\d+-\d+\s*years?\b"],
        "intern": [r"\bintern\b", r"\binternship\b"],
    }
    
    patterns = seniority_patterns.get(target_seniority, [])
    
    for pattern in patterns:
        if re.search(pattern, job_lower):
            return 1.0  # Full match
    
    # Partial scoring based on no contrary indicators
    contrary_levels = {
        "senior": ["junior", "entry", "intern"],
        "lead": ["junior", "entry", "intern"],
        "junior": ["senior", "lead", "principal"],
        "entry": ["senior", "lead", "principal", "experience required"],
    }
    
    contrary = contrary_levels.get(target_seniority, [])
    for level in contrary:
        if level in job_lower:
            return 0.2  # Contrary indicator found
    
    return 0.5  # No strong signal either way


def _calculate_trait_score(
    job_text: str,
    company_traits: List[str],
) -> float:
    """
    Calculate how well job matches desired company traits.
    """
    if not company_traits:
        return 0.5  # Neutral if no trait preferences
    
    job_lower = job_text.lower()
    matches = 0
    
    trait_patterns = {
        "startup": [r"\bstartup\b", r"\bstart-up\b", r"\bearly stage\b", r"\bseed\b"],
        "fast-growing": [r"\bfast.?growing\b", r"\bhigh.?growth\b", r"\bscaling\b"],
        "enterprise": [r"\benterprise\b", r"\bcorporate\b", r"\bfortune\b"],
        "big-tech": [r"\bgoogle\b", r"\bmeta\b", r"\bamazon\b", r"\bapple\b", r"\bmicrosoft\b"],
        "small-company": [r"\bsmall team\b", r"\bsmall company\b", r"\boutfit\b"],
        "remote-first": [r"\bremote.?first\b", r"\bfully remote\b", r"\b100% remote\b"],
        "well-funded": [r"\bwell.?funded\b", r"\bseries [a-d]\b", r"\bbacked by\b"],
        "funded": [r"\bseries [a-d]\b", r"\bvc.?backed\b", r"\bfunded\b"],
    }
    
    for trait in company_traits:
        patterns = trait_patterns.get(trait, [])
        for pattern in patterns:
            if re.search(pattern, job_lower):
                matches += 1
                break  # Count each trait once
    
    return matches / len(company_traits)


def _check_exclusions(
    job_text: str,
    exclude_terms: List[str],
) -> Tuple[bool, Optional[str]]:
    """
    Check if job matches any exclusion terms.
    
    Returns (is_excluded, reason).
    """
    if not exclude_terms:
        return False, None
    
    job_lower = job_text.lower()
    job_title_match = re.search(r"title:\s*(.+?)(?:\n|$)", job_lower)
    job_title = job_title_match.group(1) if job_title_match else ""
    
    for term in exclude_terms:
        # Check title first (stronger signal)
        if term.lower() in job_title:
            return True, f"Title contains '{term}'"
        
        # Check full text for very specific terms
        if term.lower() in job_lower:
            # Some terms only matter in title
            title_only_terms = ["manager", "management", "director", "head of", "vp"]
            if term.lower() not in title_only_terms:
                return True, f"Description contains '{term}'"
    
    return False, None


# =============================================================================
# Main Scoring Function
# =============================================================================

def score_job(
    job: Dict[str, Any],
    parsed_query: ParsedJobQuery,
) -> ScoredJob:
    """
    Score a job against a parsed query.
    
    Score Formula:
        score = 0.45 * embedding_similarity
              + 0.25 * keyword_match
              + 0.15 * seniority_match
              + 0.15 * trait_match
    
    Args:
        job: Job dict with title, description, company, etc.
        parsed_query: Resolved query from query_resolver
        
    Returns:
        ScoredJob with score and detailed breakdown
    """
    # Build job text for analysis
    job_text = f"""
    Title: {job.get('title', '')}
    Company: {job.get('company', '')}
    Location: {job.get('location', '')}
    Description: {job.get('description', '')}
    """
    
    # Check exclusions first
    excluded, reason = _check_exclusions(job_text, parsed_query.exclude_terms)
    
    if excluded:
        return ScoredJob(
            job=job,
            score=0.0,
            breakdown=ScoreBreakdown(exclusion_penalty=1.0, final_score=0.0),
            excluded=True,
            exclusion_reason=reason,
        )
    
    # Calculate component scores
    embedding_score = _calculate_embedding_score(job_text, parsed_query.keywords)
    keyword_score = _calculate_keyword_score(job_text, parsed_query.keywords)
    seniority_score = _calculate_seniority_score(job_text, parsed_query.seniority)
    trait_score = _calculate_trait_score(job_text, parsed_query.company_traits)
    
    # Calculate weighted final score
    final_score = (
        WEIGHTS["embedding"] * embedding_score +
        WEIGHTS["keyword"] * keyword_score +
        WEIGHTS["seniority"] * seniority_score +
        WEIGHTS["trait"] * trait_score
    )
    
    # Normalize to 0-100 scale
    final_score_100 = round(final_score * 100, 1)
    
    breakdown = ScoreBreakdown(
        embedding_score=round(embedding_score, 3),
        keyword_score=round(keyword_score, 3),
        seniority_score=round(seniority_score, 3),
        trait_score=round(trait_score, 3),
        exclusion_penalty=0.0,
        final_score=final_score_100,
    )
    
    return ScoredJob(
        job=job,
        score=final_score_100,
        breakdown=breakdown,
        excluded=False,
    )


def rank_jobs(
    jobs: List[Dict[str, Any]],
    parsed_query: ParsedJobQuery,
) -> List[ScoredJob]:
    """
    Score and rank a list of jobs.
    
    Excluded jobs are filtered out and remaining jobs are sorted by score.
    
    Args:
        jobs: List of job dicts
        parsed_query: Resolved query from query_resolver
        
    Returns:
        List of ScoredJob, sorted by score descending, excludes filtered
    """
    scored_jobs = [score_job(job, parsed_query) for job in jobs]
    
    # Filter out excluded jobs
    included_jobs = [sj for sj in scored_jobs if not sj.excluded]
    
    # Sort by score descending
    included_jobs.sort(key=lambda x: x.score, reverse=True)
    
    return included_jobs
