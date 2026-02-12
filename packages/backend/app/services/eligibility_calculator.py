"""
Eligibility Calculator Service

Calculates a 0-100 score representing "Can I legally/technically do this job?"
This is distinct from "Is this a good job?" (TrueScore).

Scoring Breakdown:
1. Credential Match (40%): Do you have the license? (P.Eng, RN, CPA)
2. Skill Match (40%): Do you have the skills? (Re-uses SkillMatcher)
3. Location Match (20%): Are you in the right place?
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from app.services.credential_service import analyze_credentials
# We will import SkillMatcher dynamically to avoid circular imports if needed

@dataclass
class EligibilityResult:
    score: int
    badges: List[str]  # e.g., ["Licensed", "Local", "Remote", "Easy Commute"]
    breakdown: Dict[str, int]
    missing_credentials: List[str]

class EligibilityCalculator:
    
    # Weights must sum to 1.0
    WEIGHTS = {
        "credentials": 0.40,
        "skills": 0.40,
        "location": 0.20
    }

    def calculate(
        self,
        job_title: str,
        job_location: str,
        job_text: str,
        resume_text: str,
        user_location: str,  # "City, Province"
        user_skills: List[str] = [],
        skill_score: int = 0 # Pre-calculated skill score from TrueScore
    ) -> EligibilityResult:
        
        # 1. Credential Score (0-100)
        cred_score, cred_badges, missing_creds = self._calculate_credential_score(resume_text, job_title)
        
        # 2. Skill Score (0-100) - passed in to save re-calculation
        # If not passed, we assume 50 (neutral) or could re-run matcher
        final_skill_score = skill_score
        
        # 3. Location Score (0-100)
        loc_score, loc_badges = self._calculate_location_score(job_location, user_location, job_text)
        
        # Weighted Total
        total_score = int(
            (cred_score * self.WEIGHTS["credentials"]) +
            (final_skill_score * self.WEIGHTS["skills"]) +
            (loc_score * self.WEIGHTS["location"])
        )
        
        # Badges
        all_badges = cred_badges + loc_badges
        if final_skill_score > 80:
            all_badges.append("Top Match")
        
        return EligibilityResult(
            score=total_score,
            badges=all_badges,
            breakdown={
                "credentials": cred_score,
                "skills": final_skill_score,
                "location": loc_score
            },
            missing_credentials=missing_creds
        )

    def _calculate_credential_score(self, resume_text: str, job_title: str) -> tuple:
        """
        Returns (score, badges, missing_list)
        """
        # Analyze credentials using existing service
        analysis = analyze_credentials(resume_text, job_title)
        
        if not analysis:
            # If role doesn't require credentials (e.g. Sales), defaulting to 100 is risky.
            # But for Phase 1 we only track regulated roles. 
            # If not regulated, credential score is N/A -> treat as 100 (no barrier).
            return 100, [], []
            
        status = analysis.get("status")
        badges = []
        missing = []
        
        score = 0
        if status == "licensed":
            score = 100
            badges.append("Licensed")
        elif status == "in_progress": # e.g. EIT
            score = 60
            badges.append("In Progress")
        elif status == "not_started":
            score = 0
            badges.append("Upskill Needed")
            
        # Extract missing steps
        for step in analysis.get("steps", []):
            if step["status"] != "completed":
                missing.append(step["label"])
                
        return score, badges, missing

    def _calculate_location_score(self, job_loc: str, user_loc: str, job_text: str) -> tuple:
        """
        Returns (score, badges)
        """
        job_loc = job_loc.lower()
        user_loc = user_loc.lower() if user_loc else ""
        job_text_lower = job_text.lower()
        
        badges = []
        
        # 1. Remote Check
        if "remote" in job_loc or "remote" in job_text_lower:
            badges.append("Remote")
            return 100, badges
            
        # 2. Exact City Match
        # Extract city from "City, Province"
        job_city = job_loc.split(",")[0].strip()
        user_city = user_loc.split(",")[0].strip() if user_loc else ""
        
        if job_city and user_city and job_city == user_city:
            badges.append("Local")
            return 100, badges
            
        # 3. Province Match
        # Attempt to find province code (e.g. "ON", "BC")
        # Very improved logic needed here for production, but simple check for now
        provinces = ["on", "bc", "ab", "qc", "ns", "nb", "mb", "sk", "pe", "nl"]
        
        job_prov = next((p for p in provinces if p in job_loc), "")
        user_prov = next((p for p in provinces if p in user_loc), "")
        
        if job_prov and user_prov and job_prov == user_prov:
            badges.append("In Province")
            return 80, badges
            
        # 4. Mismatch
        return 0, ["Relocation"]

# Singleton instance
eligibility_calculator = EligibilityCalculator()
