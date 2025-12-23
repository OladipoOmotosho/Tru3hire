"""
TrueScore Aggregator Service

Combines all 5 scoring dimensions into a single TrueScore.

Weights:
- Authenticity: 25% (Is this job real?)
- Hiring Likelihood: 25% (Are they actively hiring?)
- Resume Match: 25% (Does your resume fit?)
- Bias & Fairness: 15% (Is the workplace inclusive?)
- Company Reputation: 10% (What do employees say?)
"""

from typing import Optional, List
from dataclasses import dataclass

from app.services.bias import bias_scorer
from app.services.authenticity import authenticity_scorer


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ScoreBreakdown:
    """Breakdown of all 5 TrueScore dimensions."""
    authenticity: int
    hiring_likelihood: int
    resume_match: int
    bias_fairness: int
    company_reputation: int
    
    def to_dict(self) -> dict:
        return {
            "authenticity": self.authenticity,
            "hiring_likelihood": self.hiring_likelihood,
            "resume_match": self.resume_match,
            "bias_fairness": self.bias_fairness,
            "company_reputation": self.company_reputation,
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
    
    def to_dict(self) -> dict:
        return {
            "true_score": self.true_score,
            "risk_level": self.risk_level,
            "breakdown": self.breakdown.to_dict(),
            "insights": [i.to_dict() for i in self.insights],
            "recommendations": [r.to_dict() for r in self.recommendations],
        }


# =============================================================================
# TrueScoreAggregator Class
# =============================================================================

class TrueScoreAggregator:
    """
    Main orchestrator that runs all scoring services and combines them.
    """
    
    # Scoring weights (must sum to 1.0)
    WEIGHTS = {
        "authenticity": 0.25,
        "hiring_likelihood": 0.25,
        "resume_match": 0.25,
        "bias_fairness": 0.15,
        "company_reputation": 0.10,
    }
    
    def analyze(
        self,
        job_text: str,
        resume_text: Optional[str] = None,
        job_url: Optional[str] = None,
    ) -> AnalysisResult:
        """
        Run full TrueScore analysis on a job posting.
        
        Args:
            job_text: The job description text
            resume_text: Optional resume text for matching
            job_url: Optional URL for additional verification
            
        Returns:
            AnalysisResult with score, breakdown, insights, and recommendations
        """
        
        # =================================================================
        # 1. Authenticity Score (Real vs Fake detection)
        # =================================================================
        auth_result = authenticity_scorer.analyze(job_text)
        authenticity = auth_result["score"]
        
        # =================================================================
        # 2. Hiring Likelihood (Recency/Activity - MVP: Heuristic)
        # =================================================================
        hiring_likelihood = self._calculate_hiring_likelihood(job_text)
        
        # =================================================================
        # 3. Resume Match (Similarity - MVP: Heuristic or mocked)
        # =================================================================
        resume_match = self._calculate_resume_match(job_text, resume_text)
        
        # =================================================================
        # 4. Bias & Fairness Score
        # =================================================================
        bias_result = bias_scorer.analyze(job_text)
        bias_fairness = bias_result["score"]
        
        # =================================================================
        # 5. Company Reputation (MVP: Mocked)
        # =================================================================
        company_reputation = self._calculate_reputation(job_text)
        
        # =================================================================
        # Calculate Weighted TrueScore
        # =================================================================
        true_score = int(
            (authenticity * self.WEIGHTS["authenticity"]) +
            (hiring_likelihood * self.WEIGHTS["hiring_likelihood"]) +
            (resume_match * self.WEIGHTS["resume_match"]) +
            (bias_fairness * self.WEIGHTS["bias_fairness"]) +
            (company_reputation * self.WEIGHTS["company_reputation"])
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
            auth_result, bias_result, authenticity, bias_fairness, 
            resume_match, resume_text is not None
        )
        
        # =================================================================
        # Generate Recommendations
        # =================================================================
        recommendations = self._generate_recommendations(
            authenticity, resume_match, bias_fairness, resume_text is not None
        )
        
        return AnalysisResult(
            true_score=true_score,
            risk_level=risk_level,
            breakdown=ScoreBreakdown(
                authenticity=authenticity,
                hiring_likelihood=hiring_likelihood,
                resume_match=resume_match,
                bias_fairness=bias_fairness,
                company_reputation=company_reputation,
            ),
            insights=insights,
            recommendations=recommendations,
        )
    
    def _calculate_hiring_likelihood(self, text: str) -> int:
        """
        Estimate hiring likelihood based on urgency and activity signals.
        MVP: Simple heuristic based on keywords.
        """
        text_lower = text.lower()
        score = 70  # Base score
        
        # Positive signals
        if any(term in text_lower for term in ["urgent", "immediate", "asap", "start today"]):
            score += 10
        if any(term in text_lower for term in ["growing team", "expanding", "new position"]):
            score += 8
        if any(term in text_lower for term in ["multiple openings", "several positions"]):
            score += 5
            
        # Negative signals
        if "talent pipeline" in text_lower or "future opportunities" in text_lower:
            score -= 15
        if "may not" in text_lower or "might not" in text_lower:
            score -= 10
            
        return max(0, min(100, score))
    
    def _calculate_resume_match(self, job_text: str, resume_text: Optional[str]) -> int:
        """
        Calculate resume-job match.
        MVP: Return 50 if no resume, else do simple keyword overlap.
        Future: Use sentence-transformers for semantic similarity.
        """
        if not resume_text:
            return 50  # Neutral score if no resume provided
        
        # Simple keyword overlap for MVP
        job_words = set(job_text.lower().split())
        resume_words = set(resume_text.lower().split())
        
        # Remove common words
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
        
        # Scale to 0-100
        return min(100, int(40 + (match_ratio * 60)))
    
    def _calculate_reputation(self, job_text: str) -> int:
        """
        Calculate company reputation.
        MVP: Return neutral score. Future: integrate Glassdoor API.
        """
        # For MVP, return a neutral-positive score
        # We don't have actual reputation data yet
        return 75
    
    def _generate_insights(
        self, 
        auth_result: dict, 
        bias_result: dict,
        authenticity: int,
        bias_fairness: int,
        resume_match: int,
        has_resume: bool
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
        
        # Bias insights
        if bias_fairness >= 85:
            if bias_result.get("positives"):
                insights.append(Insight(
                    type="positive",
                    icon="🌈",
                    message="Inclusive language detected"
                ))
        elif bias_fairness < 70:
            insights.append(Insight(
                type="warning",
                icon="⚠️",
                message=bias_result.get("details", "Some biased language detected")
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
        
        return insights
    
    def _generate_recommendations(
        self,
        authenticity: int,
        resume_match: int,
        bias_fairness: int,
        has_resume: bool
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
        
        if bias_fairness < 70:
            recommendations.append(Recommendation(
                action="Research company culture on Glassdoor",
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
