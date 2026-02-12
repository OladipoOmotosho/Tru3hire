"""
Query Resolver Service

Deterministic rule engine that resolves signals into structured query.
All business logic lives here - testable, debuggable.
"""

import json
import os
import logging
import re
from typing import List, Optional, Set, Dict

from pydantic import BaseModel, Field

from app.data.world_locations import find_location
from app.data.taxonomies.canada_industry import match_industry_signal, INDUSTRY_ALIASES
from app.services.facet_engine import FacetPosition, resolve_facet_position

logger = logging.getLogger(__name__)


# =============================================================================
# Data Models
# =============================================================================

class ParsedJobQuery(BaseModel):
    """Structured job query resolved from signals."""
    keywords: List[str] = Field(default_factory=list)  # Core role keywords for Adzuna search
    seniority: Optional[str] = None
    exclude_terms: List[str] = Field(default_factory=list)
    job_type: Optional[str] = None
    company_traits: List[str] = Field(default_factory=list)
    industry_preferences: List[str] = Field(default_factory=list)  # For ranking, not searching
    role_title: Optional[str] = None  # Detected compound role title
    location_preference: Optional[str] = None  # Province
    city_preference: Optional[str] = None  # City
    original_query: str = ""
    signals: List[str] = Field(default_factory=list)  # Raw signals for debugging
    facets: Dict[str, FacetPosition] = Field(default_factory=dict)  # FacetPosition per dimension


# =============================================================================
# Signal Resolution Rules
# =============================================================================

# Seniority level mappings
SENIORITY_SIGNALS = {
    "senior": "senior",
    "sr": "senior",
    "lead": "lead",
    "principal": "principal",
    "staff": "senior",
    "junior": "junior",
    "jr": "junior",
    "entry level": "junior",
    "entry": "junior",
    "mid level": "mid",
    "mid": "mid",
    "intern": "intern",
    "internship": "intern",
}

_SENIORITY_KEYS_SORTED = sorted(SENIORITY_SIGNALS.keys(), key=len, reverse=True)


def _signal_has_term(signal_lower: str, term: str) -> bool:
    """Word-boundary-ish match to avoid "sr" matching inside "sre" etc."""
    return re.search(rf"(^|\\s){re.escape(term)}(\\s|$)", signal_lower) is not None

# Conflicting seniority pairs
CONFLICTING_SENIORITY = [
    {"senior", "junior"},
    {"senior", "entry"},
    {"senior", "intern"},
    {"lead", "entry"},
    {"lead", "junior"},
    {"principal", "junior"},
    {"principal", "entry"},
]

# Job type mappings
JOB_TYPE_SIGNALS = {
    "remote": "remote",
    "remote friendly": "remote",
    "wfh": "remote",
    "work from home": "remote",
    "hybrid": "hybrid",
    "on-site": "onsite",
    "onsite": "onsite",
    "in office": "onsite",
    "full time": "fulltime",
    "fulltime": "fulltime",
    "part time": "parttime",
    "parttime": "parttime",
    "contract": "contract",
    "freelance": "contract",
    "temporary": "contract",
}

# Company trait mappings
COMPANY_TRAIT_SIGNALS = {
    "startup": "startup",
    "start-up": "startup",
    "early stage": "startup",
    "fast growing": "fast-growing",
    "fast-growing": "fast-growing",
    "high growth": "fast-growing",
    "enterprise": "enterprise",
    "large company": "enterprise",
    "big tech": "big-tech",
    "faang": "big-tech",
    "small company": "small-company",
    "small team": "small-company",
    "remote first": "remote-first",
    "remote-first": "remote-first",
    "well funded": "well-funded",
    "series a": "funded",
    "series b": "funded",
    "series c": "funded",
}

# Industry/domain signals — now powered by industry_taxonomy.py
# Keep this dict for backward compatibility but it's auto-populated
INDUSTRY_SIGNALS = {alias: alias for alias in INDUSTRY_ALIASES.keys()}

