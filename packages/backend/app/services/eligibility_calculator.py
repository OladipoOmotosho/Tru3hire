"""Eligibility Calculator Service.

Calculates a 0-100 score representing "Can I legally/technically do this job?"
This is distinct from "Is this a good job?" (TrueScore).

Weights:
- Credentials (40%): regulated/licensing pathway status
- Skills (40%): passed-in resume/job skill score (or a lightweight fallback)
- Location (20%): remote/local/province match
"""

import re
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

from app.data.world_locations import find_location
from app.services.credential_service import analyze_credentials


class EligibilityResult(BaseModel):
    score: int
    badges: List[str] = Field(default_factory=list)
    breakdown: Dict[str, int] = Field(default_factory=dict)
    missing_credentials: List[str] = Field(default_factory=list)

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
        user_location: str = "",  # "City, Province"
        user_skills: Optional[List[str]] = None,
        skill_score: Optional[int] = None,  # Pre-calculated skill score from TrueScore
    ) -> EligibilityResult:
        
        # 1. Credential Score (0-100)
        cred_score, cred_badges, missing_creds = self._calculate_credential_score(resume_text, job_title)
        
        # 2. Skill Score (0-100) - passed in to save re-calculation
        final_skill_score = self._resolve_skill_score(
            job_text=job_text,
            resume_text=resume_text,
            user_skills=user_skills,
            skill_score=skill_score,
        )
        
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

    def _calculate_credential_score(self, resume_text: str, job_title: str) -> Tuple[int, List[str], List[str]]:
        """
        Returns (score, badges, missing_list)
        """
        # Analyze credentials using existing service
        analysis = analyze_credentials(resume_text, job_title)
        
        if not analysis:
            # No regulated pathway for this role => no credential barrier.
            return 100, [], []
            
        status = analysis.get("status")
        badges = []
        missing = []
        
        score = 0
        if status == "licensed":
            score = 100
            badges.append("Licensed")
        elif status == "in_progress":
            score = 60
            badges.append("In Progress")
        elif status == "not_started":
            score = 0
            badges.append("Upskill Needed")
            
        # Extract missing steps
        for step in analysis.get("steps", []):
            if step.get("status") != "completed":
                label = step.get("label")
                if label:
                    missing.append(str(label))
                
        return score, badges, missing

    def _resolve_skill_score(
        self,
        job_text: str,
        resume_text: str,
        user_skills: Optional[List[str]],
        skill_score: Optional[int],
    ) -> int:
        if skill_score is not None:
            return max(0, min(100, int(skill_score)))

        # Lightweight fallback: skill overlap between provided skills and job text.
        if not user_skills:
            return 50

        text = f"{job_text} {resume_text}".lower()
        # Tokenize into tech-ish tokens; avoids substring false positives (e.g. "c" in "accounting").
        tokens = set(re.findall(r"[a-z0-9][a-z0-9\+\#\.]*", text))

        matches = 0
        for skill in user_skills:
            if not skill:
                continue

            skill_token = str(skill).strip().lower()
            if len(skill_token) < 2:
                continue

            # Normalize common separators for multi-part skills.
            normalized = skill_token.replace("/", " ")
            parts = [p for p in normalized.split() if p]
            if not parts:
                continue

            if all(part in tokens for part in parts):
                matches += 1

        if matches == 0:
            return 40
        if matches >= 6:
            return 90
        return 55 + matches * 5

    def _calculate_location_score(self, job_loc: str, user_loc: str, job_text: str) -> tuple:
        """
        Returns (score, badges)
        """
        job_loc_lower = (job_loc or "").lower()
        user_loc_lower = (user_loc or "").lower()
        job_text_lower = (job_text or "").lower()
        
        badges = []
        
        # 1. Remote Check
        if "remote" in job_loc_lower or "remote" in job_text_lower:
            badges.append("Remote")
            return 100, badges
            
        # 2. Exact City Match
        # Extract city from "City, Province"
        job_pos = self._resolve_location(job_loc)
        user_pos = self._resolve_location(user_loc)

        insufficient_data = (not job_loc_lower and not user_loc_lower) or (not job_pos and not user_pos)

        if job_pos and user_pos:
            job_level, job_val, job_parent0, job_parent1 = job_pos
            user_level, user_val, user_parent0, user_parent1 = user_pos

            def get_prov(lvl, val, p0):
                if lvl == "city": return p0
                if lvl == "province": return val
                return None

            def get_country(lvl, val, p0, p1):
                if lvl == "city": return p1
                if lvl == "province": return p0
                if lvl == "country": return val
                return None

            job_province = get_prov(job_level, job_val, job_parent0)
            user_province = get_prov(user_level, user_val, user_parent0)

            job_country = get_country(job_level, job_val, job_parent0, job_parent1)
            user_country = get_country(user_level, user_val, user_parent0, user_parent1)

            if job_level == "city" and user_level == "city" and job_val == user_val:
                badges.append("Local")
                return 100, badges

            if job_province and user_province and job_province == user_province:
                badges.append("In Province")
                return 80, badges

            if job_country and user_country and job_country == user_country:
                badges.append("In Country")
                return 40, badges

        # Fallback: string contains checks.
        job_city = job_loc_lower.split(",")[0].strip()
        user_city = user_loc_lower.split(",")[0].strip()
        if job_city and user_city and job_city == user_city:
            badges.append("Local")
            return 100, badges

        if insufficient_data:
            return 50, []

        return 0, ["Relocation"]

    def _resolve_location(self, text: str) -> Optional[Tuple[str, str, Optional[str], Optional[str]]]:
        """Return (level, value, province, country) for a location-like string."""
        if not text:
            return None

        # Try comma-separated parts most-specific first.
        parts = [p.strip() for p in str(text).split(",") if p.strip()]
        for part in parts:
            result = find_location(part)
            if result:
                level = result.get("level")
                value = result.get("value")
                if not isinstance(level, str) or not level:
                    continue
                if not isinstance(value, str) or not value:
                    continue

                parent_chain = result.get("parent_chain") or []
                province = parent_chain[0] if len(parent_chain) > 0 and isinstance(parent_chain[0], str) else None
                country = parent_chain[1] if len(parent_chain) > 1 and isinstance(parent_chain[1], str) else None
                return level, value, province, country

        # Finally, try the whole string.
        result = find_location(text)
        if result:
            level = result.get("level")
            value = result.get("value")
            if not isinstance(level, str) or not level:
                return None
            if not isinstance(value, str) or not value:
                return None

            parent_chain = result.get("parent_chain") or []
            province = parent_chain[0] if len(parent_chain) > 0 and isinstance(parent_chain[0], str) else None
            country = parent_chain[1] if len(parent_chain) > 1 and isinstance(parent_chain[1], str) else None
            return level, value, province, country

        return None

# Singleton instance
eligibility_calculator = EligibilityCalculator()
