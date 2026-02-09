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
    keywords: List[str] = []
    seniority: Optional[str] = None
    exclude_terms: List[str] = []
    job_type: Optional[str] = None
    company_traits: List[str] = []
    location_preference: Optional[str] = None
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


def _extract_keywords(signals: List[str], used_signals: Set[str]) -> List[str]:
    """
    Extract keywords from signals that weren't used for other purposes.
    
    These become the core search terms.
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


def _extract_location(signals: List[str]) -> Optional[str]:
    """Extract location preference from signals."""
    # Canadian provinces and major cities
    canadian_locations = {
        "ontario", "toronto", "ottawa", "mississauga",
        "british columbia", "vancouver", "victoria",
        "alberta", "calgary", "edmonton",
        "quebec", "montreal", "quebec city",
        "manitoba", "winnipeg",
        "saskatchewan", "regina", "saskatoon",
        "nova scotia", "halifax",
        "new brunswick", "fredericton",
        "canada",
    }
    
    for signal in signals:
        signal_lower = signal.lower()
        
        # Skip negation signals
        if signal_lower.startswith("not "):
            continue
        
        if signal_lower in canadian_locations:
            return signal_lower.title()
    
    return None


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
    
    exclusions = _extract_exclusions(signals)
    for signal in signals:
        if signal.lower().startswith("not ") or signal.lower().startswith("no "):
            used_signals.add(signal.lower())
    
    location = _extract_location(signals)
    if location:
        used_signals.add(location.lower())
    
    # Remaining signals become keywords
    keywords = _extract_keywords(signals, used_signals)
    
    return ParsedJobQuery(
        keywords=keywords,
        seniority=seniority,
        exclude_terms=exclusions,
        job_type=job_type,
        company_traits=company_traits,
        location_preference=location,
        original_query=original_query,
        signals=signals,
    )
