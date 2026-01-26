"""
Resume-Job Matching Service using Hybrid Approach

This module provides smart resume-job matching using:
1. Skill extraction + weighted matching (required vs preferred)
2. Experience level comparison
3. Semantic embeddings (SentenceTransformers)
4. TF-IDF cosine similarity as fallback

Combined scores for accurate matching.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from typing import Optional, Dict, List


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

def calculate_resume_match(
    job_text: str, 
    resume_text: Optional[str],
    user_skills: Optional[List[str]] = None,
    user_experience_years: Optional[int] = None
) -> Dict:
    """
    Calculate resume-job match using hybrid approach.
    
    ENHANCED with:
    - Skill extraction + weighted matching (40%)
    - Semantic embeddings (40%)
    - TF-IDF keyword matching (20%)
    - Experience level comparison (built into skill score)
    
    Args:
        job_text: The job description text
        resume_text: The resume/CV text (optional)
        user_skills: List of user's known skills (optional)
        user_experience_years: Years of experience from profile (optional)
        
    Returns:
        dict with score, similarity, matched_terms, skill_details, method
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return {
            "score": 50,
            "similarity": 0.0,
            "matched_terms": [],
            "method": "none",
            "message": "No resume provided - upload for personalized matching",
            "skill_match": None,
            "experience_match": None
        }
    
    # Preprocess both texts
    job_clean = preprocess_text(job_text)
    resume_clean = preprocess_text(resume_text)
    
    # ==========================================================================
    # 1. SKILL MATCHING (40% weight)
    # ==========================================================================
    skill_score = 60  # Default neutral
    skill_result = None
    experience_info = None
    
    try:
        from app.ml.skill_matcher import calculate_skill_match, get_skill_display_name
        skill_result = calculate_skill_match(
            job_text=job_text,
            resume_text=resume_text,
            user_skills=user_skills,
            user_experience_years=user_experience_years
        )
        skill_score = skill_result.score
        experience_info = {
            "years_required": skill_result.experience_match.years_required,
            "years_candidate": skill_result.experience_match.years_candidate,
            "level_job": skill_result.experience_match.level_job,
            "level_candidate": skill_result.experience_match.level_candidate,
            "match_score": skill_result.experience_match.match_score
        }
    except Exception as e:
        print(f"Skill matching failed: {e}")
    
    # ==========================================================================
    # 2. EMBEDDING SIMILARITY (35% weight)
    # ==========================================================================
    embedding_score, embedding_source = _calculate_embedding_score(job_text, resume_text)
    if embedding_score is None:
        embedding_score = 60  # Neutral fallback
        embedding_source = "none"
    
    # ==========================================================================
    # 3. COMBINE SCORES (TF-IDF removed - embeddings handle semantic matching)
    # ==========================================================================
    # Weighted combination: 65% skill match, 35% embedding
    base_score = int(
        (skill_score * 0.65) +
        (embedding_score * 0.35)
    )
    
    # ==========================================================================
    # 4. APPLY BONUSES
    # ==========================================================================
    bonus = 0
    bonus_reasons = []
    
    if skill_result:
        # Bonus for matching ALL required skills
        breakdown = skill_result.detailed_breakdown
        if breakdown.get("required_total", 0) > 0:
            if breakdown.get("required_matched") == breakdown.get("required_total"):
                bonus += 5
                bonus_reasons.append("100% required skills")
        
        # Bonus for having many additional skills
        if breakdown.get("bonus_skills_count", 0) >= 10:
            bonus += 3
            bonus_reasons.append("10+ bonus skills")
        elif breakdown.get("bonus_skills_count", 0) >= 5:
            bonus += 2
            bonus_reasons.append("5+ bonus skills")
    
    final_score = base_score + bonus
    
    # Ensure bounds
    final_score = max(0, min(100, final_score))
    
    # Determine method string
    method = f"skill_embed_{embedding_source}"
    
    # Get matching terms for display (still useful for UI)
    matched_terms = _get_matching_terms(job_clean, resume_clean)
    
    # Build skill match details if available
    skill_match_details = None
    if skill_result:
        from app.ml.skill_matcher import get_skill_display_name
        skill_match_details = {
            "matched": [get_skill_display_name(s) for s in skill_result.matched_skills],
            "missing_required": [get_skill_display_name(s) for s in skill_result.missing_required],
            "missing_preferred": [get_skill_display_name(s) for s in skill_result.missing_preferred],
            "bonus_skills": [get_skill_display_name(s) for s in skill_result.bonus_skills],
            "breakdown": skill_result.detailed_breakdown
        }
    
    return {
        "score": final_score,
        "base_score": base_score,
        "bonus": bonus,
        "bonus_reasons": bonus_reasons,
        "matched_terms": matched_terms[:10],
        "method": method,
        "embedding_score": embedding_score,
        "embedding_source": embedding_source,
        "skill_score": skill_score,
        "skill_match": skill_match_details,
        "experience_match": experience_info,
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
        # Use cached version for better performance in batch searches
        from app.ml.embeddings import calculate_similarity_with_cached_resume
        similarity, source = calculate_similarity_with_cached_resume(job_text, resume_text)
        
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