# =============================================================================
# Role Titles — loaded from data/role_titles.json
# =============================================================================

def _load_role_titles() -> dict:
    """
    Load role titles from the JSON dataset and build a flat lookup.
    
    Returns a dict mapping every known variation, abbreviation, and
    canonical name to the canonical search-friendly title.
    e.g. {'sre': 'site reliability engineer', 'swe': 'software engineer', ...}
    """
    data_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),  # app/
        "data", "role_titles.json"
    )
    
    lookup = {}
    
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        for role_key, role_info in data.get("roles", {}).items():
            canonical = role_info["canonical"].lower()
            
            # Map canonical name to itself
            lookup[canonical] = canonical
            
            # Map all abbreviations
            for abbr in role_info.get("abbreviations", []):
                abbr_lower = abbr.lower()
                if abbr_lower not in lookup:  # Don't overwrite existing
                    lookup[abbr_lower] = canonical
            
            # Map all variations
            for var in role_info.get("variations", []):
                var_lower = var.lower()
                if var_lower not in lookup:
                    lookup[var_lower] = canonical
        
        logger.info(f"Loaded {len(lookup)} role title mappings from {data_path}")
    except FileNotFoundError:
        logger.warning(f"Role titles file not found: {data_path}. Using empty lookup.")
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Error loading role titles: {e}. Using empty lookup.")
    
    return lookup


# Built once at import time — fast dict lookup for all queries
ROLE_TITLES = _load_role_titles()

# Exclusion expansion rules
# When user says "not X", expand to related terms
EXCLUSION_EXPANSIONS = {
    "management": ["manager", "management", "head of", "director", "vp ", "vice president"],
    "manager": ["manager", "management", "head of", "director"],
    "lead": ["lead", "team lead", "tech lead"],
    "senior": ["senior", "sr.", "sr "],
    "junior": ["junior", "jr.", "jr ", "entry"],
    "remote": ["remote", "wfh", "work from home"],
    "contract": ["contract", "freelance", "temporary", "temp"],
}


# =============================================================================
# Resolution Functions
# =============================================================================

def _detect_seniority_conflict(signals: List[str]) -> bool:
    """Check if signals contain conflicting seniority levels."""
    detected = set()
    
    for signal in signals:
        signal_lower = signal.lower().strip()
        for key in _SENIORITY_KEYS_SORTED:
            if _signal_has_term(signal_lower, key):
                detected.add(SENIORITY_SIGNALS[key])
    
    # Check all conflicting pairs
    for conflict_pair in CONFLICTING_SENIORITY:
        if len(detected & conflict_pair) >= 2:
            return True
    
    return False


def _extract_seniority(signals: List[str]) -> Optional[str]:
    """Extract seniority level from signals."""
    # Check for conflicts first
    if _detect_seniority_conflict(signals):
        return None  # Conflict detected, drop constraint
    
    for signal in signals:
        signal_lower = signal.lower().strip()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        for key in _SENIORITY_KEYS_SORTED:
            if _signal_has_term(signal_lower, key):
                return SENIORITY_SIGNALS[key]
    
    return None


def _extract_job_type(signals: List[str]) -> Optional[str]:
    """Extract job type from signals."""
    for signal in signals:
        signal_lower = signal.lower()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        for key, value in JOB_TYPE_SIGNALS.items():
            if key in signal_lower:
                return value
    
    return None


def _extract_company_traits(signals: List[str]) -> List[str]:
    """Extract company traits from signals."""
    traits = []
    added = set()
    
    for signal in signals:
        signal_lower = signal.lower()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        for key, value in COMPANY_TRAIT_SIGNALS.items():
            if key in signal_lower and value not in added:
                traits.append(value)
                added.add(value)
    
    return traits


