"""
TrueScore Aggregator Service

Combines all 5 scoring dimensions into a single TrueScore.

Base weights:
- Resume Match: 30%
- Recency: 15%
- Authenticity: 25%
- Hiring Activity: 20%
- Company Reputation: 10%

If no resume is provided, weights are re-normalized across available
dimensions instead of injecting a synthetic neutral score.
"""

import re
import logging
from typing import Optional, List, Dict, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from app.services.authenticity import authenticity_scorer
from app.services.resume_parser import TECH_SKILLS
from app.services.market_activity import check_market_activity_sync, MarketActivityResult


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ScoreBreakdown:
    """Breakdown of all TrueScore dimensions."""
    authenticity: int
    hiring_activity: int  # Renamed from hiring_likelihood - now uses real market data
    resume_match: int
    company_reputation: int
    recency: int = 75  # Default for jobs without date info
    preference_match: int = 75  # Default when no preferences set
    
    # Market activity metadata (for display)
    company_job_count: int = 0  # Jobs from this company on job boards
    similar_title_count: int = 0  # Similar job titles in market
    market_data_source: str = "fallback"  # "adzuna" or "fallback"
    
    # Legacy alias for backwards compatibility
    @property
    def hiring_likelihood(self) -> int:
        """Legacy alias for hiring_activity."""
        return self.hiring_activity
    
    def to_dict(self) -> dict:
        return {
            "authenticity": self.authenticity,
            "hiring_activity": self.hiring_activity,
            "hiring_likelihood": self.hiring_activity,  # Keep for backwards compatibility
            "resume_match": self.resume_match,
            "company_reputation": self.company_reputation,
            "recency": self.recency,
            "preference_match": self.preference_match,
            "company_job_count": self.company_job_count,
            "similar_title_count": self.similar_title_count,
            "market_data_source": self.market_data_source,
        }


@dataclass
class SkillsGapResult:
    """Skills gap analysis result."""
    matching_skills: List[str] = field(default_factory=list)
    missing_skills: List[str] = field(default_factory=list)
    extra_skills: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "matching_skills": self.matching_skills,
            "missing_skills": self.missing_skills,
            "extra_skills": self.extra_skills,
        }


@dataclass
class Insight:
    """A single insight from analysis."""
    type: str  # 'warning', 'positive', 'tip'
    icon: str
    message: str
    
    def to_dict(self) -> dict:
        return {"type": self.type, "icon": self.icon, "message": self.message}


@dataclass 
class Recommendation:
    """An action recommendation."""
    action: str
    impact: str  # 'high', 'medium', 'low'
    
    def to_dict(self) -> dict:
        return {"action": self.action, "impact": self.impact}


@dataclass
class AnalysisResult:
    """Complete analysis result."""
    true_score: int
    risk_level: str
    breakdown: ScoreBreakdown
    insights: List[Insight]
    recommendations: List[Recommendation]
    skills_gap: Optional[SkillsGapResult] = None
    detected_job_type: str = "unknown"
    detected_employment_type: str = "unknown"
    interview_probability: Optional[int] = None  # 0-100 probability of getting interview
    interview_recommendation: Optional[str] = None  # "apply_now", "skip", "tailor_resume"
    
    # Phase 3: Eligibility
    eligibility_score: Optional[int] = None
    eligibility_badges: List[str] = field(default_factory=list)

    # P1: Labor market friction signals — reasons this posting may waste time
    friction_signals: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        result = {
            "true_score": self.true_score,
            "risk_level": self.risk_level,
            "breakdown": self.breakdown.to_dict(),
            "insights": [i.to_dict() for i in self.insights],
            "recommendations": [r.to_dict() for r in self.recommendations],
            "detected_job_type": self.detected_job_type,
            "detected_employment_type": self.detected_employment_type,
            "interview_probability": self.interview_probability,
            "interview_recommendation": self.interview_recommendation,
            "eligibility_score": self.eligibility_score,
            "eligibility_badges": self.eligibility_badges,
            "friction_signals": self.friction_signals,
        }
        if self.skills_gap:
            result["skills_gap"] = self.skills_gap.to_dict()
        return result


# =============================================================================
# TrueScoreAggregator Class
# =============================================================================

