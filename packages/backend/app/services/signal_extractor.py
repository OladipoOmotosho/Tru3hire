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
import asyncio
import re
import string
import time
import logging
import threading
import difflib
from typing import List, Optional, Dict, Tuple, Any
from collections import OrderedDict
from pydantic import BaseModel

logger = logging.getLogger(__name__)

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
GEMINI_MODEL = "gemini-2.5-flash"

# Signal extraction cache (query → (result, timestamp))
# Avoids re-calling Gemini for identical queries
_signal_cache: OrderedDict = OrderedDict()
_signal_cache_lock: Optional[asyncio.Lock] = None
_SIGNAL_CACHE_MAX = 500
_SIGNAL_CACHE_TTL = 300  # 5 minutes


def _get_cache_lock() -> asyncio.Lock:
    """Lazily create an asyncio.Lock bound to the current event loop."""
    global _signal_cache_lock
    if _signal_cache_lock is None:
        _signal_cache_lock = asyncio.Lock()
    return _signal_cache_lock

SIGNAL_EXTRACTION_PROMPT = """You are an expert job search query parser and auto-correction engine. Extract structured signals from the user's query and strictly auto-correct any spelling mistakes or typos.

CRITICAL INSTRUCTION: Auto-correct misspelled words (e.g., 'softerware' -> 'software', 'enginir' -> 'engineer', 'tronto' -> 'toronto', 'javacsript' -> 'javascript'). Normalize industry terms.

Return ONLY a JSON object with these fields (omit empty fields):
{{
  "role": "the job role/title as a compound phrase, spelled properly (e.g. 'frontend developer', 'data scientist')",
  "seniority": "one of: junior, entry, mid, senior, lead, principal, intern",
  "job_type": "one of: remote, hybrid, full-time, part-time, contract",
  "industries": ["list of industry/domain preferences like 'saas', 'finance', 'healthcare'"],
  "company_traits": ["list of company characteristics like 'startup', 'high-growth', 'enterprise', 'non-profit'"],
  "location": "city or region mentioned, spelled properly",
  "exclusions": ["things the user does NOT want, without the 'not' prefix"],
  "keywords": ["remaining technical keywords not covered above, spelled properly, e.g. 'python', 'react', 'machine learning'"]
}}

Examples:
- "softerware enginir at startups, not management"
  → {{"role": "software engineer", "company_traits": ["startup"], "exclusions": ["management"]}}
- "I want a frontend role in a SaaS company, preferably a high-growth startup, working in finance"
  → {{"role": "frontend developer", "industries": ["saas", "finance"], "company_traits": ["startup", "high-growth"]}}
- "remote data analist in tornto, entry level"
  → {{"role": "data analyst", "seniority": "entry", "job_type": "remote", "location": "Toronto"}}
- "ML engineer, not crypto, at a well-funded company"
  → {{"role": "machine learning engineer", "company_traits": ["well-funded"], "exclusions": ["crypto"]}}

Query: {query}

Return only the JSON object, nothing else:"""


# =============================================================================
# Data Models
# =============================================================================

class SignalExtractionResult(BaseModel):
    """Result of signal extraction from a query."""
    signals: List[str]
    original_query: str
    fallback_used: bool = False
    parsed_json: Optional[Dict[str, Any]] = None


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


# Vocabulary for fuzzy matching (common role words, seniority, tech terms)
_FUZZY_VOCABULARY = {
    # Role words
    "software", "engineer", "developer", "analyst", "scientist", "designer",
    "architect", "manager", "administrator", "specialist", "consultant",
    "frontend", "backend", "fullstack", "devops", "security", "platform",
    "product", "project", "systems", "network", "solutions", "technical",
    "quality", "assurance", "reliability", "writer", "researcher",
    # Seniority
    "senior", "junior", "intern", "internship", "entry", "level", "lead",
    "principal", "staff", "mid",
    # Job type
    "remote", "hybrid", "contract", "freelance",
    # Tech keywords
    "python", "javascript", "typescript", "react", "angular", "vue",
    "node", "golang", "rust", "java", "kotlin", "swift", "ruby",
    "django", "flask", "fastapi", "graphql", "docker", "kubernetes",
    "sql", "postgresql", "mongodb", "redis", "elasticsearch",
    "machine", "learning", "data", "cloud", "linux",
}


