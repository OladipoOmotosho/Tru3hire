"""
Search Pipeline Schemas

Pydantic models for the enhanced hybrid search pipeline.
Adapted from HiringCafe's schema.py, extended with TrueScore dimensions.
"""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# =============================================================================
# Search Signals — structured query intent
# =============================================================================

class SearchSignals(BaseModel):
    """Structured signals extracted from a natural-language search query.

    Consumed by the retrieval, ranking, and suggestion layers.
    """
    keywords: List[str] = Field(default_factory=list)
    excluded_keywords: List[str] = Field(default_factory=list)
    remote: bool = False
    seniority: Optional[str] = None
    org_types: List[str] = Field(default_factory=list)
    location_terms: List[str] = Field(default_factory=list)
    industry_prefs: List[str] = Field(default_factory=list)
    job_type: Optional[str] = None
    company_traits: List[str] = Field(default_factory=list)
    role_title: Optional[str] = None


# =============================================================================
# Multi-turn Search Context
# =============================================================================

class SearchContext(BaseModel):
    """Accumulated search context for multi-turn refinement.

    The frontend sends this back with each refinement request so the
    backend can merge signals from previous turns.
    """
    query: str = ""
    signals: SearchSignals = Field(default_factory=SearchSignals)
    refinements: List[str] = Field(default_factory=list)
    history: List[str] = Field(default_factory=list)


# =============================================================================
# Score Breakdowns
# =============================================================================

class RelevanceBreakdown(BaseModel):
    """How the relevance portion of the final score was computed.

    Each field is in [0.0, 1.0] before weighting.
    """
    embedding_score: float = 0.0
    keyword_score: float = 0.0
    signal_boost: float = 0.0
    rerank_adjustment: float = 0.0
    relevance_score: float = 0.0


class TrueScoreBreakdown(BaseModel):
    """The existing TrueScore dimensions (unchanged)."""
    authenticity: int = 70
    hiring_activity: int = 60
    resume_match: int = 50
    company_reputation: int = 70
    recency: int = 75
    eligibility_score: Optional[int] = None


class CombinedScoreBreakdown(BaseModel):
    """Full score breakdown combining relevance and TrueScore."""
    relevance: RelevanceBreakdown = Field(default_factory=RelevanceBreakdown)
    truescore: TrueScoreBreakdown = Field(default_factory=TrueScoreBreakdown)
    truescore_value: int = 70
    final_score: float = 0.0


# =============================================================================
# Ranked Job Result
# =============================================================================

class RankedJobResult(BaseModel):
    """A job result with full scoring metadata."""
    # Core job fields (from Adzuna)
    id: Any = ""
    title: str = ""
    company: str = ""
    location: str = ""
    description: str = ""
    redirect_url: str = ""
    salary_display: str = ""
    contract_type: str = ""
    category: str = ""
    created: str = ""
    days_ago: int = 0

    # Scoring
    final_score: float = 0.0
    true_score: int = 70
    risk_level: str = "caution"
    breakdown: CombinedScoreBreakdown = Field(default_factory=CombinedScoreBreakdown)

    # Matched signals for UI display
    matched_signals: List[str] = Field(default_factory=list)

    # Eligibility
    eligibility_score: Optional[int] = None
    eligibility_badges: List[str] = Field(default_factory=list)


# =============================================================================
# Refinement Suggestion
# =============================================================================

class RefinementSuggestion(BaseModel):
    """A follow-up refinement prompt the UI can display as a chip."""
    text: str
    reason: str
    dimension: str = ""  # e.g. "seniority", "location", "remote"


# =============================================================================
# Confidence Metrics
# =============================================================================

class ConfidenceMetrics(BaseModel):
    """Quality metrics for the result set."""
    is_low_confidence: bool = False
    top_score: float = 0.0
    window_mean: float = 0.0
    spread: float = 0.0
    retry_used: bool = False


# =============================================================================
# Enhanced Search Response
# =============================================================================

class EnhancedSearchResponse(BaseModel):
    """Full response from the enhanced search pipeline."""
    query: str
    jobs: List[Dict[str, Any]] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    parsed_query: Dict[str, Any] = Field(default_factory=dict)
    suggestions: List[Dict[str, Any]] = Field(default_factory=list)
    facet_suggestions: List[Dict[str, Any]] = Field(default_factory=list)
    excluded_count: int = 0
    confidence: ConfidenceMetrics = Field(default_factory=ConfidenceMetrics)
    context: Optional[SearchContext] = None
    debug: Optional[Dict[str, Any]] = None
