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
    Calculate resume-job match using hybrid TF-IDF + Semantic Embeddings.
    
    Hybrid approach:
    - TF-IDF (30%): Fast, catches exact keyword matches
    - Embeddings (70%): Semantic understanding ("JS" = "JavaScript")
    
    Falls back to TF-IDF only if embeddings unavailable.
    
    Args:
        job_text: The job description text
        resume_text: The resume/CV text (optional)
        
    Returns:
        dict with score, similarity, matched_terms, method
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
    
    # Calculate TF-IDF similarity
    tfidf_score, tfidf_similarity = _calculate_tfidf_score(job_clean, resume_clean)
    
    # Calculate semantic embedding similarity
    embedding_score, embedding_source = _calculate_embedding_score(job_text, resume_text)
    
    # Hybrid scoring
    if embedding_score is not None:
        # Weighted combination: 70% embedding + 30% TF-IDF
        final_score = int((embedding_score * 0.7) + (tfidf_score * 0.3))
        method = f"hybrid_tfidf_{embedding_source}"
    else:
        # Fallback to TF-IDF only
        final_score = tfidf_score
        method = "tfidf_only"
    
    # Ensure bounds
    final_score = max(0, min(100, final_score))
    
    # Get matching terms for display
    matched_terms = _get_matching_terms(job_clean, resume_clean)
    
    return {
        "score": final_score,
        "similarity": round(float(tfidf_similarity), 4),
        "matched_terms": matched_terms[:10],
        "method": method,
        "tfidf_score": tfidf_score,
        "embedding_score": embedding_score,
        "embedding_source": embedding_source,
    }


def _calculate_tfidf_score(job_clean: str, resume_clean: str) -> tuple:
    """Calculate TF-IDF based score. Returns (score, raw_similarity)."""
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words='english',
        min_df=1,
        max_df=1.0,
    )
    
    try:
        tfidf_matrix = vectorizer.fit_transform([job_clean, resume_clean])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        score = int(35 + (similarity * 65))
        return max(0, min(100, score)), similarity
    except ValueError:
        return 50, 0.0


def _calculate_embedding_score(job_text: str, resume_text: str) -> tuple:
    """
    Calculate semantic embedding score.
    Returns (score, source) where source is 'gemini', 'local', or None if unavailable.
    """
    try:
        from app.ml.embeddings import calculate_semantic_similarity
        similarity, source = calculate_semantic_similarity(job_text, resume_text)
        
        if source == "none":
            return None, None
        
        # Convert similarity (0-1) to score (0-100)
        # Embedding similarities tend to be higher, so we use a different scale
        # 0.3 similarity = 45 (poor match)
        # 0.6 similarity = 70 (good match)
        # 0.9 similarity = 95 (excellent match)
        score = int(30 + (similarity * 70))
        return max(0, min(100, score)), source
    except Exception as e:
        print(f"Embedding calculation failed: {e}")
        return None, None


def _get_matching_terms(job_text: str, resume_text: str) -> list:
    """Find the most important matching terms."""
    job_words = set(job_text.split())
    resume_words = set(resume_text.split())
    
    # Common meaningful words (exclude very short words)
    matching = [w for w in (job_words & resume_words) if len(w) > 3]
    
    # Sort by length (longer = more specific = more valuable)
    matching.sort(key=len, reverse=True)
    
    return matching


def _calculate_skill_boost(job_text: str, resume_text: str) -> int:
    """
    Calculate bonus score based on matching technical skills and domain keywords.
    This helps with general job descriptions where TF-IDF might miss semantic matches.
    
    Uses semantic grouping to recognize that:
    - Pandas/NumPy are data manipulation tools (relevant to ETL, data cleaning)
    - SQL is a database skill
    - Scikit-Learn/TensorFlow are machine learning
    - Jupyter/Anaconda are data science tools
    """
    job_lower = job_text.lower()
    resume_lower = resume_text.lower()
    
    boost = 0
    
    # Define skill categories with synonyms/related terms
    # Including libraries and tools that are semantically related
    skill_categories = {
        # Data Extraction & Transformation
        'etl': [
            'etl', 'extract transform load', 'data pipeline', 'data integration',
            'pandas', 'numpy', 'apache spark', 'spark', 'hadoop', 'hive',
            'sourcing and preparing data', 'extract', 'transform'
        ],
        
        # Data Quality & Cleaning
        'data_quality': [
            'data quality', 'data cleaning', 'data validation', 'data governance',
            'pandas', 'numpy', 'ensure data quality', 'improving data quality'
        ],
        
        # Data Analysis
        'data_analysis': [
            'data analysis', 'data analytics', 'analyzing data', 'analyze data', 'analytical',
            'pandas', 'numpy', 'matplotlib', 'seaborn', 'historical data'
        ],
        
        # Reporting & Dashboards
        'reporting': [
            'reporting', 'reports', 'dashboards', 'kpi', 'metrics', 'business intelligence',
            'power bi', 'tableau', 'powerbi', 'data viz', 'visualization'
        ],
        
        # Database & SQL
        'databases': [
            'sql', 'mysql', 'postgresql', 'database', 'data warehouse',
            'hive', 'spark sql', 'nosql'
        ],
        
        # Python & Data Science Tools
        'python': [
            'python', 'jupyter notebook', 'jupyter', 'anaconda', 'scikit-learn',
            'scikit', 'sklearn', 'machine learning automation', 'automation'
        ],
        
        # Machine Learning & AI
        'machine_learning': [
            'machine learning', 'ml', 'data science', 'predictive model', 'ai',
            'scikit-learn', 'sklearn', 'tensorflow', 'keras', 'pytorch',
            'developing models', 'workflows for'
        ],
    }
    
    matched_categories = 0
    for category, terms in skill_categories.items():
        job_has = any(term in job_lower for term in terms)
        resume_has = any(term in resume_lower for term in terms)
        
        if job_has and resume_has:
            matched_categories += 1
    
    # Give up to 20 bonus points based on skill category matches
    # More generous boosting for data-heavy roles
    if matched_categories >= 6:
        boost = 20
    elif matched_categories >= 5:
        boost = 18
    elif matched_categories >= 4:
        boost = 15
    elif matched_categories >= 3:
        boost = 12
    elif matched_categories >= 2:
        boost = 8
    elif matched_categories >= 1:
        boost = 4
    
    return boost

