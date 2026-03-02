"""
Embedding Service for Search Pipeline

Wraps the existing app.ml.embeddings module with HiringCafe-style
LRU caching for the search pipeline. Provides:

- Cached query embedding (avoid re-embedding the same query)
- Cached job embedding (avoid re-embedding the same job text)
- Batch similarity computation
- Token/cost tracking
"""

from __future__ import annotations

import logging
import hashlib
from functools import lru_cache
from typing import List, Optional, Tuple

import numpy as np

from app.services.search_constants import EMBEDDING_CACHE_SIZE

logger = logging.getLogger(__name__)


# =============================================================================
# Low-level embedding with LRU cache
# =============================================================================

@lru_cache(maxsize=EMBEDDING_CACHE_SIZE)
def _embed_text_cached(text_hash: str, text: str) -> Tuple[Tuple[float, ...], str]:
    """Embed text and cache the result.

    The text_hash param forces cache keying by content hash (lru_cache
    requires hashable args). Returns tuple form for hashability.

    Args:
        text_hash: MD5 hash of text (for cache key).
        text: Text to embed.

    Returns:
        (embedding_tuple, source) — source is 'gemini', 'local', or 'none'.
    """
    from app.ml.embeddings import get_embedding

    embedding, source = get_embedding(text, prefer_gemini=True)
    if embedding is None:
        return tuple(), "none"
    return tuple(embedding), source


# =============================================================================
# Public API
# =============================================================================

def embed_text(text: str) -> Tuple[Optional[np.ndarray], str]:
    """Embed a text string, returning a vector and source.

    Uses LRU caching so repeated identical texts cost zero additional
    API calls — key pattern borrowed from HiringCafe's _embed_query_cached.

    Args:
        text: Text to embed (query or job text).

    Returns:
        (vector, source) — vector is None when no embedding provider available.
    """
    text_hash = hashlib.md5(text.encode()).hexdigest()

    cache_before = _embed_text_cached.cache_info()
    values, source = _embed_text_cached(text_hash, text)
    cache_after = _embed_text_cached.cache_info()

    is_cache_hit = cache_after.hits > cache_before.hits
    if is_cache_hit:
        logger.debug("Embedding cache hit for text_hash=%s", text_hash[:8])

    if not values:
        return None, "none"

    vector = np.array(values, dtype=np.float32)
    # L2 normalise for cosine similarity
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector, source


def cosine_similarity(vec1: Optional[np.ndarray], vec2: Optional[np.ndarray]) -> float:
    """Compute cosine similarity between two L2-normalised vectors.
    
    Returns 0.0 if either vector is None.
    """
    if vec1 is None or vec2 is None:
        return 0.0
    dot = float(np.dot(vec1, vec2))
    return max(0.0, min(1.0, dot))  # Clamp to [0, 1]


def batch_similarity(
    query_vector: np.ndarray,
    job_texts: List[str],
) -> List[Tuple[float, str]]:
    """Compute similarity between a query vector and multiple job texts.

    Embeds each job text (with caching) and computes cosine similarity.

    Args:
        query_vector: The pre-computed query embedding.
        job_texts: List of job text strings to compare against.

    Returns:
        List of (similarity, source) tuples, one per job text.
    """
    results = []
    for text in job_texts:
        job_vector, source = embed_text(text)
        if job_vector is not None and query_vector is not None:
            # Ensure same dimensionality
            if len(job_vector) == len(query_vector):
                sim = cosine_similarity(query_vector, job_vector)
            else:
                logger.warning(
                    "Dimension mismatch: query=%d job=%d, falling back to 0",
                    len(query_vector), len(job_vector),
                )
                sim = 0.0
        else:
            sim = 0.0
            source = "none"
        results.append((sim, source))
    return results


def get_cache_stats() -> dict:
    """Return embedding cache statistics."""
    info = _embed_text_cached.cache_info()
    return {
        "hits": info.hits,
        "misses": info.misses,
        "maxsize": info.maxsize,
        "currsize": info.currsize,
    }


def clear_cache() -> None:
    """Clear the embedding cache."""
    _embed_text_cached.cache_clear()
