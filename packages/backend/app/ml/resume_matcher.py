"""
Resume-Job Matching Service using TF-IDF Cosine Similarity

This module provides smart resume-job matching using TF-IDF vectorization
and cosine similarity, which is much more accurate than simple keyword overlap.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from typing import Optional, Dict


# =============================================================================
# Text Preprocessing
# =============================================================================

def preprocess_text(text: str) -> str:
    """
    Clean and preprocess text for TF-IDF.
    """
    # Lowercase
    text = text.lower()
    
    # Remove special characters but keep spaces
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


# =============================================================================
# TF-IDF Resume Matcher
# =============================================================================

def calculate_resume_match(job_text: str, resume_text: Optional[str]) -> Dict:
    """
    Calculate TF-IDF cosine similarity between job and resume.
    
    Uses TF-IDF vectorization which is more sophisticated than keyword overlap:
    1. TF-IDF weighs rare/important terms higher
    2. Cosine similarity measures directional similarity
    3. Handles variations in text length better
    
    Args:
        job_text: The job description text
        resume_text: The resume/CV text (optional)
        
    Returns:
        dict with:
            - score: int (0-100)
            - similarity: float (raw cosine similarity)
            - matched_terms: list of important matching terms
            - method: "tfidf" or "none"
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return {
            "score": 50,
            "similarity": 0.0,
            "matched_terms": [],
            "method": "none",
            "message": "No resume provided - upload for personalized matching"
        }
    
    # Preprocess both texts
    job_clean = preprocess_text(job_text)
    resume_clean = preprocess_text(resume_text)
    
    # Create TF-IDF Vectorizer (fresh for each comparison)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),      # Unigrams and bigrams
        stop_words='english',    # Remove common words
        min_df=1,                # Keep all terms
        max_df=1.0,              # Keep all terms
    )
    
    try:
        # Fit and transform both texts together
        tfidf_matrix = vectorizer.fit_transform([job_clean, resume_clean])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except ValueError:
        # Empty or invalid text
        return {
            "score": 50,
            "similarity": 0.0,
            "matched_terms": [],
            "method": "tfidf_error"
        }
    
    # Convert to 0-100 score
    # Cosine similarity ranges 0-1, we scale it:
    # 0.0 similarity = 35 score (not completely unrelated)
    # 0.3 similarity = 60 score (some match)
    # 0.6 similarity = 80 score (good match)
    # 1.0 similarity = 100 score (perfect match)
    score = int(35 + (similarity * 65))
    score = max(0, min(100, score))
    
    # Get top matching terms
    matched_terms = _get_matching_terms(job_clean, resume_clean)
    
    return {
        "score": score,
        "similarity": round(float(similarity), 4),
        "matched_terms": matched_terms[:10],  # Top 10
        "method": "tfidf"
    }


def _get_matching_terms(job_text: str, resume_text: str) -> list:
    """Find the most important matching terms."""
    job_words = set(job_text.split())
    resume_words = set(resume_text.split())
    
    # Common meaningful words (exclude very short words)
    matching = [w for w in (job_words & resume_words) if len(w) > 3]
    
    # Sort by length (longer = more specific = more valuable)
    matching.sort(key=len, reverse=True)
    
    return matching
