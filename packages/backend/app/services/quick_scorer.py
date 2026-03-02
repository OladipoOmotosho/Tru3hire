"""
Quick Scorer - Cached TrueScore for Batch Processing

Uses the canonical TrueScoreAggregator math model for consistency across all
surfaces, while keeping batch-level caching for performance.
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

from app.services.cache import (
    truescore_cache, 
    make_job_cache_key, 
    make_resume_hash,
    reputation_cache,
    make_company_key,
)



# Lazy-loaded cached components to avoid import overhead per call
_authenticity_scorer = None
_preprocess_text = None
_company_reputation_func = None
_tfidf_vectorizer_class = None
_cosine_similarity_func = None

def get_authenticity_scorer():
    global _authenticity_scorer
    if _authenticity_scorer is None:
        from app.services.authenticity import authenticity_scorer
        _authenticity_scorer = authenticity_scorer
    return _authenticity_scorer

def get_preprocess_text():
    global _preprocess_text
    if _preprocess_text is None:
        from app.ml.resume_matcher import preprocess_text
        _preprocess_text = preprocess_text
    return _preprocess_text

def get_company_reputation_func():
    global _company_reputation_func
    if _company_reputation_func is None:
        from app.services.reputation import calculate_company_reputation
        _company_reputation_func = calculate_company_reputation
    return _company_reputation_func

def get_sklearn_components():
    global _tfidf_vectorizer_class, _cosine_similarity_func
    if _tfidf_vectorizer_class is None:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        _tfidf_vectorizer_class = TfidfVectorizer
        _cosine_similarity_func = cosine_similarity
    return _tfidf_vectorizer_class, _cosine_similarity_func


@dataclass
class QuickScoreResult:
    """Lightweight score result for batch processing."""
    true_score: int
    risk_level: str
    breakdown: Dict[str, int]
    cached: bool = False
    
    def to_dict(self) -> dict:
        return {
            "true_score": self.true_score,
            "risk_level": self.risk_level,
            "breakdown": self.breakdown,
            "cached": self.cached,
        }


class QuickScorer:
    """
    Fast scoring for batch job processing.
    
    Optimized for speed:
    - Uses caching aggressively
    - Skips heavy market activity calls
    - Uses TF-IDF only (no embeddings) for resume matching
    """
    
    # Simplified weights for quick scoring
    WEIGHTS = {
        "authenticity": 0.40,      # Is this job real?
        "resume_match": 0.30,      # Does resume match? (TF-IDF only)
        "recency": 0.20,           # How fresh is the job?
        "reputation": 0.10,        # Company reputation (cached)
    }
    
    def score_job(
        self,
        job_id: str,
        job_text: str,
        company: str = "",
        days_ago: int = 7,
        resume_text: Optional[str] = None,
    ) -> QuickScoreResult:
        """
        Calculate quick TrueScore for a single job.
        
        Returns cached result if available.
        """
        # Check cache first
        resume_hash = make_resume_hash(resume_text or "")
        cache_key = make_job_cache_key(job_id, resume_hash)
        
        cached = truescore_cache.get(cache_key)
        if cached:
            return QuickScoreResult(
                true_score=cached["true_score"],
                risk_level=cached["risk_level"],
                breakdown=cached["breakdown"],
                cached=True,
            )
        
        # Canonical analysis (single source of truth for TrueScore math)
        from app.services.scorer import true_score_aggregator

        try:
            analysis = true_score_aggregator.analyze(
                job_text=job_text,
                resume_text=resume_text,
            )
            true_score = analysis.true_score
            risk_level = analysis.risk_level
            breakdown = {
                "authenticity": analysis.breakdown.authenticity,
                "hiring_activity": analysis.breakdown.hiring_activity,
                "hiring_likelihood": analysis.breakdown.hiring_activity,  # backwards-compatible alias for hiring_activity
                "resume_match": analysis.breakdown.resume_match,
                "company_reputation": analysis.breakdown.company_reputation,
                "recency": analysis.breakdown.recency,
            }
        except (ValueError, RuntimeError, TypeError, OSError, TimeoutError) as exc:
            logger.exception("Canonical TrueScore failed in quick scorer: %s", exc)
            # Conservative fallback if full analysis fails
            true_score = 70
            risk_level = "caution"
            breakdown = {
                "authenticity": 70,
                "hiring_activity": 60,
                "hiring_likelihood": 60,
                "resume_match": 60 if resume_text else 50,
                "company_reputation": 70,
                "recency": self._calculate_recency(days_ago),
            }
        
        # Cache result
        result_dict = {
            "true_score": true_score,
            "risk_level": risk_level,
            "breakdown": breakdown,
        }
        truescore_cache.set(cache_key, result_dict)
        
        return QuickScoreResult(
            true_score=true_score,
            risk_level=risk_level,
            breakdown=breakdown,
            cached=False,
        )
    
    def score_batch(
        self,
        jobs: List[Dict[str, Any]],
        resume_text: Optional[str] = None,
    ) -> Dict[str, QuickScoreResult]:
        """Score multiple jobs efficiently."""
        # Logger is available from module scope
        
        results = {}
        for idx, job in enumerate(jobs):
            job_id = job.get("id", "")
            
            # Handle missing/empty job IDs to prevent key collisions
            if not job_id:
                import uuid
                job_id = f"_fallback_{uuid.uuid4().hex}"
                logger.warning("Job at index %d missing ID, using unique fallback: %s", idx, job_id)
            
            job_text = self._build_job_text(job)
            company = job.get("company", "")
            days_ago = job.get("days_ago", 7)
            
            results[job_id] = self.score_job(
                job_id=job_id,
                job_text=job_text,
                company=company,
                days_ago=days_ago,
                resume_text=resume_text,
            )
        return results
    
    def _build_job_text(self, job: Dict[str, Any]) -> str:
        """Build job text from job dict."""
        parts = [
            job.get("title", ""),
            job.get("company", ""),
            job.get("location", ""),
            job.get("description", ""),
        ]
        return " ".join(filter(None, parts))
    
    def _calculate_authenticity(self, job_text: str) -> int:
        """Calculate authenticity using local ML model."""
        try:
            scorer = get_authenticity_scorer()
            result = scorer.analyze(job_text)
            return result.get("score", 70)
        except Exception:
            # logger.exception(f"Error calculating authenticity for job_text prefix: {job_text[:50]}...")
            return 70  # Neutral fallback
    
    def _calculate_resume_match(
        self, 
        job_text: str, 
        resume_text: Optional[str]
    ) -> int:
        """Calculate resume match using TF-IDF only (fast)."""
        if not resume_text or len(resume_text.strip()) < 50:
            return 50  # Neutral when no resume
        
        try:
            preprocess = get_preprocess_text()
            # Use local implementation to avoid dependency on resume_matcher for logic
            job_clean = preprocess(job_text)
            resume_clean = preprocess(resume_text)
            
            score, _ = self._calculate_tfidf_score(job_clean, resume_clean)
            return score
        except Exception:
            logger.exception("Error calculating resume match")
            return 50
            
    def _calculate_tfidf_score(self, job_clean: str, resume_clean: str) -> tuple:
        """
        Calculate TF-IDF based score. Returns (score, raw_similarity).
        Moved here to decouple from resume_matcher.
        """
        try:
            TfidfVectorizer, cosine_similarity = get_sklearn_components()
            
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words='english',
                min_df=1,
                max_df=1.0,
            )
        
            tfidf_matrix = vectorizer.fit_transform([job_clean, resume_clean])
            # Check shape to ensure we have features
            if tfidf_matrix.shape[1] == 0:
                return 50, 0.0
                
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            # Scale 0-1 to 35-100 (conservative range for TF-IDF)
            score = int(35 + (similarity * 65))
            return max(0, min(100, score)), similarity
        except Exception:
            logger.exception("Internal TF-IDF calculation failed")
            return 50, 0.0
    
    def _calculate_recency(self, days_ago: int) -> int:
        """Calculate recency score."""
        if days_ago <= 0:
            return 100
        if days_ago <= 3:
            return 90
        if days_ago <= 7:
            return 80
        if days_ago <= 14:
            return 65
        if days_ago <= 30:
            return 50
        return 35
    
    def _get_reputation(self, company: str) -> int:
        """Get company reputation with caching."""
        if not company:
            return 50
        
        cache_key = make_company_key(company)
        cached = reputation_cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            reputation_func = get_company_reputation_func()
            result = reputation_func(f"Company: {company}")
            score = result.get("score", 70)
            reputation_cache.set(cache_key, score)
            return score
        except Exception:
            logger.exception("Error getting reputation for company: %s", company)
            return 70


# Singleton instance
quick_scorer = QuickScorer()
