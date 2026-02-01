"""
Quick Scorer - Lightweight TrueScore for Batch Processing

Provides fast scoring without heavy operations:
- No external API calls (market activity made optional)
- Optional resume matching (skip embeddings if no resume)
- Caching integration

Use this for batch job scoring in /api/jobs/scores endpoint.
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
        
        # Calculate scores
        authenticity = self._calculate_authenticity(job_text)
        resume_match = self._calculate_resume_match(job_text, resume_text)
        recency = self._calculate_recency(days_ago)
        reputation = self._get_reputation(company)
        
        # Weighted score
        true_score = int(
            (authenticity * self.WEIGHTS["authenticity"]) +
            (resume_match * self.WEIGHTS["resume_match"]) +
            (recency * self.WEIGHTS["recency"]) +
            (reputation * self.WEIGHTS["reputation"])
        )
        true_score = max(0, min(100, true_score))
        
        # Risk level
        if true_score >= 70:
            risk_level = "safe"
        elif true_score >= 40:
            risk_level = "caution"
        else:
            risk_level = "danger"
        
        breakdown = {
            "authenticity": authenticity,
            "resume_match": resume_match,
            "recency": recency,
            "company_reputation": reputation,
            "hiring_activity": 50,  # Placeholder for quick mode
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
        import logging
        logger = logging.getLogger(__name__)
        
        results = {}
        for idx, job in enumerate(jobs):
            job_id = job.get("id", "")
            
            # Handle missing/empty job IDs to prevent key collisions
            if not job_id:
                import uuid
                job_id = f"_fallback_{uuid.uuid4().hex}"
                logger.warning(f"Job at index {idx} missing ID, using unique fallback: {job_id}")
            
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
            from app.services.authenticity import authenticity_scorer
            result = authenticity_scorer.analyze(job_text)
            return result.get("score", 70)
        except Exception:
            logger.exception(f"Error calculating authenticity for job_text prefix: {job_text[:50]}...")
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
            from app.ml.resume_matcher import preprocess_text
            # Use local implementation to avoid dependency on resume_matcher for logic
            job_clean = preprocess_text(job_text)
            resume_clean = preprocess_text(resume_text)
            
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
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            
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
            from app.services.reputation import calculate_company_reputation
            result = calculate_company_reputation(f"Company: {company}")
            score = result.get("score", 70)
            reputation_cache.set(cache_key, score)
            return score
        except Exception:
            logger.exception(f"Error getting reputation for company: {company}")
            return 70


# Singleton instance
quick_scorer = QuickScorer()
