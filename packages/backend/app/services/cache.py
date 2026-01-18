"""
Caching Service for TrueScore and API Results

Provides in-memory caching with TTL for:
- TrueScore results (keyed by job ID + resume hash)
- Market activity results
- Company reputation lookups

This dramatically improves performance for batch job scoring.
"""

import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, TypeVar, Generic
from dataclasses import dataclass, field

T = TypeVar('T')


@dataclass
class CacheEntry(Generic[T]):
    """A cached value with expiration."""
    value: T
    expires_at: datetime
    
    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at


class TTLCache(Generic[T]):
    """
    Thread-safe in-memory cache with time-to-live expiration.
    
    Features:
    - Automatic expiration of old entries
    - Max size limit with LRU eviction
    - Thread-safe with Lock protection
    """
    
    def __init__(self, ttl_minutes: int = 60, max_size: int = 1000):
        import threading
        self._cache: Dict[str, CacheEntry[T]] = {}
        self._ttl = timedelta(minutes=ttl_minutes)
        self._max_size = max_size
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[T]:
        """Get value if exists and not expired (thread-safe)."""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            if entry.is_expired:
                del self._cache[key]
                return None
            return entry.value
    
    def set(self, key: str, value: T) -> None:
        """Set value with TTL expiration (thread-safe)."""
        with self._lock:
            # Evict oldest entries if at max size
            if len(self._cache) >= self._max_size:
                self._evict_oldest_unlocked(self._max_size // 4)
            
            self._cache[key] = CacheEntry(
                value=value,
                expires_at=datetime.now() + self._ttl
            )
    
    def _evict_oldest_unlocked(self, count: int) -> None:
        """Remove oldest entries (must hold lock)."""
        sorted_keys = sorted(
            self._cache.keys(),
            key=lambda k: self._cache[k].expires_at
        )
        for key in sorted_keys[:count]:
            del self._cache[key]
    
    def clear(self) -> None:
        """Clear all cached entries (thread-safe)."""
        with self._lock:
            self._cache.clear()
    
    def __len__(self) -> int:
        with self._lock:
            return len(self._cache)


# =============================================================================
# Global Cache Instances
# =============================================================================

# TrueScore cache: job_id + resume_hash -> score result
truescore_cache = TTLCache[Dict[str, Any]](ttl_minutes=30, max_size=2000)

# Market activity cache: company + title -> activity result
market_cache = TTLCache[Dict[str, Any]](ttl_minutes=60, max_size=1000)

# Company reputation cache: company_name -> reputation score
reputation_cache = TTLCache[int](ttl_minutes=120, max_size=500)


# =============================================================================
# Cache Key Helpers
# =============================================================================

def make_job_cache_key(job_id: str, resume_hash: str = "") -> str:
    """Generate cache key for job TrueScore."""
    return f"job:{job_id}:{resume_hash[:16]}"


def make_resume_hash(resume_text: str) -> str:
    """Generate short hash of resume for cache keys."""
    if not resume_text:
        return "no_resume"
    return hashlib.md5(resume_text.encode()).hexdigest()[:16]


def make_market_key(company: str, title: str) -> str:
    """Generate cache key for market activity."""
    company_clean = (company or "").lower().strip()[:50]
    title_clean = (title or "").lower().strip()[:50]
    return f"market:{company_clean}:{title_clean}"


def make_company_key(company_name: str) -> str:
    """Generate cache key for company reputation."""
    return f"company:{(company_name or '').lower().strip()[:50]}"


# =============================================================================
# Cache Stats (for monitoring)
# =============================================================================

def get_cache_stats() -> Dict[str, Any]:
    """Get current cache statistics."""
    return {
        "truescore_cache_size": len(truescore_cache),
        "market_cache_size": len(market_cache),
        "reputation_cache_size": len(reputation_cache),
    }