def _extract_exclusions(signals: List[str]) -> List[str]:
    """Extract and expand exclusion terms from signals."""
    exclusions = []
    added = set()
    
    for signal in signals:
        signal_lower = signal.lower()
        
        # Look for "not X" patterns
        if signal_lower.startswith("not "):
            term = signal_lower[4:].strip()
            
            # Check for expansions
            if term in EXCLUSION_EXPANSIONS:
                for expanded in EXCLUSION_EXPANSIONS[term]:
                    if expanded not in added:
                        exclusions.append(expanded)
                        added.add(expanded)
            elif term not in added:
                exclusions.append(term)
                added.add(term)
        
        # Also check for "no X" patterns
        elif signal_lower.startswith("no "):
            term = signal_lower[3:].strip()
            if term not in added:
                exclusions.append(term)
                added.add(term)
    
    return exclusions


def _extract_industry(signals: List[str]) -> List[str]:
    """Extract industry/domain preferences from signals using industry taxonomy."""
    industries = []
    added = set()
    
    for signal in signals:
        signal_lower = signal.lower()
        
        if signal_lower.startswith("not "):
            continue
        
        result = match_industry_signal(signal_lower)
        if result:
            sector, sub_industry = result
            # Add sub-industry (more specific) if available, otherwise sector
            value = sub_industry if sub_industry else sector
            if value.lower() not in added:
                industries.append(value.lower())
                added.add(value.lower())
    
    return industries


def _extract_role_title(signals: List[str]) -> Optional[str]:
    """Detect a compound role title from signals."""
    for signal in signals:
        signal_lower = signal.lower()
        if signal_lower in ROLE_TITLES:
            return ROLE_TITLES[signal_lower]
    return None


def _extract_keywords(signals: List[str], used_signals: Set[str]) -> List[str]:
    """
    Extract keywords from signals that weren't used for other purposes.
    
    These become the core search terms sent to Adzuna.
    Only role-relevant terms should remain here.
    """
    keywords = []
    
    # Common words to skip
    skip_words = {
        "job", "jobs", "role", "roles", "position", "positions",
        "looking", "want", "need", "find", "search",
        "good", "great", "best", "top", "nice",
        "high", "low", "competitive",
        # Words that are parts of compound phrases
        "friendly", "based", "level", "time", "first",
        # Preference/context words (not search terms)
        "preferably", "ideally", "prefer", "company",
        "projects", "project", "growth",
    }
    
    for signal in signals:
        signal_lower = signal.lower()
        
        # Skip if already used for another purpose
        if signal_lower in used_signals:
            continue
        
        # Skip negation signals
        if signal_lower.startswith("not ") or signal_lower.startswith("no "):
            continue
        
        # Skip common words
        if signal_lower in skip_words:
            continue
        
        # Skip salary-related signals
        if "salary" in signal_lower or "$" in signal_lower:
            continue
        
        # This is a keyword
        keywords.append(signal_lower)
    
    return keywords


def _extract_location(signals: List[str]) -> tuple[Optional[str], Optional[str]]:
    """
    Extract location preference from signals using world_locations hierarchy.
    
    Returns:
        Tuple of (province, city) - city is None if only province detected
    """
    detected_city = None
    detected_province = None
    
    for signal in signals:
        signal_lower = signal.lower().strip()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        # Use the world_locations hierarchy to find any location
        result = find_location(signal_lower)
        if result:
            level = result["level"]
            value = result["value"]
            parent_chain = result["parent_chain"]
            
            if level == "city":
                detected_city = value
                # Province is the first parent
                if parent_chain:
                    detected_province = parent_chain[0]
            elif level == "province":
                detected_province = value
            elif level == "country":
                # Country-level: set province to None (search whole country)
                detected_province = value  # e.g. "Canada"
            # continent/global: leave as None
            break
    
    return detected_province, detected_city



# =============================================================================
# Main Resolution Function
# =============================================================================

