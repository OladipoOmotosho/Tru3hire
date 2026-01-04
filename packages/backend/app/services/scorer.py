"""
TrueScore Aggregator Service

Combines all 4 scoring dimensions into a single TrueScore.

Weights:
- Authenticity: 30% (Is this job real? Core scam detection)
- Hiring Likelihood: 30% (Are they actively hiring?)
- Resume Match: 30% (Does your resume fit?)
- Company Reputation: 10% (What do employees say?)
"""

import re
from typing import Optional, List, Dict
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from app.services.authenticity import authenticity_scorer


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ScoreBreakdown:
    """Breakdown of all 6 TrueScore dimensions."""
    authenticity: int
    hiring_likelihood: int
    resume_match: int
    company_reputation: int
    recency: int = 75  # Default for jobs without date info
    preference_match: int = 75  # Default when no preferences set
    
    def to_dict(self) -> dict:
        return {
            "authenticity": self.authenticity,
            "hiring_likelihood": self.hiring_likelihood,
            "resume_match": self.resume_match,
            "company_reputation": self.company_reputation,
            "recency": self.recency,
            "preference_match": self.preference_match,
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
    
    def to_dict(self) -> dict:
        result = {
            "true_score": self.true_score,
            "risk_level": self.risk_level,
            "breakdown": self.breakdown.to_dict(),
            "insights": [i.to_dict() for i in self.insights],
            "recommendations": [r.to_dict() for r in self.recommendations],
            "detected_job_type": self.detected_job_type,
            "detected_employment_type": self.detected_employment_type,
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
    # Note: recency and preference_match are available but not in default scoring
    # They can be applied as optional filters
    WEIGHTS = {
        "authenticity": 0.30,
        "hiring_likelihood": 0.30,
        "resume_match": 0.30,
        "company_reputation": 0.10,
    }
    
    def analyze(
        self,
        job_text: str,
        resume_text: Optional[str] = None,
        job_url: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        user_preferences: Optional[Dict[str, str]] = None,
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
        # 2. Resume Match (Calculate first - needed for hiring likelihood)
        # =================================================================
        has_resume = resume_text and len(resume_text.strip()) >= 50
        resume_match = self._calculate_resume_match(job_text, resume_text)
        
        # =================================================================
        # 3. Hiring Likelihood = f(Resume Match, Job Activity)
        # This represents your probability of getting an interview
        # =================================================================
        job_activity = self._calculate_job_activity(job_text)
        hiring_likelihood = self._calculate_hiring_likelihood(resume_match, job_activity, has_resume)
        
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
        # Calculate Weighted TrueScore (recency/preference are optional filters)
        # =================================================================
        true_score = int(
            (authenticity * self.WEIGHTS["authenticity"]) +
            (hiring_likelihood * self.WEIGHTS["hiring_likelihood"]) +
            (resume_match * self.WEIGHTS["resume_match"]) +
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
            auth_result, authenticity, resume_match, has_resume,
            recency, preference_match, job_type, employment_type, user_preferences
        )
        
        # =================================================================
        # Generate Recommendations
        # =================================================================
        recommendations = self._generate_recommendations(
            authenticity, resume_match, has_resume, skills_gap
        )
        
        return AnalysisResult(
            true_score=true_score,
            risk_level=risk_level,
            breakdown=ScoreBreakdown(
                authenticity=authenticity,
                hiring_likelihood=hiring_likelihood,
                resume_match=resume_match,
                company_reputation=company_reputation,
                recency=recency,
                preference_match=preference_match,
            ),
            insights=insights,
            recommendations=recommendations,
            skills_gap=skills_gap,
            detected_job_type=job_type,
            detected_employment_type=employment_type,
        )
    
    def _calculate_hiring_likelihood(self, resume_match: int, job_activity: int, has_resume: bool = True) -> int:
        """
        Calculate hiring likelihood as a combination of resume fit and job activity.
        
        This represents your probability of getting an interview:
        - With resume: 60% resume match + 40% job activity
        - Without resume: 100% job activity (can't assess fit without resume)
        """
        if not has_resume:
            # Without resume, hiring likelihood is purely based on job activity
            return job_activity
        
        # Weighted combination: your fit matters more than their urgency
        score = int(0.6 * resume_match + 0.4 * job_activity)
        return max(0, min(100, score))
    
    def _calculate_job_activity(self, text: str) -> int:
        """
        Estimate job activity/urgency based on keywords.
        Higher score = company seems actively hiring.
        """
        text_lower = text.lower()
        score = 70  # Base score
        
        # Positive signals (actively hiring)
        if any(term in text_lower for term in ["urgent", "immediate", "asap", "start today"]):
            score += 10
        if any(term in text_lower for term in ["growing team", "expanding", "new position"]):
            score += 8
        if any(term in text_lower for term in ["multiple openings", "several positions"]):
            score += 5
            
        # Negative signals (not actively hiring)
        if "talent pipeline" in text_lower or "future opportunities" in text_lower:
            score -= 15
        if "may not" in text_lower or "might not" in text_lower:
            score -= 10
            
        return max(0, min(100, score))
    
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
        """

        
        
        # Extract required skills from job text
        required_skills = self._extract_skills_from_text(job_text)
        print(f"DEBUG: Extracted required skills: {required_skills}")
        
        # Normalize for comparison
        user_skills_lower = {s.lower().strip() for s in user_skills}
        required_skills_lower = {s.lower().strip() for s in required_skills}
        
        # Calculate gaps
        matching = required_skills_lower & user_skills_lower
        missing = required_skills_lower - user_skills_lower
        extra = user_skills_lower - required_skills_lower
        
        return SkillsGapResult(
            matching_skills=list(matching)[:10],  # Limit to top 10
            missing_skills=list(missing)[:10],
            extra_skills=list(extra)[:5]
        )
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skills mentioned in job text."""
        # Common technical skills to look for
        common_skills = [
            'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 
            'react', 'angular', 'vue', 'node.js', 'django', 'flask',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
            'git', 'ci/cd', 'jenkins', 'github actions',
            'machine learning', 'deep learning', 'nlp', 'data science',
            'excel', 'tableau', 'power bi', 'salesforce',
            'communication', 'leadership', 'project management', 'agile', 'scrum',
            'html', 'css', 'rest api', 'graphql', 'microservices'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in common_skills:
            if skill in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
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
