"""
Query Resolver Service

Deterministic rule engine that resolves signals into structured query.
All business logic lives here - testable, debuggable.
"""

from typing import List, Optional, Set
from pydantic import BaseModel


# =============================================================================
# Data Models
# =============================================================================

class ParsedJobQuery(BaseModel):
    """Structured job query resolved from signals."""
    keywords: List[str] = []  # Core role keywords for Adzuna search
    seniority: Optional[str] = None
    exclude_terms: List[str] = []
    job_type: Optional[str] = None
    company_traits: List[str] = []
    industry_preferences: List[str] = []  # For ranking, not searching
    role_title: Optional[str] = None  # Detected compound role title
    location_preference: Optional[str] = None  # Province
    city_preference: Optional[str] = None  # City
    original_query: str = ""
    signals: List[str] = []  # Raw signals for debugging


# =============================================================================
# Signal Resolution Rules
# =============================================================================

# Seniority level mappings
SENIORITY_SIGNALS = {
    "senior": "senior",
    "sr": "senior",
    "lead": "lead",
    "principal": "principal",
    "staff": "staff",
    "junior": "junior",
    "jr": "junior",
    "entry level": "entry",
    "entry": "entry",
    "mid level": "mid",
    "mid": "mid",
    "intern": "intern",
    "internship": "intern",
}

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

# Industry/domain signals
INDUSTRY_SIGNALS = {
    "saas": "saas",
    "fintech": "fintech",
    "finance": "finance",
    "healthcare": "healthcare",
    "healthtech": "healthtech",
    "edtech": "edtech",
    "education": "education",
    "ecommerce": "ecommerce",
    "e-commerce": "ecommerce",
    "ai": "ai",
    "crypto": "crypto",
    "blockchain": "blockchain",
    "gaming": "gaming",
    "media": "media",
    "real estate": "real estate",
    "cybersecurity": "cybersecurity",
    "insurance": "insurance",
    "banking": "banking",
    "automotive": "automotive",
    "cleantech": "cleantech",
    "agritech": "agritech",
}

# Known compound role titles (signal → clean role title)
ROLE_TITLES = {
    "frontend developer": "frontend developer",
    "backend developer": "backend developer",
    "fullstack developer": "fullstack developer",
    "software engineer": "software engineer",
    "data analyst": "data analyst",
    "data scientist": "data scientist",
    "data engineer": "data engineer",
    "devops engineer": "devops engineer",
    "product manager": "product manager",
    "product designer": "product designer",
    "ml engineer": "ml engineer",
    "project manager": "project manager",
}

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
        signal_lower = signal.lower()
        for key in SENIORITY_SIGNALS:
            if key in signal_lower:
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
        signal_lower = signal.lower()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        for key, value in SENIORITY_SIGNALS.items():
            if key in signal_lower:
                return value
    
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
    """Extract industry/domain preferences from signals."""
    industries = []
    added = set()
    
    for signal in signals:
        signal_lower = signal.lower()
        
        if signal_lower.startswith("not "):
            continue
        
        for key, value in INDUSTRY_SIGNALS.items():
            if key == signal_lower and value not in added:
                industries.append(value)
                added.add(value)
    
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
    Extract location preference from signals.
    
    Returns:
        Tuple of (province, city) - city is None if only province detected
    """
    # City to province mapping
    city_to_province = {
        "toronto": "Ontario",
        "ottawa": "Ontario",
        "mississauga": "Ontario",
        "vancouver": "British Columbia",
        "victoria": "British Columbia",
        "calgary": "Alberta",
        "edmonton": "Alberta",
        "montreal": "Quebec",
        "quebec city": "Quebec",
        "winnipeg": "Manitoba",
        "regina": "Saskatchewan",
        "saskatoon": "Saskatchewan",
        "halifax": "Nova Scotia",
        "fredericton": "New Brunswick",
    }
    
    # Provinces (normalized to proper case)
    provinces = {
        "ontario": "Ontario",
        "british columbia": "British Columbia",
        "alberta": "Alberta",
        "quebec": "Quebec",
        "manitoba": "Manitoba",
        "saskatchewan": "Saskatchewan",
        "nova scotia": "Nova Scotia",
        "new brunswick": "New Brunswick",
        "canada": None,  # Country-level, no specific province
    }
    
    detected_city = None
    detected_province = None
    
    for signal in signals:
        signal_lower = signal.lower()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        # Check if it's a city first
        if signal_lower in city_to_province:
            detected_city = signal_lower.title()
            detected_province = city_to_province[signal_lower]
            break
        
        # Check if it's a province
        if signal_lower in provinces:
            detected_province = provinces[signal_lower]
            break
    
    return detected_province, detected_city



# =============================================================================
# Main Resolution Function
# =============================================================================

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
                if key in signal.lower():
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
    for key in INDUSTRY_SIGNALS:
        for signal in signals:
            if key == signal.lower():
                used_signals.add(signal.lower())
    
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
    )