class TrueScoreAggregator:
    """
    Main orchestrator that runs all scoring services and combines them.
    """
    
    # Scoring weights (must sum to 1.0)
    # Priority: Resume Match > Recency > Authenticity > Hiring Activity > Reputation
    # Recency is now weighted because applying early = 8x higher response rate
    WEIGHTS = {
        "resume_match": 0.30,       # Primary value: Does this job fit the user?
        "recency": 0.15,            # CRITICAL: Fresh jobs get 8x more responses
        "authenticity": 0.25,       # Important: Is this job real?
        "hiring_activity": 0.20,    # Is company actively hiring?
        "company_reputation": 0.10, # Tie-breaker: What do employees say?
    }

    def _effective_weights(self, has_resume: bool) -> Dict[str, float]:
        """
        Return normalized TrueScore weights for available dimensions.

        If resume data is missing, resume_match is removed and remaining
        dimensions are proportionally normalized.
        """
        weights = dict(self.WEIGHTS)

        if not has_resume:
            weights.pop("resume_match", None)

        total = sum(weights.values())
        if total <= 0:
            return {
                "authenticity": 0.34,
                "hiring_activity": 0.33,
                "company_reputation": 0.16,
                "recency": 0.17,
            }

        return {k: v / total for k, v in weights.items()}

    def calculate_true_score(
        self,
        *,
        authenticity: int,
        hiring_activity: int,
        resume_match: int,
        company_reputation: int,
        recency: int,
        has_resume: bool,
    ) -> int:
        """Calculate canonical TrueScore with normalized weights."""
        clamped = {
            "authenticity": max(0, min(100, int(authenticity))),
            "hiring_activity": max(0, min(100, int(hiring_activity))),
            "resume_match": max(0, min(100, int(resume_match))),
            "company_reputation": max(0, min(100, int(company_reputation))),
            "recency": max(0, min(100, int(recency))),
        }

        effective = self._effective_weights(has_resume=has_resume)
        total = 0.0
        for metric, weight in effective.items():
            total += clamped[metric] * weight

        return max(0, min(100, int(round(total))))
    
    def analyze(
        self,
        job_text: str,
        resume_text: Optional[str] = None,
        job_url: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, str]] = None,
        # Phase 3: Needed for Eligibility
        job_title: str = "", 
        job_location: str = "",
        user_location: str = "",
    ) -> AnalysisResult:
        """
        Run full TrueScore analysis on a job posting.
        
        Args:
            job_text: The job description text
            resume_text: Optional resume text for matching
            job_url: Optional URL for additional verification
            user_skills: Optional list of user's skills for gap analysis
            user_preferences: Optional dict with 'job_type' and 'employment_type' preferences
            
        Returns:
            AnalysisResult with score, breakdown, insights, and recommendations
        """
        
        # =================================================================
        # 1. Authenticity Score (Real vs Fake detection)
        # =================================================================
        auth_result = authenticity_scorer.analyze(job_text)
        authenticity = auth_result["score"]
        
        # =================================================================
        # 2. Resume Match
        # =================================================================
        has_resume = resume_text and len(resume_text.strip()) >= 50
        resume_match = self._calculate_resume_match(job_text, resume_text)
        
        # =================================================================
        # 3. Hiring Activity = Real market data from job boards
        # Queries Adzuna API to check company's actual hiring activity
        # =================================================================
        market_activity = check_market_activity_sync(job_text)
        hiring_activity = market_activity.hiring_activity_score
        
        # =================================================================
        # 4. Company Reputation
        # =================================================================
        company_reputation = self._calculate_reputation(job_text)
        
        # =================================================================
        # 5. Recency Score (NEW)
        # =================================================================
        days_ago = self._extract_posted_date(job_text)
        recency = self._calculate_recency_score(days_ago)
        
        # =================================================================
        # 6. Preference Match Score (NEW)
        # =================================================================
        job_type = self._extract_job_type(job_text)
        employment_type = self._extract_employment_type(job_text)
        preference_match = self._calculate_preference_match(
            job_type, employment_type, user_preferences or {}
        )
        
        # =================================================================
        # 7. Skills Gap Analysis (NEW - not scored, just visual)
        # =================================================================
        skills_gap = self._analyze_skills_gap(job_text, user_skills or [])
        
        # =================================================================
        # Calculate Weighted TrueScore (now includes recency!)
        # =================================================================
        true_score = self.calculate_true_score(
            authenticity=authenticity,
            hiring_activity=hiring_activity,
            resume_match=resume_match,
            company_reputation=company_reputation,
            recency=recency,
            has_resume=bool(has_resume),
        )
        
        # Determine risk level
        if true_score >= 70:
            risk_level = "safe"
        elif true_score >= 40:
            risk_level = "caution"
        else:
            risk_level = "danger"
        
        # =================================================================
        # Generate Insights
        # =================================================================
        insights = self._generate_insights(
            auth_result, authenticity, resume_match, has_resume,
            recency, preference_match, job_type, employment_type, user_preferences
        )
        
        # =================================================================
        # Generate Recommendations
        # =================================================================
        recommendations = self._generate_recommendations(
            authenticity, resume_match, has_resume, skills_gap
        )
        
        # =================================================================
        # 8. Interview Probability Score (Phase 3)
        # Uses feedback data + recency + resume match for prediction
        # =================================================================
        interview_probability, interview_recommendation = self._calculate_interview_probability(
            resume_match=resume_match,
            recency=recency,
            authenticity=authenticity,
            job_text=job_text,
            days_ago=days_ago,
        )
        
        # =================================================================
        # 9. Eligibility Score (Phase 3)
        # =================================================================
        eligibility_score = None
        eligibility_badges = []
        
        if job_title and resume_text:
            try:
                from app.services.eligibility_calculator import eligibility_calculator as _ec
                elig_result = _ec.calculate(
                    job_title=job_title,
                    job_location=job_location,
                    job_text=job_text,
                    resume_text=resume_text,
                    user_location=user_location,
                    skill_score=resume_match
                )
                eligibility_score = elig_result.score
                eligibility_badges = elig_result.badges
            except Exception as e:
                logger.exception("Eligibility Calc Error")

        # =================================================================
        # 10. P1: Labor Market Friction Signals
        # =================================================================
        friction_signals = self._compute_friction_signals(
            job_text=job_text,
            days_ago=days_ago,
            authenticity=authenticity,
            eligibility_score=eligibility_score,
        )
        
        return AnalysisResult(
            true_score=true_score,
            risk_level=risk_level,
            breakdown=ScoreBreakdown(
                authenticity=authenticity,
                hiring_activity=hiring_activity,
                resume_match=resume_match,
                company_reputation=company_reputation,
                recency=recency,
                preference_match=preference_match,
                company_job_count=market_activity.company_job_count,
                similar_title_count=market_activity.similar_title_count,
                market_data_source=market_activity.data_source,
            ),
            insights=insights,
            recommendations=recommendations,
            skills_gap=skills_gap,
            detected_job_type=job_type,
            detected_employment_type=employment_type,
            interview_probability=interview_probability,
            interview_recommendation=interview_recommendation,
            eligibility_score=eligibility_score,
            eligibility_badges=eligibility_badges,
            friction_signals=friction_signals,
        )
    
    # NOTE: _calculate_hiring_likelihood and _calculate_job_activity have been
    # replaced by the MarketActivity service which uses real job board data.
    # See app/services/market_activity.py
    
    def _calculate_interview_probability(
        self,
        resume_match: int,
        recency: int,
        authenticity: int,
        job_text: str,
        days_ago: Optional[int],
    ) -> tuple:
        """
        Calculate Interview Probability Score (0-100) - IMPROVED v2.
        
        Key changes from v1:
        1. Competition estimation based on job age, category, and location
        2. Recency as a MULTIPLIER not additive weight
        3. ATS keyword check alongside semantic matching
        4. Normalized company name lookup
        5. Easy Apply penalty
        6. Ghost job detection
        """
        from app.database import get_company_stats
        
        # =================================================================
        # 1. Estimate Competition (The #1 factor in response rate)
        # =================================================================
        competition_estimate = self._estimate_competition(job_text, days_ago)
        competition_penalty = min(50, competition_estimate // 10)  # Max 50% penalty
        
        # =================================================================
        # 2. Calculate Base Fit Score (Resume Match + ATS)
        # =================================================================
        ats_score = self._calculate_ats_score(job_text, resume_match)
        combined_match = int((resume_match * 0.5) + (ats_score * 0.5))  # 50/50 blend
        
        # =================================================================
        # 3. Company Response Rate (normalized lookup)
        # =================================================================
        company_name = self._extract_company_name(job_text)
        normalized_name = self._normalize_company_name(company_name) if company_name else None
        
        company_response_score = 50  # Neutral default
        if normalized_name:
            try:
                company_stats = get_company_stats(normalized_name)
                if company_stats and company_stats.get("response_rate") is not None:
                    company_response_score = int(company_stats["response_rate"] * 100)
            except Exception:
                pass
        
        # =================================================================
        # 4. Easy Apply Penalty (high volume = low response)
        # =================================================================
        easy_apply_penalty = self._detect_easy_apply(job_text)
        
        # =================================================================
        # 5. Ghost Job Detection
        # =================================================================
        ghost_penalty = self._detect_ghost_job(job_text, days_ago)
        
        # =================================================================
        # 6. Calculate Base Probability (before recency multiplier)
        # =================================================================
        NEW_WEIGHTS = {
            "combined_match": 0.40,     # Your fit (semantic + ATS)
            "authenticity": 0.25,       # Is it real?
            "company_response": 0.20,   # Will they respond?
            "competition": 0.15,        # How many applicants?
        }
        
        base_probability = int(
            (combined_match * NEW_WEIGHTS["combined_match"]) +
            (authenticity * NEW_WEIGHTS["authenticity"]) +
            (company_response_score * NEW_WEIGHTS["company_response"]) +
            ((100 - competition_penalty) * NEW_WEIGHTS["competition"])
        )
        
        # Apply penalties
        base_probability -= easy_apply_penalty
        base_probability -= ghost_penalty
        
        # =================================================================
        # 7. Apply Recency MULTIPLIER (not additive!)
        # =================================================================
        recency_multiplier = self._get_recency_multiplier(days_ago)
        final_probability = int(base_probability * recency_multiplier)
        
        # Clamp to 0-100
        final_probability = max(0, min(100, final_probability))
        
        # Generate smart recommendation
        recommendation = self._generate_interview_recommendation(
            probability=final_probability,
            resume_match=combined_match,
            recency=recency,
            days_ago=days_ago,
            authenticity=authenticity,
            competition_estimate=competition_estimate,
            is_easy_apply=easy_apply_penalty > 0,
            is_ghost=ghost_penalty > 0,
        )
        
        return final_probability, recommendation
    
    def _estimate_competition(self, job_text: str, days_ago: Optional[int]) -> int:
        """
        Estimate number of applicants based on job characteristics.
        
        Research shows:
        - 0-1 day: 20-50 applicants
        - 2-3 days: 100-200
        - 1 week: 300-500
        - 2+ weeks: 500-2000
        """
        if days_ago is None:
            days_ago = 7  # Assume week old
        
        # Base: ~25 applicants per day
        base_applicants = max(1, days_ago) * 25
        
        # Category multiplier
        category_multipliers = {
            "software": 2.5,
            "engineering": 2.0,
            "data": 2.5,
            "marketing": 1.8,
            "finance": 2.0,
            "sales": 1.5,
            "design": 2.0,
            "product": 2.2,
            "healthcare": 0.9,
            "nursing": 0.7,
            "entry": 3.0,
            "junior": 2.5,
            "intern": 3.5,
        }
        
        text_lower = job_text.lower()
        category_mult = 1.5  # Default
        for category, mult in category_multipliers.items():
            if category in text_lower:
                category_mult = mult
                break
        
        # Remote jobs get 2x more applicants
        remote_mult = 2.0 if any(r in text_lower for r in ['remote', 'work from home', 'wfh']) else 1.0
        
        # Big tech gets 3x more
        big_tech = ['google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'spotify', 'shopify']
        big_tech_mult = 3.0 if any(bt in text_lower for bt in big_tech) else 1.0
        
        estimated = int(base_applicants * category_mult * remote_mult * big_tech_mult)
        return min(estimated, 5000)  # Cap at 5000
    
    def _calculate_ats_score(self, job_text: str, semantic_score: int) -> int:
        """
        Calculate ATS pass probability based on keyword density.
        
        ATS systems look for exact keyword matches, not semantic similarity.
        """
        # Extract required keywords from job description
        required_patterns = [
            r'\b(\d+)\+?\s*years?\b',  # "5+ years"
            r'required[:\s]+([^.]+)',   # "Required: X, Y, Z"
            r'must have[:\s]+([^.]+)',  # "Must have X"
            r'requirements?[:\s]+([^.]+)',
        ]
        
        # Common hard requirements
        hard_requirements = []
        text_lower = job_text.lower()
        
        # Degree requirements
        if any(d in text_lower for d in ["bachelor's", "bachelor", "bs degree", "ba degree", "undergraduate"]):
            hard_requirements.append("degree")
        if any(d in text_lower for d in ["master's", "master", "ms degree", "mba", "graduate degree"]):
            hard_requirements.append("advanced_degree")
        
        # Experience years
        import re
        years_match = re.search(r'(\d+)\+?\s*years?\s+(?:of\s+)?experience', text_lower)
        if years_match:
            hard_requirements.append(f"{years_match.group(1)}_years")
        
        # Certification requirements
        if any(c in text_lower for c in ["certified", "certification", "license", "licensed"]):
            hard_requirements.append("certification")
        
        # If no hard requirements found, ATS is lenient
        if not hard_requirements:
            return semantic_score  # Use semantic as fallback
        
        # Estimate ATS pass based on typical resume
        # Since we don't have the actual resume here, use semantic as proxy
        # and apply a conservative penalty
        ats_estimate = int(semantic_score * 0.85)  # 15% ATS filter penalty
        
        return ats_estimate
    
    def _normalize_company_name(self, company_name: str) -> str:
        """
        Normalize company names for consistent matching.
        
        Google Inc. -> Google
        Amazon.com Inc -> Amazon
        """
        if not company_name:
            return ""
        
        # Remove common suffixes
        suffixes = [
            " inc.", " inc", " incorporated", " corp.", " corp", " corporation",
            " llc", " ltd", " limited", " plc", " co.", " company",
            ".com", ".io", ".ai", ".ca", " canada", " usa", " us"
        ]
        
        normalized = company_name.lower().strip()
        for suffix in suffixes:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)].strip()
        
        # Remove special characters
        normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())
        normalized = ' '.join(normalized.split())  # Normalize whitespace
        
        return normalized.title()  # Return in Title Case
    
    def _detect_easy_apply(self, job_text: str) -> int:
        """
        Detect if job has Easy Apply (high volume = lower response).
        
        Returns penalty (0-15).
        """
        text_lower = job_text.lower()
        
        easy_signals = [
            "easy apply", "one-click apply", "quick apply", "apply now",
            "instant apply", "fast apply", "apply in seconds"
        ]
        
        if any(signal in text_lower for signal in easy_signals):
            return 10  # 10% penalty for Easy Apply
        
        return 0
    
    def _detect_ghost_job(self, job_text: str, days_ago: Optional[int]) -> int:
        """
        Detect ghost job signals.
        
        Returns penalty (0-30).
        """
        text_lower = job_text.lower()
        penalty = 0
        
        # Very old posting (30+ days)
        if days_ago and days_ago >= 30:
            penalty += 15
        
        # Generic/vague descriptions
        vague_signals = [
            "various projects", "multiple openings", "ongoing recruitment",
            "talent pool", "future opportunities", "evergreen",
            "we're always looking", "join our team"
        ]
        if any(signal in text_lower for signal in vague_signals):
            penalty += 10
        
        # No specific team/project mentioned
        specific_signals = ["you will", "you'll work on", "the team", "our team", 
                          "this role", "in this position", "reporting to"]
        if not any(signal in text_lower for signal in specific_signals):
            penalty += 5
        
        return min(penalty, 30)  # Cap at 30%

    def _compute_friction_signals(
        self,
        job_text: str,
        days_ago: Optional[int],
        authenticity: int,
        eligibility_score: Optional[int] = None,
    ) -> List[str]:
        """
        P1: Compute labor market friction signals.
        Returns list of reasons this posting may waste a newcomer's time.
        """
        signals: List[str] = []
        from app.database import get_company_stats

        # Low authenticity = scam / legitimacy concern
        if authenticity < 50:
            signals.append("authenticity_concern")

        # Ghost job risk
        ghost_penalty = self._detect_ghost_job(job_text, days_ago)
        if ghost_penalty >= 15:
            signals.append("ghost_job_risk")

        # Old posting (30+ days)
        if days_ago and days_ago >= 30:
            signals.append("posting_may_be_stale")

        # Low company response rate (from outcome data)
        company_name = self._extract_company_name(job_text)
        normalized_name = self._normalize_company_name(company_name) if company_name else None
        if normalized_name:
            try:
                company_stats = get_company_stats(normalized_name)
                if company_stats and company_stats.get("total_applications", 0) >= 5:
                    rr = company_stats.get("response_rate")
                    if rr is not None and rr < 0.25:
                        signals.append("low_company_response_rate")
            except Exception:
                pass

        # Credential / eligibility mismatch
        if eligibility_score is not None and eligibility_score < 50:
            signals.append("credential_mismatch")

        return signals

    def _get_recency_multiplier(self, days_ago: Optional[int]) -> float:
        """
        Convert recency to a multiplier.
        
        Research shows first 48 hours = 8x more responses.
        """
        if days_ago is None:
            return 0.8  # Assume somewhat old
        
        if days_ago <= 1:
            return 1.3   # 30% boost - fresh jobs!
        elif days_ago <= 2:
            return 1.2   # 20% boost - still hot
        elif days_ago <= 3:
            return 1.1   # 10% boost
        elif days_ago <= 7:
            return 1.0   # Baseline
        elif days_ago <= 14:
            return 0.8   # 20% penalty
        elif days_ago <= 30:
            return 0.6   # 40% penalty
        else:
            return 0.4   # 60% penalty - likely ghost job
    
    def _extract_company_name(self, job_text: str) -> Optional[str]:
        """Extract company name from job posting text."""
        import re
        patterns = [
            r"(?:Company|Employer|Organization)[:\s]+([A-Za-z0-9\s&.,]+?)(?:\n|$|\.)",
            r"(?:at|with|for|@)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:\s+is\s+|\s+looking|\s+seeking|$|\n)",
        ]
        for pattern in patterns:
            match = re.search(pattern, job_text, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:100]
        return None
    
    def _generate_interview_recommendation(
        self,
        probability: int,
        resume_match: int,
        recency: int,
        days_ago: Optional[int],
        authenticity: int,
        competition_estimate: int = 0,
        is_easy_apply: bool = False,
        is_ghost: bool = False,
    ) -> str:
        """Generate actionable recommendation with honest context."""
        
        # Ghost job warning takes priority
        if is_ghost or (days_ago and days_ago >= 30):
            return "likely_ghost"
        
        # Low authenticity = scam risk
        if authenticity < 40:
            return "caution_scam"
        
        # High probability + fresh = act fast
        if probability >= 65 and days_ago and days_ago <= 2:
            return "apply_now"
        
        # High probability
        if probability >= 60:
            if is_easy_apply:
                return "apply_fast_competition"  # Apply quickly due to competition
            return "apply_soon"
        
        # Moderate probability
        if probability >= 40:
            if resume_match < 50:
                return "tailor_resume"
            if competition_estimate > 300:
                return "high_competition"
            return "consider"
        
        # Low probability
        if probability >= 25:
            if resume_match < 40:
                return "low_match"
            return "long_shot"
        
        return "skip"  # Very low probability

    def _calculate_resume_match(self, job_text: str, resume_text: Optional[str]) -> int:
        """
        Calculate resume-job match using TF-IDF cosine similarity.
        
        This is more accurate than simple keyword overlap because:
        1. TF-IDF weighs rare/important terms higher
        2. Cosine similarity measures directional similarity
        3. Handles variations in text length better
        """
        if not resume_text or len(resume_text.strip()) < 50:
            # Return neutral score when no resume provided
            return 50
        
        try:
            from app.ml.resume_matcher import calculate_resume_match
            result = calculate_resume_match(job_text, resume_text)
            return result["score"]
        except Exception as e:
            # Fallback to simple overlap if TF-IDF fails
            print(f"TF-IDF matching failed, using fallback: {e}")
            return self._simple_keyword_match(job_text, resume_text)
    
    def _simple_keyword_match(self, job_text: str, resume_text: str) -> int:
        """Fallback: Simple keyword overlap matching."""
        job_words = set(job_text.lower().split())
        resume_words = set(resume_text.lower().split())
        
        stopwords = {"the", "a", "an", "is", "are", "was", "were", "be", "been", 
                    "being", "have", "has", "had", "do", "does", "did", "will",
                    "would", "could", "should", "may", "might", "must", "and",
                    "or", "but", "if", "then", "else", "when", "at", "by", "for",
                    "with", "about", "to", "from", "in", "on", "of", "as", "this",
                    "that", "it", "we", "you", "they", "i", "my", "your", "our"}
        
        job_words -= stopwords
        resume_words -= stopwords
        
        if not job_words:
            return 50
            
        overlap = len(job_words & resume_words)
        match_ratio = overlap / len(job_words)
        
        return min(100, int(40 + (match_ratio * 60)))
    
    def _calculate_reputation(self, job_text: str) -> int:
        """
        Calculate company reputation using:
        1. Company name extraction
        2. Known company database (Google, Shopify, etc.)
        3. Job text sentiment signals
        """
        try:
            from app.services.reputation import calculate_company_reputation
            result = calculate_company_reputation(job_text)
            return result["score"]
        except Exception as e:
            print(f"Reputation calculation failed: {e}")
            return 70  # Neutral fallback
    
    # =========================================================================
    # NEW: Recency Score Methods
    # =========================================================================
    
    def _extract_posted_date(self, text: str) -> Optional[int]:
        """
        Extract days since posting from text patterns.
        Returns number of days ago, or None if not found.
        """
        text_lower = text.lower()
        
        # Pattern: "Posted X days ago", "X days ago", "posted X day ago"
        days_pattern = r'(?:posted\s+)?(\d+)\s+days?\s+ago'
        match = re.search(days_pattern, text_lower)
        if match:
            return int(match.group(1))
        
        # Pattern: "Posted X weeks ago"
        weeks_pattern = r'(?:posted\s+)?(\d+)\s+weeks?\s+ago'
        match = re.search(weeks_pattern, text_lower)
        if match:
            return int(match.group(1)) * 7
        
        # Pattern: "Posted X hours ago" or "Posted today"
        if 'today' in text_lower or 'just posted' in text_lower:
            return 0
        hours_pattern = r'(?:posted\s+)?(\d+)\s+hours?\s+ago'
        if re.search(hours_pattern, text_lower):
            return 0  # Same day
        
        # Pattern: "Posted X months ago"
        months_pattern = r'(?:posted\s+)?(\d+)\s+months?\s+ago'
        match = re.search(months_pattern, text_lower)
        if match:
            return int(match.group(1)) * 30
        
        return None  # Date not found
    
    def _calculate_recency_score(self, days_ago: Optional[int]) -> int:
        """
        Calculate recency score based on days since posting.
        - Today (0 days): 100
        - 1 week (7 days): ~93
        - 2 weeks (14 days): ~86
        - 1 month (30 days): ~70
        - 2 months (60 days): 50 (floor)
        """
        if days_ago is None:
            return 75  # Neutral when no date info
        
        if days_ago <= 0:
            return 100
        
        # Decay: lose ~5 points per week, floor at 50
        score = 100 - (days_ago * 0.7)
        return max(50, min(100, int(score)))
    
    # =========================================================================
    # NEW: Job Type Detection
    # =========================================================================
    
    def _extract_job_type(self, text: str) -> str:
        """
        Detect work arrangement from job text.
        Returns: 'remote', 'hybrid', 'onsite', or 'unknown'
        """
        text_lower = text.lower()
        
        # Remote indicators
        remote_patterns = [
            r'\bremote\b', r'\bwork from home\b', r'\bwfh\b',
            r'\bfully remote\b', r'\b100% remote\b', r'\btelecommute\b'
        ]
        for pattern in remote_patterns:
            if re.search(pattern, text_lower):
                # Check if it's hybrid
                if any(h in text_lower for h in ['hybrid', 'partial remote', 'some remote']):
                    return 'hybrid'
                return 'remote'
        
        # Hybrid indicators
        hybrid_patterns = [
            r'\bhybrid\b', r'\bflexible location\b', 
            r'\b\d+\s*days?\s*(in\s+office|on-?site)\b'
        ]
        for pattern in hybrid_patterns:
            if re.search(pattern, text_lower):
                return 'hybrid'
        
        # On-site indicators
        onsite_patterns = [
            r'\bon-?site\b', r'\bin-?office\b', r'\bin person\b',
            r'\bmust be located\b', r'\boffice based\b'
        ]
        for pattern in onsite_patterns:
            if re.search(pattern, text_lower):
                return 'onsite'
        
        return 'unknown'
    
    def _extract_employment_type(self, text: str) -> str:
        """
        Detect employment type from job text.
        Returns: 'full-time', 'part-time', 'contract', or 'unknown'
        """
        text_lower = text.lower()
        
        # Full-time indicators
        if any(p in text_lower for p in ['full-time', 'full time', 'permanent', 'salaried']):
            return 'full-time'
        
        # Contract indicators
        if any(p in text_lower for p in ['contract', 'freelance', 'consultant', 'temporary', 'fixed term']):
            return 'contract'
        
        # Part-time indicators
        if any(p in text_lower for p in ['part-time', 'part time', 'hourly', 'per diem']):
            return 'part-time'
        
        return 'unknown'
    
    def _calculate_preference_match(
        self, 
        job_type: str, 
        employment_type: str, 
        user_preferences: Dict[str, str]
    ) -> int:
        """
        Calculate how well the job matches user preferences.
        """
        if not user_preferences:
            return 75  # Neutral when no preferences set
        
        score = 100
        matches = 0
        total_prefs = 0
        
        # Job type preference
        pref_job_type = user_preferences.get('job_type', 'any')
        if pref_job_type and pref_job_type != 'any':
            total_prefs += 1
            if job_type == 'unknown':
                score -= 10  # Slight penalty for unknown
            elif job_type == pref_job_type:
                matches += 1
            elif pref_job_type == 'remote' and job_type == 'hybrid':
                score -= 15  # Partial match
            else:
                score -= 35  # Mismatch
        
        # Employment type preference
        pref_emp_type = user_preferences.get('employment_type', 'any')
        if pref_emp_type and pref_emp_type != 'any':
            total_prefs += 1
            if employment_type == 'unknown':
                score -= 10
            elif employment_type == pref_emp_type:
                matches += 1
            else:
                score -= 35
        
        return max(30, min(100, score))
    
    # =========================================================================
    # NEW: Skills Gap Analysis
    # =========================================================================
    
    def _analyze_skills_gap(
        self, 
        job_text: str, 
        user_skills: List[str]
    ) -> SkillsGapResult:
        """
        Analyze skills gap between job requirements and user skills.
        
        Args:
            job_text: The job posting text
            user_skills: List of user's skills (should be normalized)
            
        Returns:
            SkillsGapResult with matching, missing, and extra skills
        """
        # Extract required skills from job text
        required_skills = self._extract_skills_from_text(job_text)
        
        # Normalize user skills for comparison
        normalized_user_skills = {self._normalize_skill(s) for s in user_skills if s and s.strip()}
        normalized_required_skills = {self._normalize_skill(s) for s in required_skills if s and s.strip()}
        
        # Remove empty strings
        normalized_user_skills = {s for s in normalized_user_skills if s}
        normalized_required_skills = {s for s in normalized_required_skills if s}
        
        # Calculate gaps
        matching = normalized_required_skills & normalized_user_skills
        missing = normalized_required_skills - normalized_user_skills
        extra = normalized_user_skills - normalized_required_skills
        
        return SkillsGapResult(
            matching_skills=sorted(list(matching))[:10],  # Limit to top 10, sorted
            missing_skills=sorted(list(missing))[:10],  # Sorted for consistency
            extra_skills=sorted(list(extra))[:5]  # Sorted for consistency
        )
    
    def _normalize_skill(self, skill: str) -> str:
        """
        Normalize skill name for consistent storage and comparison.
        Converts to lowercase and handles common variations.
        """
        if not skill:
            return ""
        
        skill = skill.strip().lower()
        
        # Handle common variations and aliases
        skill_aliases = {
            'nodejs': 'node.js',
            'node': 'node.js',
            'reactjs': 'react',
            'react.js': 'react',
            'vuejs': 'vue',
            'vue.js': 'vue',
            'angularjs': 'angular',
            'postgres': 'postgresql',
            'golang': 'go',
            'amazon web services': 'aws',
            'google cloud': 'gcp',
        }
        
        if skill in skill_aliases:
            return skill_aliases[skill]
        
        return skill
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills mentioned in job text using the comprehensive TECH_SKILLS database.
        Uses word boundary matching for accurate detection.
        """
        text_lower = text.lower()
        found_skills = set()
        
        # Sort skills by length (longest first) to match multi-word skills first
        # e.g., "machine learning" before "learning"
        sorted_skills = sorted(TECH_SKILLS, key=len, reverse=True)
        
        for skill in sorted_skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                # Normalize the skill for consistent storage
                normalized = self._normalize_skill(skill)
                if normalized:
                    found_skills.add(normalized)
        
        return sorted(list(found_skills))
    
    def _generate_insights(
        self, 
        auth_result: dict, 
        authenticity: int,
        resume_match: int,
        has_resume: bool,
        recency: int = 75,
        preference_match: int = 75,
        job_type: str = "unknown",
        employment_type: str = "unknown",
        user_preferences: Optional[Dict[str, str]] = None
    ) -> List[Insight]:
        """Generate insights based on analysis results."""
        insights = []
        
        # Authenticity insights
        if authenticity >= 80:
            insights.append(Insight(
                type="positive",
                icon="✅",
                message="Job posting appears legitimate"
            ))
        elif authenticity < 60:
            insights.append(Insight(
                type="warning",
                icon="⚠️",
                message=auth_result.get("summary", "Some red flags detected")
            ))
        
        # Red flag insights
        for rf in auth_result.get("red_flags", [])[:2]:  # Max 2
            insights.append(Insight(
                type="warning",
                icon="🚩",
                message=f"Red flag: {rf['category'].replace('_', ' ').title()}"
            ))
        
        # Resume insights
        if not has_resume:
            insights.append(Insight(
                type="tip",
                icon="💡",
                message="Upload your resume for a personalized match score"
            ))
        elif resume_match >= 75:
            insights.append(Insight(
                type="positive",
                icon="🎯",
                message=f"Your resume matches {resume_match}% of job requirements"
            ))
        elif resume_match < 50:
            insights.append(Insight(
                type="tip",
                icon="💡",
                message="Consider tailoring your resume to match job keywords"
            ))
        
        # Recency insights (NEW)
        if recency >= 90:
            insights.append(Insight(
                type="positive",
                icon="🕐",
                message="Recently posted - apply soon!"
            ))
        elif recency < 60:
            insights.append(Insight(
                type="tip",
                icon="📅",
                message="This posting may be older - verify it's still active"
            ))
        
        # Preference match insights (NEW)
        if user_preferences and preference_match >= 90:
            insights.append(Insight(
                type="positive",
                icon="✨",
                message=f"Great match! This {job_type} {employment_type} job fits your preferences"
            ))
        elif user_preferences and preference_match < 50:
            pref_job = user_preferences.get('job_type', 'any')
            if pref_job != 'any' and job_type != pref_job:
                insights.append(Insight(
                    type="warning",
                    icon="📍",
                    message=f"Work arrangement mismatch: Job is {job_type}, you prefer {pref_job}"
                ))
        
        return insights
    
    def _generate_recommendations(
        self,
        authenticity: int,
        resume_match: int,
        has_resume: bool,
        skills_gap: Optional[SkillsGapResult] = None
    ) -> List[Recommendation]:
        """Generate action recommendations."""
        recommendations = []
        
        if authenticity < 80:
            recommendations.append(Recommendation(
                action="Research the company independently before applying",
                impact="high"
            ))
        
        if not has_resume:
            recommendations.append(Recommendation(
                action="Upload your resume for personalized matching",
                impact="high"
            ))
        elif resume_match < 60:
            recommendations.append(Recommendation(
                action="Tailor your resume to include relevant keywords",
                impact="high"
            ))
        
        # Skills gap recommendations (NEW)
        if skills_gap and skills_gap.missing_skills:
            top_missing = skills_gap.missing_skills[:3]
            if top_missing:
                recommendations.append(Recommendation(
                    action=f"Consider learning: {', '.join(top_missing)}",
                    impact="medium"
                ))
        
        # Always add a general recommendation
        recommendations.append(Recommendation(
            action="Verify the company's existence on LinkedIn",
            impact="medium"
        ))
        
        return recommendations[:4]  # Max 4 recommendations


# =============================================================================
# Singleton Instance
# =============================================================================

true_score_aggregator = TrueScoreAggregator()