def _fuzzy_correct_query(query: str) -> str:
    """
    Apply fuzzy correction to each word in the query.

    Uses difflib.get_close_matches against a known vocabulary to fix
    common typos like 'enginir' → 'engineer', 'softerware' → 'software'.
    Only corrects words that are NOT already in the vocabulary (i.e. unrecognized).
    """
    words = query.split()
    corrected = []

    # Common filler words we should never try to correct
    skip_words = {
        "the", "and", "for", "with", "that", "this", "from", "are", "was",
        "job", "jobs", "role", "roles", "not", "want", "need", "find",
        "in", "at", "or", "a", "an", "to", "of", "on", "is", "it",
        "looking", "search", "work", "working", "prefer", "like", "would",
    }

    for word in words:
        # Strip leading/trailing punctuation to get the base word
        leading = ""
        trailing = ""
        base_word = word
        while base_word and base_word[0] in string.punctuation:
            leading += base_word[0]
            base_word = base_word[1:]
        while base_word and base_word[-1] in string.punctuation:
            trailing = base_word[-1] + trailing
            base_word = base_word[:-1]

        # Skip short words, already-known words, and filler words
        if len(base_word) <= 2 or base_word in _FUZZY_VOCABULARY or base_word in skip_words:
            corrected.append(word)
            continue

        # Try to find a close match
        matches = difflib.get_close_matches(base_word, _FUZZY_VOCABULARY, n=1, cutoff=0.75)
        if matches:
            corrected.append(f"{leading}{matches[0]}{trailing}")
        else:
            corrected.append(word)  # Keep original if no match

    return " ".join(corrected)


