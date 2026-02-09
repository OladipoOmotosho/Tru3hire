"""
Signal Extractor Service

Uses Gemini to extract raw signals from natural language queries.
LLM outputs signals only - no business logic interpretation.

Guardrails:
- Max 15 signals (token discipline)
- Duplicates removed
- Normalized (lowercase, trimmed)
"""

import os
import json
import re
from typing import List, Optional
from pydantic import BaseModel

# Try to import Gemini
_gemini_available = False
try:
    from google import genai
    _gemini_available = True
except ImportError:
    pass


# =============================================================================
# Configuration
# =============================================================================

MAX_SIGNALS = 15
GEMINI_MODEL = "gemini-2.0-flash"

SIGNAL_EXTRACTION_PROMPT = """Extract search signals from this job search query.

Return ONLY a JSON array of raw signals. Do not interpret or expand them.

Examples:
- "senior python roles at startups, not management" → ["senior", "python", "startup", "not management"]
- "remote frontend developer, high salary" → ["remote", "frontend", "developer", "high salary"]
- "entry level data analyst in Toronto" → ["entry level", "data analyst", "Toronto"]

Query: {query}

Return only the JSON array, nothing else:"""


# =============================================================================
# Data Models
# =============================================================================

class SignalExtractionResult(BaseModel):
    """Result of signal extraction from a query."""
    signals: List[str]
    original_query: str
    fallback_used: bool = False


# =============================================================================
# Signal Extraction Functions
# =============================================================================

def _normalize_signals(signals: List[str]) -> List[str]:
    """
    Normalize and deduplicate signals.
    
    - Lowercase and trim
    - Remove duplicates (preserve order)
    - Cap at MAX_SIGNALS
    """
    seen = set()
    normalized = []
    
    for signal in signals:
        # Normalize: lowercase, strip whitespace
        clean = signal.lower().strip()
        
        # Skip empty or already seen
        if not clean or clean in seen:
            continue
        
        seen.add(clean)
        normalized.append(clean)
        
        # Cap at max signals
        if len(normalized) >= MAX_SIGNALS:
            break
    
    return normalized


def _extract_signals_fallback(query: str) -> List[str]:
    """
    Fallback signal extraction using regex/heuristics.
    
    Used when Gemini is unavailable.
    """
    query_lower = query.lower()
    signals = []
    
    # Seniority patterns
    seniority_patterns = [
        (r'\bsenior\b', 'senior'),
        (r'\bjunior\b', 'junior'),
        (r'\bentry[- ]?level\b', 'entry level'),
        (r'\bmid[- ]?level\b', 'mid level'),
        (r'\blead\b', 'lead'),
        (r'\bprincipal\b', 'principal'),
    ]
    
    for pattern, signal in seniority_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
    
    # Job type patterns
    job_type_patterns = [
        (r'\bremote\b', 'remote'),
        (r'\bhybrid\b', 'hybrid'),
        (r'\bfull[- ]?time\b', 'full time'),
        (r'\bpart[- ]?time\b', 'part time'),
        (r'\bcontract\b', 'contract'),
        (r'\bfreelance\b', 'freelance'),
    ]
    
    for pattern, signal in job_type_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
    
    # Negation patterns
    not_patterns = re.findall(r'not\s+(\w+)', query_lower)
    for word in not_patterns:
        signals.append(f"not {word}")
    
    # Company trait patterns
    trait_patterns = [
        (r'\bstartup\b', 'startup'),
        (r'\bfast[- ]?growing\b', 'fast growing'),
        (r'\bremote[- ]?friendly\b', 'remote friendly'),
        (r'\bsmall\s+(?:company|team)\b', 'small company'),
        (r'\blarge\s+(?:company|enterprise)\b', 'large company'),
    ]
    
    for pattern, signal in trait_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
    
    # Salary patterns
    salary_patterns = [
        (r'\bhigh\s+salary\b', 'high salary'),
        (r'\bcompetitive\s+(?:salary|pay)\b', 'competitive salary'),
        (r'\$\d+k?', 'salary preference'),
    ]
    
    for pattern, signal in salary_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
    
    # Extract potential keywords (nouns/tech terms)
    # Simple heuristic: words 3+ chars, not common words
    common_words = {
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was',
        'job', 'jobs', 'role', 'roles', 'position', 'positions', 'looking',
        'want', 'need', 'find', 'search', 'work', 'working',
    }
    
    words = re.findall(r'\b[a-z]{3,}\b', query_lower)
    for word in words:
        if word not in common_words and word not in signals:
            # Likely a keyword (tech term, skill, etc.)
            signals.append(word)
    
    return _normalize_signals(signals)


async def extract_signals(query: str) -> SignalExtractionResult:
    """
    Extract raw signals from a natural language job search query.
    
    Uses Gemini for intelligent signal extraction, with fallback to
    regex-based extraction if API unavailable.
    
    Args:
        query: Natural language job search query
        
    Returns:
        SignalExtractionResult with signals and metadata
    """
    # Check for empty query
    if not query or not query.strip():
        return SignalExtractionResult(
            signals=[],
            original_query=query,
            fallback_used=False,
        )
    
    # Try Gemini extraction
    if _gemini_available:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        
        if api_key:
            try:
                client = genai.Client(api_key=api_key)
                
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=SIGNAL_EXTRACTION_PROMPT.format(query=query),
                )
                
                # Parse JSON response
                response_text = response.text.strip()
                
                # Clean up response (remove markdown code blocks if present)
                if response_text.startswith("```"):
                    response_text = re.sub(r'^```\w*\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                signals = json.loads(response_text)
                
                if isinstance(signals, list):
                    return SignalExtractionResult(
                        signals=_normalize_signals(signals),
                        original_query=query,
                        fallback_used=False,
                    )
            except Exception:
                # Fall through to fallback
                pass
    
    # Fallback: regex-based extraction
    signals = _extract_signals_fallback(query)
    
    return SignalExtractionResult(
        signals=signals,
        original_query=query,
        fallback_used=True,
    )


def extract_signals_sync(query: str) -> SignalExtractionResult:
    """
    Synchronous version of signal extraction.
    
    Uses only fallback regex extraction (no API calls).
    Useful for testing and quick processing.
    """
    if not query or not query.strip():
        return SignalExtractionResult(
            signals=[],
            original_query=query,
            fallback_used=True,
        )
    
    signals = _extract_signals_fallback(query)
    
    return SignalExtractionResult(
        signals=signals,
        original_query=query,
        fallback_used=True,
    )
