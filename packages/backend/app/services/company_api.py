"""
Company Verification API Service

Provides company verification using free external APIs:
1. OpenCorporates API - 200M+ companies from official registries
2. Wikidata - Notable companies (completely free, unlimited)
3. Fallback to local database

This hybrid approach ensures:
- Real-time verification for unknown companies
- Caching to reduce API calls
- Fallback to static list when APIs are unavailable
"""

import os
import httpx
import asyncio
import threading
import atexit
from typing import Optional, Dict
from dataclasses import dataclass
from enum import Enum


# =============================================================================
# Configuration
# =============================================================================

# OpenCorporates API (free tier available)
OPENCORPORATES_API_URL = "https://api.opencorporates.com/v0.4"
OPENCORPORATES_API_KEY = os.getenv("OPENCORPORATES_API_KEY", "")  # Optional for basic searches

# Abstract API (100 free requests/month)
ABSTRACT_API_URL = "https://companyenrichment.abstractapi.com/v1"
ABSTRACT_API_KEY = os.getenv("ABSTRACT_API_KEY", "")

# Cache settings
CACHE_DURATION_DAYS = 30  # How long to cache API results


class VerificationSource(Enum):
    LOCAL_DB = "local_database"
    OPENCORPORATES = "opencorporates"
    WIKIDATA = "wikidata"
    ABSTRACT_API = "abstract_api"
    NOT_FOUND = "not_found"


@dataclass
class APIVerificationResult:
    """Result from API-based company verification."""
    company_name: str
    is_verified: bool
    confidence: float  # 0.0 to 1.0
    source: VerificationSource
    jurisdiction: Optional[str] = None
    company_type: Optional[str] = None
    status: Optional[str] = None  # active, dissolved, etc.
    incorporation_date: Optional[str] = None
    registered_address: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[str] = None
    website: Optional[str] = None
    raw_data: Optional[Dict] = None
    error: Optional[str] = None