def _resolve_facets(
    seniority: Optional[str],
    province: Optional[str],
    city: Optional[str],
    industry_prefs: List[str],
    company_traits: List[str],
) -> Dict[str, FacetPosition]:
    """
    Build facets dict from extracted values.
    
    Returns dict of dimension → FacetPosition (serialized as dict).
    """
    facets: Dict[str, FacetPosition] = {}

    # Location facet
    loc_value = city or province  # Most specific wins
    loc_pos = resolve_facet_position("location", loc_value)
    if loc_pos:
        facets["location"] = loc_pos

    # Seniority facet
    sen_pos = resolve_facet_position("seniority", seniority)
    if sen_pos:
        facets["seniority"] = sen_pos

    # Industry facet (use first preference)
    if industry_prefs:
        ind_pos = resolve_facet_position("industry", industry_prefs[0])
        if ind_pos:
            facets["industry"] = ind_pos

    # Company size facet (extract from traits)
    size_terms = ["startup", "enterprise", "big-tech", "small-company"]
    for trait in company_traits:
        if trait in size_terms:
            size_pos = resolve_facet_position("company_size", trait)
            if size_pos:
                facets["company_size"] = size_pos
            break

    return facets


def resolve_signals(signals: List[str], original_query: str = "") -> ParsedJobQuery:
    """
    Resolve raw signals into structured job query.
    
    All business logic lives here - deterministic and testable.
    
    Args:
        signals: Raw signals from signal extractor
        original_query: Original natural language query
        
    Returns:
        ParsedJobQuery with resolved fields
    """
    # Track which signals were used for structured extraction
    used_signals: Set[str] = set()
    
    # Extract structured fields
    seniority = _extract_seniority(signals)
    if seniority:
        # Mark seniority signals as used
        for key in SENIORITY_SIGNALS:
            for signal in signals:
                if signal.lower() == key or signal.lower().startswith(key + " "):
                    used_signals.add(signal.lower())
    
    job_type = _extract_job_type(signals)
    if job_type:
        for key in JOB_TYPE_SIGNALS:
            for signal in signals:
                if key in signal.lower():
                    used_signals.add(signal.lower())
    
    company_traits = _extract_company_traits(signals)
    for key in COMPANY_TRAIT_SIGNALS:
        for signal in signals:
            if key in signal.lower():
                used_signals.add(signal.lower())
    
    # Extract industry preferences (used for ranking, not searching)
    industry_prefs = _extract_industry(signals)
    for signal in signals:
        signal_lower = signal.lower()
        if match_industry_signal(signal_lower):
            used_signals.add(signal_lower)
    
    # Detect compound role title
    role_title = _extract_role_title(signals)
    if role_title:
        used_signals.add(role_title.lower())
    
    exclusions = _extract_exclusions(signals)
    for signal in signals:
        if signal.lower().startswith("not ") or signal.lower().startswith("no "):
            used_signals.add(signal.lower())
    
    province, city = _extract_location(signals)
    if province:
        used_signals.add(province.lower())
    if city:
        used_signals.add(city.lower())
    
    # Remaining signals become keywords
    keywords = _extract_keywords(signals, used_signals)

    # Ensure the detected role title contributes to ranking.
    # Without this, queries that resolve a role_title can end up with no keywords,
    # causing the ranker to fall back to neutral (0.5) component scores.
    if role_title:
        role_kw = role_title.lower().strip()
        if role_kw and role_kw not in keywords:
            keywords.insert(0, role_kw)
    
    # Build facet positions for all resolved dimensions
    facets = _resolve_facets(seniority, province, city, industry_prefs, company_traits)
    
    return ParsedJobQuery(
        keywords=keywords,
        seniority=seniority,
        exclude_terms=exclusions,
        job_type=job_type,
        company_traits=company_traits,
        industry_preferences=industry_prefs,
        role_title=role_title,
        location_preference=province,
        city_preference=city,
        original_query=original_query,
        signals=signals,
        facets=facets,
    )
