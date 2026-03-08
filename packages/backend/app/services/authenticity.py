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
# Job Content Validation (Nonsense Detection)
# =============================================================================

# Common job-posting vocabulary. Real postings contain at least a few of these.
JOB_KEYWORDS = {
    "experience", "salary", "responsibilities", "qualifications", "apply",
    "skills", "position", "role", "team", "company", "hiring", "job",
    "work", "candidate", "interview", "benefits", "requirement", "manage",
    "develop", "engineer", "design", "analyst", "report", "opportunity",
    "full-time", "part-time", "contract", "remote", "hybrid", "degree",
    "education", "proficient", "communication", "collaborate", "deadline",
    "project", "department", "supervisor", "employee", "employment",
}

# Small set of very common English words for language validation.
# If most words in the input aren't in this set, it's likely gibberish.
COMMON_ENGLISH_WORDS = {
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her",
    "she", "or", "an", "will", "my", "one", "all", "would", "there",
    "their", "what", "so", "up", "out", "if", "about", "who", "get",
    "which", "go", "me", "when", "make", "can", "like", "time", "no",
    "just", "him", "know", "take", "people", "into", "year", "your",
    "good", "some", "could", "them", "see", "other", "than", "then",
    "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "way", "even",
    "new", "want", "because", "any", "these", "give", "day", "most",
    "us", "are", "is", "was", "were", "been", "has", "had", "did",
    "does", "should", "must", "need", "may", "might", "shall",
    "more", "very", "well", "here", "where", "why", "still", "own",
    "through", "much", "those", "each", "life", "being", "between",
    "both", "under", "never", "same", "another", "while", "last",
    "great", "high", "every", "such", "large", "big", "small",
    "able", "strong", "including", "looking", "working", "join",
    # Job-specific common words that aren't in JOB_KEYWORDS
    "years", "required", "preferred", "minimum", "must", "strong",
    "knowledge", "ability", "provide", "support", "ensure", "lead",
    "based", "within", "across", "including", "related", "plus",
    "excellent", "written", "verbal", "understanding",
}


def validate_job_content(text: str) -> tuple:
    """
    Validate whether text plausibly looks like a job posting.

    Returns:
        (is_valid: bool, reason: str)
        - (True, "") if the text passes plausibility checks
        - (False, "reason message") if the text is nonsense/gibberish
    """
    words = re.findall(r'[a-zA-Z]+', text.lower())

    # Need at least some words to analyze
    if len(words) < 10:
        return (False, "Text is too short to be a job posting. Please paste a complete job description.")

    # -------------------------------------------------------------------------
    # Check 1: Job keyword presence
    # Real job postings contain several job-related terms.
    # -------------------------------------------------------------------------
    job_keyword_hits = sum(1 for w in words if w in JOB_KEYWORDS)
    has_enough_keywords = job_keyword_hits >= 3

    # -------------------------------------------------------------------------
    # Check 2: Recognizable English words
    # Real text (even poorly written) uses mostly real English words.
    # Lorem ipsum, keyboard smash, and random strings fail this.
    # -------------------------------------------------------------------------
    all_check_words = COMMON_ENGLISH_WORDS | JOB_KEYWORDS
    recognized = sum(1 for w in words if w in all_check_words)
    english_ratio = recognized / len(words) if words else 0
    has_enough_english = english_ratio >= 0.25

    # -------------------------------------------------------------------------
    # Check 3: Repetition detection
    # Catches "hello hello hello..." or "test test test..."
    # -------------------------------------------------------------------------
    from collections import Counter
    word_counts = Counter(words)
    most_common_count = word_counts.most_common(1)[0][1] if word_counts else 0
    repetition_ratio = most_common_count / len(words) if words else 0
    is_repetitive = repetition_ratio > 0.60 and len(words) > 15

    # -------------------------------------------------------------------------
    # Decision: Must pass at least one of keyword/english checks, not repetitive
    # -------------------------------------------------------------------------
    if is_repetitive:
        return (False, "This text appears to contain repetitive content rather than a job posting. Please paste an actual job description.")

    if not has_enough_keywords and not has_enough_english:
        return (False, "This doesn't appear to be a job posting. Please paste an actual job description with details about the role, requirements, and company.")

    return (True, "")


# =============================================================================
# AuthenticityScorer Class
# =============================================================================

class AuthenticityScorer:
    """
    Analyzes job posting for scam indicators using hybrid ML + rules approach.
    
    Returns a score from 0-100 where:
    - 80-100 = High authenticity, appears legitimate
    - 60-79 = Some minor concerns
    - 40-59 = Moderate risk, proceed with caution
    - 0-39 = High risk, likely scam
    
    Scoring: 70% ML model + 30% rule-based heuristics
    """
    
    def __init__(self):
        self.scam_patterns = SCAM_PATTERNS
        self.legitimacy_signals = LEGITIMACY_SIGNALS
        self._ml_available = None
    
    def _check_ml_available(self) -> bool:
        """Check if ML model is available."""
        if self._ml_available is None:
            try:
                from app.ml.predictor import get_model
                get_model()  # Try to load
                self._ml_available = True
            except Exception:
                self._ml_available = False
        return self._ml_available
    
    def analyze(self, text: str) -> dict:
        """
        Analyze text for scam indicators using hybrid ML + rules approach.
        
        Returns:
            dict with 'score', 'red_flags', 'positive_signals', 'risk_level', 'ml_prediction'
        """
        text_lower = text.lower()
        
        red_flags: List[dict] = []
        positive_signals: List[dict] = []
        ml_prediction = None
        
        # =====================================================================
        # 1. ML Model Prediction (if available)
        # =====================================================================
        ml_score = None
        if self._check_ml_available():
            try:
                from app.ml.predictor import predict_fake_job
                ml_prediction = predict_fake_job(text)
                ml_score = ml_prediction['authenticity_score']
            except Exception as e:
                print(f"ML prediction failed: {e}")
                ml_score = None
        
        # =====================================================================
        # 2. Rule-based Analysis (always run for explainability)
        # =====================================================================
        
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
        
        # Rule-based score
        rule_score = max(0, min(100, base_score - total_penalty + total_bonus))
        
        # =====================================================================
        # 3. Combine ML + Rule-based Scores (Hybrid)
        # =====================================================================
        if ml_score is not None:
            # 70% ML, 30% rules for hybrid robustness
            score = int(0.7 * ml_score + 0.3 * rule_score)
        else:
            # Fallback to rules only if ML unavailable
            score = rule_score
        
        # Determine risk level based on final score
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
            "summary": self._get_summary(score, red_flags),
            "ml_prediction": ml_prediction,  # Include ML details for transparency
            "ml_available": ml_score is not None,
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
