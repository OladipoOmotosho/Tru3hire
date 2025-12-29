"""
Company Reputation Service

Provides company reputation scoring by:
1. Extracting company name from job text
2. Checking against known company database
3. Generating review search links (Reddit, Glassdoor, LinkedIn)
4. Simple keyword-based sentiment from job text

Note: Full Reddit/Glassdoor API integration would require API keys.
This MVP provides useful links and basic heuristics.
"""

import re
from typing import Optional, Dict, List


# =============================================================================
# Company Name Extraction
# =============================================================================

# Common job posting patterns for company names
COMPANY_PATTERNS = [
    r'(?:at|@|with)\s+([A-Z][A-Za-z0-9\s&\.\-]+?)(?:\.|,|\s+is|\s+we|\s+are)',
    r'([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)*)\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co\.|GmbH|Limited)',
    r'(?:join|about)\s+([A-Z][A-Za-z0-9\s]+?)(?:\.|,|\s+is|\s+we)',
    r'^([A-Z][A-Za-z0-9\s&]+)\s+-\s+',  # "Company Name - Job Title"
]

# Well-known companies with reputation scores
KNOWN_COMPANIES = {
    # Tech Giants (generally good reputation)
    "google": {"score": 85, "sentiment": "positive", "reviews": "high"},
    "microsoft": {"score": 82, "sentiment": "positive", "reviews": "high"},
    "apple": {"score": 80, "sentiment": "positive", "reviews": "high"},
    "amazon": {"score": 65, "sentiment": "mixed", "reviews": "high"},
    "meta": {"score": 60, "sentiment": "mixed", "reviews": "high"},
    "facebook": {"score": 60, "sentiment": "mixed", "reviews": "high"},
    "netflix": {"score": 78, "sentiment": "positive", "reviews": "high"},
    "salesforce": {"score": 75, "sentiment": "positive", "reviews": "high"},
    "adobe": {"score": 80, "sentiment": "positive", "reviews": "high"},
    "nvidia": {"score": 85, "sentiment": "positive", "reviews": "high"},
    
    # Canadian Companies
    "shopify": {"score": 82, "sentiment": "positive", "reviews": "high"},
    "rbc": {"score": 75, "sentiment": "positive", "reviews": "high"},
    "td bank": {"score": 75, "sentiment": "positive", "reviews": "high"},
    "scotiabank": {"score": 73, "sentiment": "positive", "reviews": "high"},
    "rogers": {"score": 55, "sentiment": "mixed", "reviews": "high"},
    "bell": {"score": 55, "sentiment": "mixed", "reviews": "high"},
    "telus": {"score": 65, "sentiment": "neutral", "reviews": "high"},
    
    # Consulting/Finance
    "deloitte": {"score": 70, "sentiment": "neutral", "reviews": "high"},
    "kpmg": {"score": 70, "sentiment": "neutral", "reviews": "high"},
    "pwc": {"score": 70, "sentiment": "neutral", "reviews": "high"},
    "accenture": {"score": 65, "sentiment": "mixed", "reviews": "high"},
    "mckinsey": {"score": 75, "sentiment": "positive", "reviews": "high"},
    
    # Startups/Tech
    "stripe": {"score": 85, "sentiment": "positive", "reviews": "medium"},
    "airbnb": {"score": 75, "sentiment": "positive", "reviews": "high"},
    "uber": {"score": 55, "sentiment": "mixed", "reviews": "high"},
    "lyft": {"score": 60, "sentiment": "mixed", "reviews": "medium"},
}


def extract_company_name(job_text: str) -> Optional[str]:
    """
    Extract company name from job posting text.
    
    Returns:
        Company name if found, None otherwise
    """
    # Try each pattern
    for pattern in COMPANY_PATTERNS:
        match = re.search(pattern, job_text, re.MULTILINE)
        if match:
            company = match.group(1).strip()
            # Clean up the company name
            company = re.sub(r'\s+', ' ', company)
            if len(company) >= 2 and len(company) <= 50:
                return company
    
    # Look for "About [Company]" or "Who we are: [Company]"
    about_match = re.search(r'(?:about|who we are)[:\s]+([A-Z][A-Za-z0-9\s]+)', job_text, re.IGNORECASE)
    if about_match:
        return about_match.group(1).strip()
    
    return None


