"""
Hybrid Ranker

Scoring, ranking, reranking, and confidence assessment for the search pipeline.
Adapted from HiringCafe's ranking.py with TrueScore integration.

Score formula:
    relevance = EMBEDDING_WEIGHT * embedding_sim
              + KEYWORD_WEIGHT * keyword_coverage
              + signal_boost

    final = (1 - TRUESCORE_WEIGHT) * relevance + TRUESCORE_WEIGHT * (truescore / 100)
"""

from __future__ import annotations

import re
import logging
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional, Tuple

from app.services.search_constants import (
    CONFIDENCE_MIN_SPREAD,
    CONFIDENCE_MIN_TOP_SCORE,
    CONFIDENCE_TOP_WINDOW,
    EMBEDDING_WEIGHT,
    EXCLUSION_VARIANTS,
    FRESHNESS_BOOST,
    FRESHNESS_DAYS_THRESHOLD,
    INDUSTRY_BOOST,
    KEYWORD_WEIGHT,
    LOCATION_BOOST,
    MAX_SIGNAL_BOOST,
    NEGATION_PENALTY,
    ORG_TYPE_BOOST,
    REMOTE_BOOST,
    RERANK_BLEND,
    RERANK_TOP_N,
    SENIORITY_BOOST,
    STOPWORDS,
    TRUESCORE_WEIGHT,
)
from app.services.search_schemas import (
    CombinedScoreBreakdown,
    ConfidenceMetrics,
    RelevanceBreakdown,
    RefinementSuggestion,
    SearchSignals,
    TrueScoreBreakdown,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Tokenisation helper
# =============================================================================

def tokenize(text: str) -> List[str]:
    """Split text into lowercase tokens, dropping stopwords."""
    return [t for t in re.findall(r"[a-zA-Z0-9]+", text.lower()) if t not in STOPWORDS]


# =============================================================================
# Keyword Scoring
# =============================================================================

def keyword_score(text: str, keywords: Iterable[str]) -> float:
    """Compute the fraction of *keywords* that appear in *text*.

    Args:
        text: Candidate job text (title + description).
        keywords: Tokens extracted from the user query.

    Returns:
        Float in [0.0, 1.0] representing keyword coverage.
    """
    keywords_list = list(keywords)
    if not keywords_list:
        return 0.0
    text_lower = text.lower()
    hits = sum(1 for k in keywords_list if k in text_lower)
    return hits / max(len(keywords_list), 1)


# =============================================================================
# Signal Boost
# =============================================================================

def signal_boost(job: Dict[str, Any], signals: SearchSignals) -> Tuple[float, List[str]]:
    """Compute additive boosts and identify which signals matched.

    Checks remote, seniority, location, industry, org-type, freshness,
    and negation penalties.

    Args:
        job: Job dict with title, company, location, description, days_ago.
        signals: Parsed search signals from the query.

    Returns:
        (net_boost, matched_labels) where net_boost is capped at MAX_SIGNAL_BOOST
        minus any negation penalties.
    """
    boost = 0.0
    matched: List[str] = []
    haystack = (
        f"{job.get('title', '')} {job.get('company', '')} "
        f"{job.get('location', '')} {job.get('description', '')}"
    ).lower()

    # Remote match
    if signals.remote and "remote" in haystack:
        boost += REMOTE_BOOST
        matched.append("remote")

    # Seniority match
    if signals.seniority and signals.seniority.lower() in haystack:
        boost += SENIORITY_BOOST
        matched.append(signals.seniority)

    # Location match
    for loc in signals.location_terms:
        if loc.lower() in haystack:
            boost += LOCATION_BOOST
            matched.append(f"📍 {loc}")

    # Industry match
    for ind in signals.industry_prefs:
        if ind.lower() in haystack:
            boost += INDUSTRY_BOOST
            matched.append(f"🏢 {ind}")

    # Org type match
    for org in signals.org_types:
        if org.lower() in haystack:
            boost += ORG_TYPE_BOOST
            matched.append(org)

    # Freshness boost
    days_ago = job.get("days_ago", 999)
    if isinstance(days_ago, (int, float)) and days_ago <= FRESHNESS_DAYS_THRESHOLD:
        boost += FRESHNESS_BOOST
        matched.append("🆕 fresh")

    # Negation penalties
    negation_penalty = 0.0
    for excluded in signals.excluded_keywords:
        if re.search(rf"\b{re.escape(excluded)}\b", haystack, re.IGNORECASE):
            negation_penalty += NEGATION_PENALTY
            matched.append(f"⚠️ exclude:{excluded}")

    return min(boost, MAX_SIGNAL_BOOST) - negation_penalty, matched


# =============================================================================
# Hard Exclusion Filtering
# =============================================================================

def _expand_exclusions(excluded_keywords: List[str]) -> List[str]:
    """Expand excluded keywords into all morphological variants."""
    expanded: List[str] = []
    for term in excluded_keywords:
        expanded.extend(EXCLUSION_VARIANTS.get(term.lower(), [term.lower()]))
    return list(dict.fromkeys(expanded))


def violates_hard_exclusions(job: Dict[str, Any], excluded_keywords: List[str]) -> bool:
    """Return True when any excluded variant appears in job text.

    Uses word-boundary regex to avoid partial matches.
    """
    if not excluded_keywords:
        return False
    haystack = (
        f"{job.get('title', '')} {job.get('company', '')} "
        f"{job.get('location', '')} {job.get('description', '')}"
    ).lower()
    for term in _expand_exclusions(excluded_keywords):
        if re.search(rf"\b{re.escape(term)}\b", haystack):
            return True
    return False


def apply_hard_exclusions(
    jobs: List[Dict[str, Any]], signals: SearchSignals
) -> Tuple[List[Dict[str, Any]], int]:
    """Filter out jobs that violate excluded terms.

    Returns:
        (filtered_jobs, excluded_count)
    """
    if not signals.excluded_keywords:
        return jobs, 0
    kept = []
    excluded = 0
    for job in jobs:
        if violates_hard_exclusions(job, signals.excluded_keywords):
            excluded += 1
        else:
            kept.append(job)
    return kept, excluded


# =============================================================================
# Rank Candidates — hybrid blend
# =============================================================================

def rank_jobs(
    jobs: List[Dict[str, Any]],
    signals: SearchSignals,
    embedding_scores: Optional[Dict[Any, float]] = None,
    truescore_map: Optional[Dict[Any, int]] = None,
) -> List[Dict[str, Any]]:
    """Score and rank jobs using the hybrid formula.

    final = (1 - TRUESCORE_WEIGHT) * relevance + TRUESCORE_WEIGHT * (truescore / 100)

    where relevance = EMBEDDING_WEIGHT * embed + KEYWORD_WEIGHT * kw + signal_boost

    Args:
        jobs: Raw job dicts from Adzuna / search.
        signals: Parsed search signals.
        embedding_scores: {job_id: cosine_similarity} from embedding service.
        truescore_map: {job_id: truescore (0-100)} from TrueScore analysis.

    Returns:
        Jobs list sorted by final_score descending, with scoring metadata attached.
    """
    if embedding_scores is None:
        embedding_scores = {}
    if truescore_map is None:
        truescore_map = {}

    ranked: List[Dict[str, Any]] = []

    for job in jobs:
        job_id = job.get("id", "")
        text = f"{job.get('title', '')} {job.get('description', '')}"

        # Component scores
        embed_score = embedding_scores.get(job_id, 0.0)
        kw_score = keyword_score(text, signals.keywords)
        boost, matched = signal_boost(job, signals)

        # Relevance score (embedding + keyword + signal)
        relevance_weight = 1.0 - TRUESCORE_WEIGHT
        relevance = EMBEDDING_WEIGHT * embed_score + KEYWORD_WEIGHT * kw_score + boost

        # TrueScore component (normalise to 0-1)
        truescore_raw = truescore_map.get(job_id, job.get("true_score", 70))
        truescore_norm = truescore_raw / 100.0

        # Final blended score
        final = relevance_weight * relevance + TRUESCORE_WEIGHT * truescore_norm
        final = round(final, 4)

        # Build breakdown
        breakdown = CombinedScoreBreakdown(
            relevance=RelevanceBreakdown(
                embedding_score=round(embed_score, 4),
                keyword_score=round(kw_score, 4),
                signal_boost=round(boost, 4),
                rerank_adjustment=0.0,
                relevance_score=round(relevance, 4),
            ),
            truescore=TrueScoreBreakdown(
                authenticity=job.get("breakdown", {}).get("authenticity", 70),
                hiring_activity=job.get("breakdown", {}).get("hiring_activity", 60),
                resume_match=job.get("breakdown", {}).get("resume_match", 50),
                company_reputation=job.get("breakdown", {}).get("company_reputation", 70),
                recency=job.get("breakdown", {}).get("recency", 75),
                eligibility_score=job.get("eligibility_score"),
            ),
            truescore_value=truescore_raw,
            final_score=final,
        )

        ranked.append({
            **job,
            "final_score": final,
            "matched_signals": matched,
            "score_breakdown": breakdown.model_dump(),
        })

    ranked.sort(key=lambda r: r["final_score"], reverse=True)
    return ranked


# =============================================================================
# Lightweight Reranker
# =============================================================================

def _query_bigrams(query: str) -> List[str]:
    """Return bigrams from the query for phrase-level matching."""
    terms = tokenize(query)
    return [f"{terms[i]} {terms[i + 1]}" for i in range(len(terms) - 1)]


def rerank_results(
    jobs: List[Dict[str, Any]], query: str, top_n: int = RERANK_TOP_N
) -> List[Dict[str, Any]]:
    """Apply a phrase/title-aware reranker to the top-N candidates.

    Computes bigram overlap, title keyword coverage, and a small bonus for
    the number of matched signals, then blends into the existing score.

    Args:
        jobs: Pre-ranked job list.
        query: Original user query.
        top_n: How many top results to rerank.

    Returns:
        Re-sorted list with updated scores and rerank_adjustment in breakdown.
    """
    if not jobs:
        return jobs

    limit = min(top_n, len(jobs))
    query_terms = tokenize(query)[:8]
    bigrams = _query_bigrams(query)

    reranked: List[Dict[str, Any]] = []
    for job in jobs[:limit]:
        haystack = (
            f"{job.get('title', '')} {job.get('company', '')} "
            f"{job.get('location', '')} {job.get('description', '')}"
        ).lower()
        title_lower = job.get("title", "").lower()

        # Bigram hits
        bigram_hits = sum(1 for phrase in bigrams if phrase in haystack)
        bigram_score = bigram_hits / max(len(bigrams), 1) if bigrams else 0.0

        # Title coverage
        title_coverage = keyword_score(title_lower, query_terms)

        # Signal count bonus
        signal_count = len(job.get("matched_signals", []))
        signal_bonus = min(signal_count * 0.01, 0.04)

        # Rerank signal
        rerank_signal = 0.6 * bigram_score + 0.3 * title_coverage + signal_bonus
        rerank_adjustment = round(RERANK_BLEND * rerank_signal, 4)

        # Update score
        new_score = round(job.get("final_score", 0.0) + rerank_adjustment, 4)
        job["final_score"] = new_score

        # Update breakdown if present
        bd = job.get("score_breakdown")
        if bd and isinstance(bd, dict):
            rel = bd.get("relevance", {})
            rel["rerank_adjustment"] = rerank_adjustment
            bd["final_score"] = new_score

        reranked.append(job)

    reranked.extend(jobs[limit:])
    reranked.sort(key=lambda r: r.get("final_score", 0.0), reverse=True)
    return reranked


# =============================================================================
# Confidence Assessment
# =============================================================================

def assess_confidence(
    jobs: List[Dict[str, Any]],
) -> ConfidenceMetrics:
    """Determine whether a result set looks trustworthy.

    Flags low confidence when the top score is below a threshold or
    the score spread across the top window is too narrow.

    Args:
        jobs: Ranked job list (descending score).

    Returns:
        ConfidenceMetrics with quality indicators.
    """
    if not jobs:
        return ConfidenceMetrics(
            is_low_confidence=True,
            top_score=0.0,
            window_mean=0.0,
            spread=0.0,
        )

    window = min(CONFIDENCE_TOP_WINDOW, len(jobs))
    top_score = float(jobs[0].get("final_score", 0.0))
    window_scores = [float(j.get("final_score", 0.0)) for j in jobs[:window]]
    window_mean = float(mean(window_scores))
    spread = float(jobs[0].get("final_score", 0.0) - jobs[window - 1].get("final_score", 0.0))

    is_low = top_score < CONFIDENCE_MIN_TOP_SCORE or spread < CONFIDENCE_MIN_SPREAD

    return ConfidenceMetrics(
        is_low_confidence=is_low,
        top_score=round(top_score, 4),
        window_mean=round(window_mean, 4),
        spread=round(spread, 4),
    )


# =============================================================================
# Refinement Suggestions
# =============================================================================

def suggest_refinements(signals: SearchSignals) -> List[RefinementSuggestion]:
    """Produce next-step refinement prompts based on missing signal slots.

    Analyzes which signals are absent and suggests follow-up queries
    the UI can display as clickable chips.

    Args:
        signals: Current search signals.

    Returns:
        Up to 4 suggestion objects.
    """
    suggestions: List[RefinementSuggestion] = []

    if not signals.remote:
        suggestions.append(RefinementSuggestion(
            text="make it remote",
            reason="Add remote work preference",
            dimension="remote",
        ))

    if not signals.seniority:
        suggestions.append(RefinementSuggestion(
            text="senior roles only",
            reason="Specify seniority level",
            dimension="seniority",
        ))

    if not signals.location_terms:
        suggestions.append(RefinementSuggestion(
            text="in Toronto",
            reason="Filter by location",
            dimension="location",
        ))

    if not signals.industry_prefs:
        suggestions.append(RefinementSuggestion(
            text="in fintech",
            reason="Filter by industry",
            dimension="industry",
        ))

    return suggestions[:4]
