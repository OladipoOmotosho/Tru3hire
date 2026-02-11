"""
Canadian Industry Taxonomy

This module defines the industry hierarchy for the Canadian Job Market.
Structure: Sector -> Sub-industry -> Specialization

Based on the North American Industry Classification System (NAICS) but simplified for job search.
"""

from typing import Optional, List, Tuple, Dict, Any

# =============================================================================
# Industry Hierarchy
# =============================================================================

CANADA_INDUSTRY_HIERARCHY: Dict[str, Dict[str, List[str]]] = {
    "Technology": {
        "SaaS": ["B2B SaaS", "Developer Tools", "CRM", "ERP"],
        "FinTech": ["Payments", "Lending", "WealthTech", "InsurTech"],
        "AI/ML": ["Generative AI", "Computer Vision", "NLP", "Robotics"],
        "CleanTech": ["Carbon Capture", "Smart Grid", "EV Infrastructure"],
        "HealthTech": ["EHR Systems", "Telemedicine", "MedTech"],
        "Cybersecurity": ["Network Security", "IAM", "Threat Intelligence"]
    },
    "Finance": {
        "Banking": ["Retail Banking", "Commercial Banking", "Investment Banking"],
        "Insurance": ["Life & Health", "Property & Casualty", "Reinsurance"],
        "Asset Management": ["Mutual Funds", "Pension Funds", "Private Equity"],
        "Accounting": ["Audit", "Tax", "Advisory", "Bookkeeping"]
    },
    "Healthcare": {
        "Clinical": ["Nursing", "Physicians", "Dental", "Pharmacy"],
        "Hospitals": ["Acute Care", "Emergency", "Administration"],
        "Long-term Care": ["Senior Care", "Home Health", "Rehabilitation"],
        "Public Health": ["Epidemiology", "Health Policy", "Community Health"]
    },
    "Engineering & Construction": {
        "Civil": ["Structural", "Transportation", "Geotechnical", "Municipal"],
        "Construction": ["Residential", "Commercial", "Industrial", "Trades"],
        "Mechanical": ["HVAC", "Manufacturing Systems", "Automotive"],
        "Electrical": ["Power Systems", "Electronics", "Telecommunications"]
    },
    "Energy & Natural Resources": {
        "Oil & Gas": ["Upstream", "Midstream", "Downstream", "Oilfield Services"],
        "Mining": ["Exploration", "Operations", "Metallurgy"],
        "Renewables": ["Wind", "Solar", "Hydro", "Geothermal"],
        "Forestry": ["Logging", "Paper & Pulp", "Silviculture"]
    },
    "Government & Public Sector": {
        "Federal": ["Policy", "Defense", "Service Canada", "CRA"],
        "Provincial": ["Education", "Health Services", "Transportation"],
        "Municipal": ["City Planning", "Public Works", "Emergency Services"]
    }
}

# =============================================================================
# Alias Mappings
# =============================================================================

_MANUAL_ALIASES = {
    # Tech
    "tech": ("Technology", None),
    "software": ("Technology", None),
    "developer": ("Technology", None),
    "it": ("Technology", None),
    
    # Finance
    "bank": ("Finance", "Banking"),
    "cpa": ("Finance", "Accounting"),
    
    # Healthcare
    "nurse": ("Healthcare", "Clinical"),
    "rn": ("Healthcare", "Clinical"),
    "doctor": ("Healthcare", "Clinical"),
    "hospital": ("Healthcare", "Hospitals"),
    
    # Engineering
    "engineer": ("Engineering & Construction", None),
    "civil engineer": ("Engineering & Construction", "Civil"),
    "construction": ("Engineering & Construction", "Construction"),
    "trades": ("Engineering & Construction", "Construction"),
    
    # Energy
    "oil": ("Energy & Natural Resources", "Oil & Gas"),
    "mining": ("Energy & Natural Resources", "Mining"),
    "hydro": ("Energy & Natural Resources", "Renewables"),
    
    # Government
    "gov": ("Government & Public Sector", None),
    "public servant": ("Government & Public Sector", None),
}

# =============================================================================
# Lookup Logic
# =============================================================================

INDUSTRY_ALIASES: Dict[str, Tuple[str, Optional[str]]] = {}

def _build_indexes():
    for sector, subs in CANADA_INDUSTRY_HIERARCHY.items():
        INDUSTRY_ALIASES[sector.lower()] = (sector, None)
        for sub, specs in subs.items():
            INDUSTRY_ALIASES[sub.lower()] = (sector, sub)
            for spec in specs:
                 # Map specialization to sub-industry
                INDUSTRY_ALIASES[spec.lower()] = (sector, sub)
    
    # Overwrite with manual
    INDUSTRY_ALIASES.update(_MANUAL_ALIASES)

_build_indexes()

def match_industry(signal: str) -> Optional[Dict[str, Any]]:
    """Match a signal to a Canadian industry position"""
    s_lower = signal.lower().strip()
    
    if s_lower in INDUSTRY_ALIASES:
        sector, sub = INDUSTRY_ALIASES[s_lower]
        if sub:
             # Return sub-industry level details
             return {
                 "level": "sub_industry",
                 "value": sub,
                 "parent_chain": [sector],
                 "children": CANADA_INDUSTRY_HIERARCHY[sector][sub]
             }
        else:
            return {
                "level": "sector",
                "value": sector,
                "parent_chain": [],
                "children": list(CANADA_INDUSTRY_HIERARCHY[sector].keys())
            }
    return None


def match_industry_signal(signal: str) -> Optional[Tuple[str, Optional[str]]]:
    """
    Match a raw signal string to an industry position.
    Returns (sector, sub_industry) or None.
    Wrapper for match_industry to maintain compatibility.
    """
    result = match_industry(signal)
    if result:
        if result["level"] == "sub_industry":
            # Parent chain [0] is sector
            return result["parent_chain"][0], result["value"]
        elif result["level"] == "sector":
            return result["value"], None
    return None