def _extract_signals_fallback(query: str) -> List[str]:
    """
    Fallback signal extraction using regex/heuristics.
    
    Used when Gemini is unavailable.
    Extracts: role titles, seniority, job type, company traits,
    industry preferences, location, salary, and remaining keywords.
    Includes fuzzy matching for typo tolerance.
    """
    # --- 0. Fuzzy-correct misspelled words first ---
    query_lower = _fuzzy_correct_query(query.lower())
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
        (r'\b(security)\s+(engineer|analyst|architect)\b', None),
        (r'\b(systems?)\s+(engineer|administrator|admin)\b', None),
        (r'\b(network)\s+(engineer|administrator)\b', None),
        (r'\b(platform)\s+(engineer)\b', None),
        (r'\b(site\s+reliability)\s+(engineer)\b', 'site reliability engineer'),
        (r'\b(solutions?)\s+(architect|engineer)\b', None),
        (r'\b(technical?)\s+(writer|lead|director)\b', None),
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
        m = re.search(pattern, query_lower)
        if m:
            if signal not in signals:
                signals.append(signal)
            consumed.update(m.group(0).split())
    
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
        m = re.search(pattern, query_lower)
        if m:
            if signal not in signals:
                signals.append(signal)
            consumed.update(m.group(0).split())
    
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
    
    # --- 8. Multi-word tech terms (extract before single-word pass) ---
    multi_word_tech = [
        (r'\breact\s+native\b', 'react native'),
        (r'\bnode\.?js\b', 'node.js'),
        (r'\bnext\.?js\b', 'next.js'),
        (r'\bnuxt\.?js\b', 'nuxt.js'),
        (r'\bvue\.?js\b', 'vue.js'),
        (r'\bruby\s+on\s+rails\b', 'ruby on rails'),
        (r'\bgoogle\s+cloud\b', 'gcp'),
        (r'\bspring\s+boot\b', 'spring boot'),
        (r'\bpower\s+bi\b', 'power bi'),
        (r'\bmachine\s+learning\b', 'machine learning'),
        (r'\bnatural\s+language\s+processing\b', 'nlp'),
        (r'\bcomputer\s+vision\b', 'computer vision'),
        (r'\bdeep\s+learning\b', 'deep learning'),
        (r'\bci[/ ]cd\b', 'ci/cd'),
    ]
    
    for pattern, signal in multi_word_tech:
        if re.search(pattern, query_lower):
            if signal not in signals and signal not in consumed:
                signals.append(signal)
                consumed.update(signal.split())
    
    # --- 9. Handle basic OR queries ("X or Y" → ['X', 'Y']) ---
    or_matches = re.findall(r'(\b\w+)\s+or\s+(\w+\b)', query_lower)
    for left, right in or_matches:
        if left not in consumed and left not in signals:
            signals.append(left)
            consumed.add(left)
        if right not in consumed and right not in signals:
            signals.append(right)
            consumed.add(right)
    
    # --- 10. Remaining single-word tech keywords (not already consumed) ---
    tech_keywords = {
        'python', 'javascript', 'typescript', 'react', 'angular', 'vue',
        'node', 'golang', 'rust', 'java', 'kotlin', 'swift', 'ruby',
        'rails', 'django', 'flask', 'fastapi', 'graphql', 'rest',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
        'sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'nextjs', 'nuxt', 'svelte', 'tailwind', 'css', 'html',
        'spark', 'hadoop', 'airflow', 'tableau', 'figma', 'sketch',
        'linux', 'nginx', 'kafka', 'rabbitmq', 'celery',
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
    Results are cached for 5 minutes to avoid redundant Gemini calls.
    
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
    
    # Check cache first
    cache_key = query.strip().lower()
    async with _get_cache_lock():
        if cache_key in _signal_cache:
            cached_result, cached_time = _signal_cache[cache_key]
            if time.time() - cached_time < _SIGNAL_CACHE_TTL:
                # Move to end (most recently used)
                _signal_cache.move_to_end(cache_key)
                return cached_result
    
    def _cache_result(result: SignalExtractionResult) -> SignalExtractionResult:
        """Store a result in the signal cache (called under lock)."""
        _signal_cache[cache_key] = (result, time.time())
        _signal_cache.move_to_end(cache_key)
        # Evict oldest if over limit
        while len(_signal_cache) > _SIGNAL_CACHE_MAX:
            _signal_cache.popitem(last=False)
        return result
    
    # Try Gemini extraction
    if _gemini_available:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        
        if api_key:
            try:
                client = genai.Client(api_key=api_key)  # type: ignore[possibly-undefined]
                
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=SIGNAL_EXTRACTION_PROMPT.format(query=query),
                )
                
                # Parse JSON response
                response_text = (response.text or "").strip()
                
                # Clean up response (remove markdown code blocks if present)
                if response_text.startswith("```"):
                    response_text = re.sub(r'^```\w*\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                parsed = json.loads(response_text)
                
                # Handle both structured (dict) and legacy (list) formats
                if isinstance(parsed, dict):
                    # New structured format → flatten to signal array
                    signals = []
                    if parsed.get("role"):
                        signals.append(parsed["role"])
                    if parsed.get("seniority"):
                        signals.append(parsed["seniority"])
                    if parsed.get("job_type"):
                        signals.append(parsed["job_type"])
                    for industry in parsed.get("industries", []):
                        signals.append(industry)
                    for trait in parsed.get("company_traits", []):
                        signals.append(trait)
                    if parsed.get("location"):
                        signals.append(parsed["location"])
                    for excl in parsed.get("exclusions", []):
                        signals.append(f"not {excl}")
                    for kw in parsed.get("keywords", []):
                        signals.append(kw)
                    
                    result = SignalExtractionResult(
                        signals=_normalize_signals(signals),
                        original_query=query,
                        fallback_used=False,
                        parsed_json=parsed,
                    )
                    async with _get_cache_lock():
                        _cache_result(result)
                    return result
                elif isinstance(parsed, list):
                    # Legacy flat array format (backward compat)
                    result = SignalExtractionResult(
                        signals=_normalize_signals(parsed),
                        original_query=query,
                        fallback_used=False,
                        parsed_json=None,
                    )
                    async with _get_cache_lock():
                        _cache_result(result)
                    return result
            except Exception as e:
                logger.exception("Gemini API Error in signal_extractor")
                # Fall through to fallback
                pass
    
    # Fallback: regex-based extraction
    signals = _extract_signals_fallback(query)
    
    result = SignalExtractionResult(
        signals=signals,
        original_query=query,
        fallback_used=True,
    )
    async with _get_cache_lock():
        _cache_result(result)
    return result


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
