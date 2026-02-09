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
    Extracts: role titles, seniority, job type, company traits,
    industry preferences, location, salary, and remaining keywords.
    """
    query_lower = query.lower()
    signals = []
    consumed = set()  # Track consumed text spans to avoid double-extraction
    
    # --- 1. Role title patterns (compound, extract first) ---
    role_patterns = [
        (r'\b(frontend|front[- ]end)\s+(developer|engineer|role)\b', 'frontend developer'),
        (r'\b(backend|back[- ]end)\s+(developer|engineer|role)\b', 'backend developer'),
        (r'\b(fullstack|full[- ]stack)\s+(developer|engineer|role)\b', 'fullstack developer'),
        (r'\b(software)\s+(developer|engineer)\b', 'software engineer'),
        (r'\b(data)\s+(analyst|scientist|engineer)\b', None),  # None = use match
        (r'\b(devops|cloud)\s+(engineer)\b', None),
        (r'\b(product)\s+(manager|designer)\b', None),
        (r'\b(ux|ui|ux/ui)\s+(designer|researcher)\b', None),
        (r'\b(machine\s+learning|ml)\s+(engineer)\b', 'ml engineer'),
        (r'\b(project)\s+(manager)\b', None),
        (r'\b(qa|quality\s+assurance)\s+(engineer|analyst|tester)\b', None),
    ]
    
    for pattern, signal in role_patterns:
        match = re.search(pattern, query_lower)
        if match:
            role_signal = signal or match.group(0).strip()
            signals.append(role_signal)
            consumed.update(match.group(0).split())
    
    # --- 2. Seniority patterns ---
    seniority_patterns = [
        (r'\bsenior\b', 'senior'),
        (r'\bjunior\b', 'junior'),
        (r'\bentry[- ]?level\b', 'entry level'),
        (r'\bmid[- ]?level\b', 'mid level'),
        (r'\blead\b', 'lead'),
        (r'\bprincipal\b', 'principal'),
        (r'\bstaff\b', 'staff'),
    ]
    
    for pattern, signal in seniority_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
            consumed.update(signal.split())
    
    # --- 3. Job type patterns ---
    job_type_patterns = [
        (r'\bremote[- ]?friendly\b', 'remote'),
        (r'\bremote\b', 'remote'),
        (r'\bhybrid\b', 'hybrid'),
        (r'\bfull[- ]?time\b', 'full time'),
        (r'\bpart[- ]?time\b', 'part time'),
        (r'\bcontract\b', 'contract'),
        (r'\bfreelance\b', 'freelance'),
    ]
    
    for pattern, signal in job_type_patterns:
        if re.search(pattern, query_lower):
            if signal not in signals:
                signals.append(signal)
            consumed.update(re.search(pattern, query_lower).group(0).split())
    
    # --- 4. Company trait patterns (expanded) ---
    trait_patterns = [
        (r'\bhigh[- ]?growth\s+start[- ]?up\b', 'high-growth startup'),
        (r'\bhigh[- ]?growth\b', 'high-growth'),
        (r'\bstart[- ]?up\b', 'startup'),
        (r'\bstartup\b', 'startup'),
        (r'\bfast[- ]?growing\b', 'fast-growing'),
        (r'\bearly[- ]?stage\b', 'startup'),
        (r'\bsmall\s+(?:company|team)\b', 'small company'),
        (r'\blarge\s+(?:company|enterprise)\b', 'enterprise'),
        (r'\bbig\s+tech\b', 'big-tech'),
        (r'\bfaang\b', 'big-tech'),
        (r'\bwell[- ]?funded\b', 'well-funded'),
        (r'\bseries\s+[a-c]\b', 'funded'),
    ]
    
    for pattern, signal in trait_patterns:
        if re.search(pattern, query_lower):
            if signal not in signals:
                signals.append(signal)
            consumed.update(re.search(pattern, query_lower).group(0).split())
    
    # --- 5. Industry/domain patterns ---
    industry_patterns = [
        (r'\bsaas\b', 'saas'),
        (r'\bfintech\b', 'fintech'),
        (r'\bfinance\b', 'finance'),
        (r'\bhealthcare\b', 'healthcare'),
        (r'\bhealth\s*tech\b', 'healthtech'),
        (r'\bedtech\b', 'edtech'),
        (r'\beducation\b', 'education'),
        (r'\be[- ]?commerce\b', 'ecommerce'),
        (r'\bai\b', 'ai'),
        (r'\bcrypto\b', 'crypto'),
        (r'\bblockchain\b', 'blockchain'),
        (r'\bgaming\b', 'gaming'),
        (r'\bmedia\b', 'media'),
        (r'\breal\s+estate\b', 'real estate'),
        (r'\bcybersecurity\b', 'cybersecurity'),
        (r'\binsurance\b', 'insurance'),
        (r'\bbanking\b', 'banking'),
        (r'\bautomotive\b', 'automotive'),
        (r'\bcleantech\b', 'cleantech'),
        (r'\bagritech\b', 'agritech'),
    ]
    
    for pattern, signal in industry_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
            consumed.update(signal.split())
    
    # --- 6. Negation patterns ---
    for match in re.finditer(r'not\s+(\w+)', query_lower):
        signals.append(f"not {match.group(1)}")
        consumed.update(match.group(0).split())
    
    # --- 7. Salary patterns ---
    salary_patterns = [
        (r'\bhigh\s+salary\b', 'high salary'),
        (r'\bcompetitive\s+(?:salary|pay)\b', 'competitive salary'),
        (r'\$\d+k?', 'salary preference'),
    ]
    
    for pattern, signal in salary_patterns:
        if re.search(pattern, query_lower):
            signals.append(signal)
    
    # --- 8. Remaining tech keywords (not already consumed) ---
    tech_keywords = {
        'python', 'javascript', 'typescript', 'react', 'angular', 'vue',
        'node', 'golang', 'rust', 'java', 'kotlin', 'swift', 'ruby',
        'rails', 'django', 'flask', 'fastapi', 'graphql', 'rest',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
        'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'nextjs', 'nuxt', 'svelte', 'tailwind', 'css', 'html',
    }
    
    words = re.findall(r'\b[a-z]+\b', query_lower)
    for word in words:
        if word in tech_keywords and word not in consumed and word not in signals:
            signals.append(word)
    
    # --- 9. Skip common filler words ---
    common_words = {
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was',
        'job', 'jobs', 'role', 'roles', 'position', 'positions', 'looking',
        'want', 'need', 'find', 'search', 'work', 'working', 'company',
        'projects', 'project', 'preferably', 'ideally', 'prefer',
        'would', 'like', 'love', 'interested',
    }
    consumed.update(common_words)
    
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