class CompanyVerificationAPI:
    """
    API-based company verification service.
    
    Uses multiple free APIs to verify if a company exists and is legitimate.
    Results are cached in the local database to reduce API calls.
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def verify_company(self, company_name: str, country: str = "") -> APIVerificationResult:
        """
        Verify a company using available APIs.
        
        Tries APIs in order of reliability:
        1. OpenCorporates (official registry data)
        2. Wikidata (notable companies)
        
        Args:
            company_name: Name of the company to verify
            country: Optional country code (e.g., "us", "ca", "gb")
            
        Returns:
            APIVerificationResult with verification details
        """
        if not company_name or len(company_name.strip()) < 2:
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.NOT_FOUND,
                error="Company name too short"
            )
        
        # Try OpenCorporates first (most comprehensive)
        result = await self._verify_opencorporates(company_name, country)
        if result.is_verified:
            return result
        
        # Try Wikidata (free, unlimited)
        result = await self._verify_wikidata(company_name)
        if result.is_verified:
            return result
        
        # If Abstract API key is configured, try it
        if ABSTRACT_API_KEY:
            result = await self._verify_abstract_api(company_name)
            if result.is_verified:
                return result
        
        # Not found in any API
        return APIVerificationResult(
            company_name=company_name,
            is_verified=False,
            confidence=0.0,
            source=VerificationSource.NOT_FOUND,
            error="Company not found in any verification source"
        )
    
    async def _verify_opencorporates(self, company_name: str, country: str = "") -> APIVerificationResult:
        """
        Verify company using OpenCorporates API.
        
        OpenCorporates has 200M+ companies from 140 jurisdictions.
        Free tier allows basic searches without API key.
        """
        try:
            # Build search URL
            params = {
                "q": company_name,
                "format": "json",
            }
            if country:
                params["country_code"] = country.lower()
            
            if OPENCORPORATES_API_KEY:
                params["api_token"] = OPENCORPORATES_API_KEY
            
            url = f"{OPENCORPORATES_API_URL}/companies/search"
            response = await self.client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                companies = data.get("results", {}).get("companies", [])
                
                if companies:
                    # Get the best match
                    best_match = companies[0].get("company", {})
                    
                    # Calculate confidence based on name similarity
                    matched_name = best_match.get("name", "")
                    confidence = self._calculate_name_similarity(company_name, matched_name)
                    
                    return APIVerificationResult(
                        company_name=company_name,
                        is_verified=confidence >= 0.7,
                        confidence=confidence,
                        source=VerificationSource.OPENCORPORATES,
                        jurisdiction=best_match.get("jurisdiction_code"),
                        company_type=best_match.get("company_type"),
                        status=best_match.get("current_status"),
                        incorporation_date=best_match.get("incorporation_date"),
                        registered_address=best_match.get("registered_address_in_full"),
                        raw_data=best_match
                    )
            
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.OPENCORPORATES,
                error=f"No results found (status: {response.status_code})"
            )
            
        except Exception as e:
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.OPENCORPORATES,
                error=f"API error: {str(e)}"
            )
    
    async def _verify_wikidata(self, company_name: str) -> APIVerificationResult:
        """
        Verify company using Wikidata SPARQL query.
        
        Wikidata is completely free with no rate limits.
        Contains millions of notable companies worldwide.
        """
        try:
            # Clean company name for search
            search_name = company_name.lower().replace("'", "\\'")
            
            # Simpler, more reliable SPARQL query
            query = f'''
            SELECT ?company ?companyLabel ?countryLabel ?industryLabel WHERE {{
              SERVICE wikibase:mwapi {{
                bd:serviceParam wikibase:api "EntitySearch" .
                bd:serviceParam wikibase:endpoint "www.wikidata.org" .
                bd:serviceParam mwapi:search "{search_name}" .
                bd:serviceParam mwapi:language "en" .
                ?company wikibase:apiOutputItem mwapi:item .
              }}
              # Filter to only companies/businesses/organizations
              ?company wdt:P31/wdt:P279* ?type .
              VALUES ?type {{ wd:Q4830453 wd:Q783794 wd:Q6881511 wd:Q891723 wd:Q43229 }}
              OPTIONAL {{ ?company wdt:P17 ?country. }}
              OPTIONAL {{ ?company wdt:P452 ?industry. }}
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
            }}
            LIMIT 5
            '''
            
            url = "https://query.wikidata.org/sparql"
            headers = {
                "Accept": "application/sparql-results+json",
                "User-Agent": "TrueHire/1.0 (https://github.com/truehire; Company Verification)"
            }
            
            response = await self.client.get(url, params={"query": query}, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", {}).get("bindings", [])
                
                if results:
                    best_match = results[0]
                    matched_name = best_match.get("companyLabel", {}).get("value", "")
                    confidence = self._calculate_name_similarity(company_name, matched_name)
                    
                    return APIVerificationResult(
                        company_name=company_name,
                        is_verified=confidence >= 0.6,
                        confidence=confidence,
                        source=VerificationSource.WIKIDATA,
                        jurisdiction=best_match.get("countryLabel", {}).get("value"),
                        industry=best_match.get("industryLabel", {}).get("value"),
                        raw_data=best_match
                    )
            
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.WIKIDATA,
                error=f"No results found (status: {response.status_code})"
            )
            
        except Exception as e:
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.WIKIDATA,
                error=f"API error: {str(e)}"
            )
    
    async def _verify_abstract_api(self, company_name: str) -> APIVerificationResult:
        """
        Verify company using Abstract API.
        
        Free tier: 100 requests/month
        Provides company enrichment data.
        """
        try:
            params = {
                "api_key": ABSTRACT_API_KEY,
                "company": company_name
            }
            
            response = await self.client.get(ABSTRACT_API_URL, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if data and data.get("name"):
                    matched_name = data.get("name", "")
                    confidence = self._calculate_name_similarity(company_name, matched_name)
                    
                    return APIVerificationResult(
                        company_name=company_name,
                        is_verified=confidence >= 0.7,
                        confidence=confidence,
                        source=VerificationSource.ABSTRACT_API,
                        jurisdiction=data.get("country"),
                        industry=data.get("industry"),
                        employee_count=data.get("employees"),
                        website=data.get("domain"),
                        raw_data=data
                    )
            
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.ABSTRACT_API,
                error="No results found"
            )
            
        except Exception as e:
            return APIVerificationResult(
                company_name=company_name,
                is_verified=False,
                confidence=0.0,
                source=VerificationSource.ABSTRACT_API,
                error=f"API error: {str(e)}"
            )
    
    def _calculate_name_similarity(self, query: str, result: str) -> float:
        """Calculate similarity between query and result company names."""
        if not query or not result:
            return 0.0
        
        query_lower = query.lower().strip()
        result_lower = result.lower().strip()
        
        # Exact match
        if query_lower == result_lower:
            return 1.0
        
        # Contains match
        if query_lower in result_lower or result_lower in query_lower:
            return 0.9
        
        # Try fuzzy matching if available
        try:
            from rapidfuzz import fuzz
            ratio = fuzz.ratio(query_lower, result_lower) / 100.0
            return ratio
        except ImportError:
            # Simple word overlap calculation
            query_words = set(query_lower.split())
            result_words = set(result_lower.split())
            if not query_words or not result_words:
                return 0.0
            overlap = len(query_words & result_words)
            return overlap / max(len(query_words), len(result_words))


# =============================================================================
# Convenience Functions
# =============================================================================

_api_instance: Optional[CompanyVerificationAPI] = None
_api_lock = threading.Lock()


def get_company_api() -> CompanyVerificationAPI:
    """Get or create the global CompanyVerificationAPI instance (thread-safe)."""
    global _api_instance
    if _api_instance is None:
        with _api_lock:
            # Double-checked locking to avoid race conditions
            if _api_instance is None:
                _api_instance = CompanyVerificationAPI()
    return _api_instance


def _cleanup_api_client():
    """Close the HTTP client on shutdown to prevent connection leaks."""
    global _api_instance
    if _api_instance is not None:
        try:
            # Run the async close in a new event loop since atexit may be called
            # outside of any async context
            asyncio.run(_api_instance.close())
        except Exception:
            pass  # Best effort cleanup


# Register cleanup handler
atexit.register(_cleanup_api_client)


async def verify_company_async(company_name: str, country: str = "") -> APIVerificationResult:
    """
    Async function to verify a company.
    
    Usage:
        result = await verify_company_async("Apple Inc", "us")
        if result.is_verified:
            print(f"Verified! Source: {result.source}")
    """
    api = get_company_api()
    return await api.verify_company(company_name, country)


def verify_company_sync(company_name: str, country: str = "") -> APIVerificationResult:
    """
    Synchronous wrapper for company verification.
    
    Usage:
        result = verify_company_sync("Apple Inc", "us")
    """
    return asyncio.run(verify_company_async(company_name, country))

