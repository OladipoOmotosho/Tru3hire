"""
Embeddings Service for Semantic Resume-Job Matching

Provides semantic embedding capabilities with:
- Primary: Google Gemini text-embedding-004 (free tier: 1500 RPM)
- Fallback: SentenceTransformers all-MiniLM-L6-v2 (100% local, free)

The hybrid approach gives both speed and accuracy.
"""

import os
from typing import List, Optional, Tuple
import numpy as np

# Optional imports - gracefully handle missing packages
_gemini_available = False
_sentence_transformers_available = False

try:
    import google.generativeai as genai
    _gemini_available = True
except ImportError:
    pass

try:
    from sentence_transformers import SentenceTransformer
    _sentence_transformers_available = True
except ImportError:
    pass


# =============================================================================
# Configuration
# =============================================================================

GEMINI_MODEL = "models/text-embedding-004"
SENTENCE_TRANSFORMER_MODEL = "all-MiniLM-L6-v2"

# Lazy-loaded model cache
_sentence_transformer_model = None


def _get_sentence_transformer():
    """Lazy load SentenceTransformer model to avoid slow startup."""
    global _sentence_transformer_model
    if _sentence_transformer_model is None and _sentence_transformers_available:
        _sentence_transformer_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
    return _sentence_transformer_model


# =============================================================================
# Embedding Functions
# =============================================================================

def get_gemini_embedding(text: str) -> Optional[List[float]]:
    """
    Get embedding using Google Gemini API.
    
    Returns None if API key not configured or request fails.
    """
    if not _gemini_available:
        return None
    
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    
    try:
        genai.configure(api_key=api_key)
        result = genai.embed_content(
            model=GEMINI_MODEL,
            content=text[:8000],  # Truncate for API limits
        )
        return result['embedding']
    except Exception as e:
        print(f"Gemini embedding failed: {e}")
        return None


def get_local_embedding(text: str) -> Optional[List[float]]:
    """
    Get embedding using local SentenceTransformers.
    
    Returns None if package not installed.
    """
    model = _get_sentence_transformer()
    if model is None:
        return None
    
    try:
        embedding = model.encode(text[:8000], convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        print(f"SentenceTransformer embedding failed: {e}")
        return None


def get_embedding(text: str, prefer_gemini: bool = True) -> Tuple[Optional[List[float]], str]:
    """
    Get embedding with automatic fallback.
    
    Args:
        text: Text to embed
        prefer_gemini: If True, try Gemini first, then local
        
    Returns:
        Tuple of (embedding vector, source) where source is 
        'gemini', 'local', or 'none'
    """
    if prefer_gemini:
        # Try Gemini first
        embedding = get_gemini_embedding(text)
        if embedding is not None:
            return embedding, "gemini"
        
        # Fall back to local
        embedding = get_local_embedding(text)
        if embedding is not None:
            return embedding, "local"
    else:
        # Try local first
        embedding = get_local_embedding(text)
        if embedding is not None:
            return embedding, "local"
        
        # Fall back to Gemini
        embedding = get_gemini_embedding(text)
        if embedding is not None:
            return embedding, "gemini"
    
    return None, "none"


# =============================================================================
# Similarity Calculation
# =============================================================================

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    return float(dot_product / (norm_a * norm_b))


def calculate_semantic_similarity(
    text1: str, 
    text2: str,
    prefer_gemini: bool = True
) -> Tuple[float, str]:
    """
    Calculate semantic similarity between two texts using embeddings.
    
    Args:
        text1: First text (e.g., job description)
        text2: Second text (e.g., resume)
        prefer_gemini: Whether to prefer Gemini API over local
        
    Returns:
        Tuple of (similarity score 0-1, embedding source)
    """
    emb1, source1 = get_embedding(text1, prefer_gemini)
    if emb1 is None:
        return 0.0, "none"
    
    emb2, source2 = get_embedding(text2, prefer_gemini)
    if emb2 is None:
        return 0.0, "none"
    
    # Both embeddings must come from same source for valid comparison
    if source1 != source2:
        # Re-embed with same source
        if source1 == "gemini":
            emb2 = get_gemini_embedding(text2)
        else:
            emb2 = get_local_embedding(text2)
        
        if emb2 is None:
            return 0.0, "none"
    
    similarity = cosine_similarity(emb1, emb2)
    return similarity, source1


# =============================================================================
# Availability Check
# =============================================================================

def get_embedding_status() -> dict:
    """
    Get status of available embedding providers.
    
    Useful for debugging and UI display.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    return {
        "gemini_available": _gemini_available and bool(gemini_key),
        "gemini_package_installed": _gemini_available,
        "gemini_api_key_set": bool(gemini_key),
        "local_available": _sentence_transformers_available,
        "local_model": SENTENCE_TRANSFORMER_MODEL if _sentence_transformers_available else None,
        "preferred_provider": "gemini" if (gemini_key and _gemini_available) else (
            "local" if _sentence_transformers_available else "none"
        ),
    }
