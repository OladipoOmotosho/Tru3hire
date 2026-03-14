"""
Search Engine Constants

Centralized tuning weights, scoring parameters, and curated vocabulary lists
for the hybrid search pipeline. Adapted from HiringCafe's constants.py pattern.

Sections:
- Scoring weights — embedding/keyword blend, signal boosts, penalties
- Retrieval knobs — rerank window, multi-query caps, confidence thresholds
- NLP vocabularies — stopwords, abbreviations, negation cues, exclusion variants
- Location/domain guard lists — prevent false-positive extraction
"""

from __future__ import annotations


# =============================================================================
# Scoring Weights — control how embedding, keyword, signal, and TrueScore
# are blended into the final ranking score
# =============================================================================

EMBEDDING_WEIGHT = 0.35
"""Weight applied to cosine-similarity between query and job embeddings."""

KEYWORD_WEIGHT = 0.25
"""Weight applied to keyword-coverage ratio."""

TRUESCORE_WEIGHT = 0.40
"""Weight applied to normalised TrueScore (0-1 scale)."""

MAX_SIGNAL_BOOST = 0.30
"""Hard ceiling on total additive signal boost per candidate."""

REMOTE_BOOST = 0.12
"""Boost when user wants remote and listing mentions it."""

SENIORITY_BOOST = 0.10
"""Boost when detected seniority level appears in listing."""

LOCATION_BOOST = 0.08
"""Boost when a parsed location term appears in listing."""

INDUSTRY_BOOST = 0.08
"""Boost for matching industry/domain preference."""

ORG_TYPE_BOOST = 0.05
"""Boost for matching org type (nonprofit, startup, etc.)."""

NEGATION_PENALTY = 0.20
"""Per-term penalty when an excluded keyword still appears."""

MAX_NEGATION_PENALTY = MAX_SIGNAL_BOOST
"""Cap on total negation penalty so the boost cannot go excessively negative."""

FRESHNESS_BOOST = 0.05
"""Boost for jobs posted within the last 3 days."""

FRESHNESS_DAYS_THRESHOLD = 3
"""Jobs posted within this many days get the freshness boost."""


# =============================================================================
# Retrieval Knobs — control candidate pool sizes and multi-query behaviour
# =============================================================================

MAX_MULTI_QUERIES = 3
"""Maximum number of distinct retrieval query rewrites sent to Adzuna."""

RERANK_TOP_N = 30
"""Number of top candidates passed through the lightweight reranker."""

RERANK_BLEND = 0.15
"""Blending factor for the reranker's adjustment into the final score."""

EMBEDDING_CACHE_SIZE = 1024
"""LRU cache slots for deduplicated embedding calls. Increased from 256 to reduce Gemini API calls."""


# =============================================================================
# Confidence Thresholds — detect low-quality result sets for retry logic
# =============================================================================

CONFIDENCE_MIN_TOP_SCORE = 0.30
"""Top-1 score below this triggers the low-confidence retry path."""

CONFIDENCE_MIN_SPREAD = 0.03
"""Spread (top − bottom of window) below this flags low confidence."""

CONFIDENCE_TOP_WINDOW = 5
"""Number of top results inspected when computing confidence metrics."""


# =============================================================================
# Stopwords — removed during tokenisation to focus on meaningful terms
# =============================================================================

STOPWORDS = {
    "a", "an", "the", "for", "with", "and", "or", "to", "of", "in", "on",
    "at", "jobs", "job", "role", "roles", "position", "positions", "looking",
    "want", "find", "show", "me", "some", "please", "need", "something",
    "i", "am", "interested", "is", "are", "be", "was", "my",
    "would", "like", "prefer", "preferably", "work", "working",
    "company", "companies", "team", "based", "focused",
}


# =============================================================================
# Abbreviation Expansions — expand short-hands before embedding
# =============================================================================

ABBREVIATION_EXPANSIONS = {
    "ml": "machine learning",
    "ds": "data science",
    "swe": "software engineer",
    "ai": "artificial intelligence",
    "pm": "product manager",
    "fe": "frontend",
    "be": "backend",
    "fs": "full stack",
    "de": "data engineer",
    "da": "data analyst",
    "devops": "development operations",
    "sre": "site reliability engineer",
    "qa": "quality assurance",
    "ux": "user experience",
    "ui": "user interface",
}


# =============================================================================
# Negation / Exclusion Vocabularies
# =============================================================================

NEGATION_TERMS = {
    "management", "managerial", "people management", "manager", "managers",
    "leadership", "director", "directors", "executive", "executives", "vp",
    "onsite", "on-site", "in-office", "sales", "marketing",
    "contract", "temporary", "intern", "internship",
}
"""Canonical terms that can appear after a negation cue."""

NEGATION_CUES = [
    "not", "no", "without", "exclude", "excluding", "except", "avoid",
    "never", "dont", "do not", "doesnt", "does not", "didnt", "did not",
    "shouldnt", "should not", "cannot", "cant", "will not", "wont",
    "less", "fewer",
]
"""Linguistic cues that precede a negated term."""

NEGATION_NOISE_TOKENS = {
    "include", "including", "exclude", "excluding", "show", "list", "give",
    "want", "need", "prefer", "more", "less",
}
"""Tokens that look like negation targets but are noise."""

EXCLUSION_VARIANTS = {
    "management": ["management", "manager", "managers", "managerial", "people management"],
    "manager": ["manager", "managers", "management", "managerial"],
    "director": ["director", "directors", "director-level"],
    "executive": ["executive", "executives", "exec", "c-suite", "c suite", "vp", "vice president"],
    "vp": ["vp", "vice president", "vice-president"],
    "onsite": ["onsite", "on-site", "in office", "in-office"],
    "sales": ["sales", "selling", "account executive"],
    "marketing": ["marketing", "marketer", "digital marketing"],
    "contract": ["contract", "freelance", "temporary", "temp"],
}
"""Maps an excluded term to all morphological variants for hard filtering."""


# =============================================================================
# Location Guard Lists — prevent false-positive location extraction
# =============================================================================

NON_LOCATION_PHRASES = {
    "data science", "machine learning", "software engineering",
    "product management", "social good", "mission driven",
    "artificial intelligence", "full stack", "computer science",
}
"""Multi-word phrases that should never be parsed as a location."""

NON_LOCATION_TOKENS = {
    "job", "jobs", "role", "roles", "engineering", "management",
    "manager", "science", "developer", "engineer", "analyst",
    "designer", "architect", "specialist", "consultant",
}
"""Single tokens whose presence disqualifies a candidate location phrase."""


# =============================================================================
# Seniority & Org Type Enums
# =============================================================================

SENIORITY_LEVELS = ["intern", "junior", "mid", "senior", "lead", "principal", "executive"]
"""Recognised seniority levels parsed from queries (matches facet_engine SENIORITY_SPECTRUM)."""

ORG_TYPES = ["nonprofit", "non-profit", "ngo", "startup", "government", "public", "enterprise"]
"""Organisation types that trigger an org-type signal boost."""
