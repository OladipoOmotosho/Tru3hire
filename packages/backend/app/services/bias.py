"""
Bias & Fairness Detection Service

Analyzes job postings for gender-coded language and biased terms
that may indicate a non-inclusive workplace.

Based on research:
- Gaucher, D., Friesen, J., & Kay, A. C. (2011). Evidence that gendered wording
  in job advertisements exists and sustains gender inequality.
"""

from typing import List, Tuple
import re


# =============================================================================
# Gendered/Biased Word Dictionary
# =============================================================================

# Masculine-coded words (may discourage female applicants)
MASCULINE_CODED_WORDS = {
    # Agentic traits
    "aggressive", "ambitious", "analytical", "assertive", "autonomous",
    "competitive", "confident", "decisive", "determined", "dominant",
    "driven", "fearless", "headstrong", "hierarchical", "independent",
    "individualistic", "leader", "ninja", "objective", "outspoken",
    "persistent", "rockstar", "self-reliant", "strong", "superior",
    # Tech bro culture
    "brogrammer", "hacker", "hustler", "guru", "wizard", "unicorn",
    "crush it", "kill it", "dominate", "attack", "conquer",
}

# Feminine-coded words (may discourage male applicants, less common issue)
FEMININE_CODED_WORDS = {
    "collaborative", "committed", "compassionate", "connected", "cooperative",
    "dependable", "emotional", "empathetic", "interpersonal", "loyal",
    "nurturing", "pleasant", "polite", "sensitive", "supportive",
    "sympathetic", "warm", "yielding",
}

# Exclusionary or problematic phrases
EXCLUSIONARY_PHRASES = {
    "young and dynamic": -15,
    "digital native": -10,
    "recent graduate only": -15,
    "native english speaker": -10,  # May exclude qualified non-native speakers
    "culture fit": -5,  # Often used to justify bias
    "work hard play hard": -5,  # Code for overwork culture
    "like a family": -5,  # Often hides poor boundaries
    "no job hoppers": -10,
    "must be able to lift": -5,  # Fine if relevant, but flag it
}

# Positive inclusive signals
INCLUSIVE_SIGNALS = {
    "equal opportunity": 10,
    "diversity": 8,
    "inclusive": 8,
    "accessible": 5,
    "accommodation": 5,
    "flexible": 3,
    "remote": 3,
    "work-life balance": 5,
    "parental leave": 5,
    "all backgrounds": 8,
}


# =============================================================================
# BiasScorer Class
# =============================================================================

class BiasScorer:
    """
    Analyzes job posting text for biased or exclusionary language.
    
    Returns a score from 0-100 where:
    - 100 = Very inclusive, no biased language detected
    - 70-99 = Minor issues detected
    - 40-69 = Moderate bias concerns
    - 0-39 = Significant bias/exclusionary language
    """
    
    def __init__(self):
        self.masculine_words = MASCULINE_CODED_WORDS
        self.feminine_words = FEMININE_CODED_WORDS
        self.exclusionary_phrases = EXCLUSIONARY_PHRASES
        self.inclusive_signals = INCLUSIVE_SIGNALS
    
    def analyze(self, text: str) -> dict:
        """
        Analyze text for bias and return detailed results.
        
        Returns:
            dict with 'score', 'issues', 'positives', and 'details'
        """
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        issues: List[Tuple[str, str, int]] = []  # (term, category, penalty)
        positives: List[Tuple[str, int]] = []  # (term, bonus)
        
        # Check masculine-coded words
        masculine_found = []
        for word in self.masculine_words:
            if word in text_lower:
                masculine_found.append(word)
        
        # Penalize excessive masculine coding (1-2 is okay, 3+ is concerning)
        if len(masculine_found) > 2:
            penalty = min(5 * (len(masculine_found) - 2), 25)
            issues.append((
                f"Masculine-coded: {', '.join(masculine_found[:5])}",
                "gender_bias",
                penalty
            ))
        
        # Check feminine-coded words
        feminine_found = []
        for word in self.feminine_words:
            if word in text_lower:
                feminine_found.append(word)
        
        # Excessive feminine coding is less common but flag it
        if len(feminine_found) > 3:
            penalty = min(3 * (len(feminine_found) - 3), 15)
            issues.append((
                f"Feminine-coded: {', '.join(feminine_found[:5])}",
                "gender_bias", 
                penalty
            ))
        
        # Check exclusionary phrases
        for phrase, penalty in self.exclusionary_phrases.items():
            if phrase in text_lower:
                issues.append((phrase, "exclusionary", abs(penalty)))
        
        # Check inclusive signals
        for signal, bonus in self.inclusive_signals.items():
            if signal in text_lower:
                positives.append((signal, bonus))
        
        # Calculate score
        base_score = 85  # Start with a good score
        
        # Apply penalties
        total_penalty = sum(issue[2] for issue in issues)
        
        # Apply bonuses
        total_bonus = sum(pos[1] for pos in positives)
        
        # Final score
        score = max(0, min(100, base_score - total_penalty + total_bonus))
        
        return {
            "score": score,
            "issues": [{"term": i[0], "category": i[1], "penalty": i[2]} for i in issues],
            "positives": [{"term": p[0], "bonus": p[1]} for p in positives],
            "masculine_word_count": len(masculine_found),
            "feminine_word_count": len(feminine_found),
            "details": self._get_summary(score, issues, positives)
        }
    
    def _get_summary(self, score: int, issues: list, positives: list) -> str:
        """Generate a human-readable summary."""
        if score >= 85:
            if positives:
                return "Excellent! This posting uses inclusive language."
            return "Good. No significant bias detected."
        elif score >= 70:
            return "Minor concerns. Some gendered language detected."
        elif score >= 50:
            return "Moderate bias. Consider revising exclusionary terms."
        else:
            return "Significant bias detected. Multiple exclusionary signals found."
    
    def get_score(self, text: str) -> int:
        """Simple method to just get the score."""
        return self.analyze(text)["score"]


# =============================================================================
# Singleton Instance
# =============================================================================

bias_scorer = BiasScorer()