def get_known_company_score(company_name: str) -> Optional[Dict]:
    """Check if company is in our known database."""
    if not company_name:
        return None
    
    name_lower = company_name.lower().strip()
    
    # Direct match
    if name_lower in KNOWN_COMPANIES:
        return KNOWN_COMPANIES[name_lower]
    
    # Partial match
    for known, data in KNOWN_COMPANIES.items():
        if known in name_lower or name_lower in known:
            return data
    
    return None


# =============================================================================
# Reputation Links
# =============================================================================

def generate_review_links(company_name: str) -> Dict[str, str]:
    """Generate links to company reviews on various platforms."""
    if not company_name:
        return {}
    
    # URL-encode the company name
    encoded = company_name.replace(' ', '+')
    
    return {
        "glassdoor": f"https://www.glassdoor.com/Search/results.htm?keyword={encoded}",
        "reddit": f"https://www.reddit.com/search/?q={encoded}+review+working&type=comment",
        "linkedin": f"https://www.linkedin.com/company/{company_name.lower().replace(' ', '-')}/",
        "indeed": f"https://www.indeed.com/cmp/{company_name.lower().replace(' ', '-')}/reviews",
    }


# =============================================================================
# Job Text Sentiment Signals
# =============================================================================

POSITIVE_SIGNALS = [
    "competitive salary", "great benefits", "work-life balance",
    "remote work", "flexible hours", "professional development",
    "mentorship", "growth opportunity", "inclusive", "diverse team",
    "top employer", "award-winning", "established", "industry leader",
    "401k", "health insurance", "pto", "vacation", "equity", "stock options"
]

NEGATIVE_SIGNALS = [
    "fast-paced", "wear many hats", "hustle", "grind",
    "startup environment", "unlimited pto",  # Often means no real PTO
    "like a family", "work hard play hard",
    "competitive environment", "high pressure",
    "must be available", "on-call", "24/7",
]


def analyze_job_sentiment(job_text: str) -> Dict:
    """Analyze job posting text for reputation signals."""
    text_lower = job_text.lower()
    
    positive_found = [s for s in POSITIVE_SIGNALS if s in text_lower]
    negative_found = [s for s in NEGATIVE_SIGNALS if s in text_lower]
    
    pos_count = len(positive_found)
    neg_count = len(negative_found)
    
    # Calculate sentiment score adjustment
    if pos_count > neg_count:
        sentiment = "positive"
        adjustment = min(15, (pos_count - neg_count) * 3)
    elif neg_count > pos_count:
        sentiment = "concerning"
        adjustment = -min(15, (neg_count - pos_count) * 3)
    else:
        sentiment = "neutral"
        adjustment = 0
    
    return {
        "sentiment": sentiment,
        "adjustment": adjustment,
        "positive_signals": positive_found[:5],
        "negative_signals": negative_found[:5],
    }


# =============================================================================
# Main Reputation Function
# =============================================================================

def calculate_company_reputation(job_text: str) -> Dict:
    """
    Calculate company reputation score from job posting.
    
    Returns:
        dict with:
            - score: int (0-100)
            - company_name: str or None
            - sentiment: str
            - review_links: dict of platform URLs
            - signals: positive/negative signals found
    """
    # 1. Extract company name
    company_name = extract_company_name(job_text)
    
    # 2. Check known company database
    known_data = get_known_company_score(company_name) if company_name else None
    
    # 3. Analyze job text sentiment
    sentiment_data = analyze_job_sentiment(job_text)
    
    # 4. Calculate base score
    if known_data:
        base_score = known_data["score"]
        source = "known_company"
    else:
        base_score = 70  # Neutral for unknown companies
        source = "estimated"
    
    # 5. Apply sentiment adjustment
    final_score = max(0, min(100, base_score + sentiment_data["adjustment"]))
    
    # 6. Generate review links
    review_links = generate_review_links(company_name) if company_name else {}
    
    return {
        "score": final_score,
        "company_name": company_name,
        "source": source,
        "sentiment": sentiment_data["sentiment"],
        "positive_signals": sentiment_data["positive_signals"],
        "negative_signals": sentiment_data["negative_signals"],
        "review_links": review_links,
    }
