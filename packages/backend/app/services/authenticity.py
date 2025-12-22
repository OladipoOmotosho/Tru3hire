"""
Authenticity Detection Service (Fake Job Detection)

Analyzes job postings for red flags that indicate potential scams.
For MVP, this uses heuristic rules. Future: integrate ML model.

Red flags based on research:
- Vagueness about company/role
- Requests for personal information
- Unrealistic compensation
- Poor grammar/formatting
- Urgency pressure tactics
"""

import re
from typing import List, Tuple


# =============================================================================
# Red Flag Patterns
# =============================================================================

# Patterns that indicate potential scams
SCAM_PATTERNS = {
    # Financial red flags
    r"send\s+(money|payment|fee|deposit)": ("financial_request", 25),
    r"(wire|transfer)\s+(money|funds)": ("financial_request", 30),
    r"pay\s+(upfront|in\s+advance|before)": ("financial_request", 25),
    r"training\s+fee": ("financial_request", 20),
    r"buy\s+(equipment|supplies|starter\s+kit)": ("financial_request", 15),
    
    # Personal info requests
    r"(social\s+security|ssn|bank\s+account)": ("pii_request", 25),
    r"(credit\s+card|debit\s+card)\s+number": ("pii_request", 30),
    r"copy\s+of\s+(passport|id|license)": ("pii_request", 15),
    
    # Too good to be true
    r"earn\s+\$?\d{4,}\s*(per|a|every)?\s*(day|week)": ("unrealistic_pay", 20),
    r"(unlimited|uncapped)\s+(income|earnings|potential)": ("unrealistic_pay", 15),
    r"(get\s+rich|make\s+money\s+fast)": ("unrealistic_pay", 25),
    r"no\s+experience\s+(needed|required|necessary).*\$\d{5,}": ("unrealistic_pay", 20),
    
    # Urgency tactics
    r"(act\s+now|limited\s+time|urgent|immediately|asap)": ("urgency", 10),
    r"(don't\s+miss|last\s+chance|expires\s+soon)": ("urgency", 10),
    r"(call|apply|respond)\s+(now|today|immediately)": ("urgency", 8),
    
    # Vagueness
    r"(legitimate|100%\s+real|not\s+a\s+scam)": ("defensive", 15),
    r"(work\s+from\s+home|wfh).*\$\d{3,}\s*/\s*(hour|day)": ("suspicion", 12),
    
    # Contact issues
    r"(gmail|yahoo|hotmail)\.com": ("unprofessional_email", 8),
    r"contact\s+via\s+(whatsapp|telegram|personal)": ("unprofessional_contact", 12),
}

# Positive legitimacy signals
LEGITIMACY_SIGNALS = {
    r"(linkedin\.com|glassdoor\.com|indeed\.com)": ("verified_platform", 10),
    r"(benefits|401k|health\s+insurance|pto|vacation)": ("real_benefits", 8),
    r"(interview\s+process|background\s+check)": ("proper_process", 5),
    r"(headquarters|office\s+located|headquartered)": ("physical_presence", 5),
    r"(founded\s+in|established\s+\d{4})": ("company_history", 5),
}


# =============================================================================
# AuthenticityScorer Class
# =============================================================================

class AuthenticityScorer:
    """
    Analyzes job posting for scam indicators.
    
    Returns a score from 0-100 where:
    - 80-100 = High authenticity, appears legitimate
    - 60-79 = Some minor concerns
    - 40-59 = Moderate risk, proceed with caution
    - 0-39 = High risk, likely scam
    """
    
    def __init__(self):
        self.scam_patterns = SCAM_PATTERNS
        self.legitimacy_signals = LEGITIMACY_SIGNALS
    
    def analyze(self, text: str) -> dict:
        """
        Analyze text for scam indicators.
        
        Returns:
            dict with 'score', 'red_flags', 'positive_signals', 'risk_level'
        """
        text_lower = text.lower()
        
        red_flags: List[dict] = []
        positive_signals: List[dict] = []
        
        # Check scam patterns
        for pattern, (category, penalty) in self.scam_patterns.items():
            matches = re.findall(pattern, text_lower)
            if matches:
                red_flags.append({
                    "category": category,
                    "penalty": penalty,
                    "match": matches[0] if isinstance(matches[0], str) else matches[0][0]
                })
        
        # Check legitimacy signals
        for pattern, (category, bonus) in self.legitimacy_signals.items():
            if re.search(pattern, text_lower):
                positive_signals.append({
                    "category": category,
                    "bonus": bonus
                })
        
        # Calculate base score
        # Start at 85, penalize for red flags, bonus for positive signals
        base_score = 85
        
        total_penalty = sum(rf["penalty"] for rf in red_flags)
        total_bonus = sum(ps["bonus"] for ps in positive_signals)
        
        # Additional heuristics
        word_count = len(text.split())
        
        # Very short postings are suspicious
        if word_count < 50:
            total_penalty += 15
            red_flags.append({"category": "too_short", "penalty": 15, "match": f"{word_count} words"})
        
        # Check for company name
        if not re.search(r'(company|inc|llc|ltd|corp|gmbh)', text_lower):
            total_penalty += 5
        
        # Final score
        score = max(0, min(100, base_score - total_penalty + total_bonus))
        
        # Determine risk level
        if score >= 80:
            risk_level = "low"
        elif score >= 60:
            risk_level = "medium"
        elif score >= 40:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        return {
            "score": score,
            "red_flags": red_flags,
            "positive_signals": positive_signals,
            "risk_level": risk_level,
            "word_count": word_count,
            "summary": self._get_summary(score, red_flags)
        }
    
    def _get_summary(self, score: int, red_flags: list) -> str:
        """Generate human-readable summary."""
        if score >= 85:
            return "This job posting appears legitimate."
        elif score >= 70:
            return "Minor concerns detected. Verify company independently."
        elif score >= 50:
            issues = len(red_flags)
            return f"Caution advised. {issues} potential red flag(s) detected."
        else:
            return "High risk! Multiple scam indicators detected."
    
    def get_score(self, text: str) -> int:
        """Simple method to just get the score."""
        return self.analyze(text)["score"]


# =============================================================================
# Singleton Instance
# =============================================================================

authenticity_scorer = AuthenticityScorer()
