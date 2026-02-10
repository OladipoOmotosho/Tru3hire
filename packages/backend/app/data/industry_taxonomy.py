"""
Industry Taxonomy

Static industry hierarchy: Sector → Sub-industry → Specializations.
16 sectors covering the full breadth of the economy.

Used by the Faceted Spectrum system for industry-based expand/narrow suggestions.
Loaded once at startup. ~15KB memory.
"""

from typing import Optional, List, Tuple


# =============================================================================
# Industry Hierarchy — 16 Sectors
# =============================================================================

INDUSTRY_HIERARCHY = {
    # ─── TECHNOLOGY ───────────────────────────────────────────────
    "Technology": {
        "SaaS": ["B2B SaaS", "Developer Tools", "Productivity", "CRM"],
        "FinTech": ["Payments", "Lending", "Crypto/Web3", "InsurTech", "RegTech"],
        "AI/ML": ["NLP", "Computer Vision", "Generative AI", "Robotics"],
        "E-commerce": ["Marketplace", "DTC", "Logistics Tech"],
        "Cybersecurity": ["Identity", "Threat Detection", "Cloud Security"],
        "CleanTech": ["Carbon Tech", "Smart Grid", "Sustainability Software"],
    },

    # ─── FINANCE & BANKING ────────────────────────────────────────
    "Finance": {
        "Banking": ["Retail Banking", "Investment Banking", "Credit Unions"],
        "Asset Management": ["Hedge Funds", "Private Equity", "Venture Capital", "Mutual Funds"],
        "Insurance": ["Life Insurance", "Property & Casualty", "Reinsurance"],
        "Accounting": ["Public Accounting", "Audit", "Tax Advisory", "Forensic Accounting"],
        "Financial Planning": ["Wealth Management", "Retirement Planning", "Financial Advisory"],
    },

    # ─── HEALTHCARE & LIFE SCIENCES ──────────────────────────────
    "Healthcare": {
        "BioTech": ["Pharma", "Genomics", "Drug Discovery", "Clinical Trials"],
        "HealthTech": ["Telemedicine", "EHR", "Medical Devices", "Health Analytics"],
        "Clinical": ["Hospitals", "Primary Care", "Specialty Clinics", "Mental Health"],
        "Wellness": ["Fitness", "Nutrition", "Senior Care", "Home Health"],
    },

    # ─── AGRICULTURE & FOOD ──────────────────────────────────────
    "Agriculture": {
        "AgTech": ["Precision Agriculture", "Farm Automation", "Drone Surveying", "AgriData"],
        "Farming": ["Crop Production", "Livestock", "Dairy", "Organic Farming"],
        "Food Production": ["Food Processing", "Beverage", "Packaging", "Cold Chain"],
        "Forestry & Fishing": ["Timber", "Aquaculture", "Commercial Fishing", "Forestry Management"],
    },

    # ─── ENERGY & UTILITIES ──────────────────────────────────────
    "Energy": {
        "Renewables": ["Solar", "Wind", "Hydro", "Geothermal", "Battery Storage"],
        "Oil & Gas": ["Upstream", "Midstream", "Downstream", "Oilfield Services"],
        "Utilities": ["Electric Utilities", "Water", "Waste Management", "Natural Gas Distribution"],
        "Nuclear": ["Nuclear Power", "Nuclear Engineering", "Radiation Safety"],
        "Mining": ["Coal", "Metals", "Minerals", "Quarrying"],
    },

    # ─── MANUFACTURING & INDUSTRIAL ──────────────────────────────
    "Manufacturing": {
        "Automotive": ["Vehicle Assembly", "Auto Parts", "EV Manufacturing"],
        "Aerospace & Defense": ["Aircraft", "Defense Systems", "Space Tech", "Satellites"],
        "Electronics": ["Semiconductors", "Consumer Electronics", "IoT Devices"],
        "Industrial": ["Heavy Machinery", "Industrial Automation", "3D Printing"],
        "Chemicals": ["Specialty Chemicals", "Petrochemicals", "Plastics", "Coatings"],
        "Textiles": ["Apparel", "Footwear", "Textile Manufacturing"],
    },

    # ─── EDUCATION ────────────────────────────────────────────────
    "Education": {
        "EdTech": ["K-12 Tech", "Higher Ed Tech", "LMS", "Online Learning"],
        "K-12": ["Public Schools", "Private Schools", "Charter Schools"],
        "Higher Education": ["Universities", "Community Colleges", "Research Institutes"],
        "Corporate Training": ["L&D", "Professional Development", "Certification"],
        "Tutoring & Test Prep": ["SAT/GRE Prep", "Language Learning", "STEM Tutoring"],
    },

    # ─── GOVERNMENT & PUBLIC SECTOR ──────────────────────────────
    "Government": {
        "Federal": ["Federal Agencies", "Military", "Intelligence", "Diplomacy"],
        "State & Local": ["Municipal", "State Agencies", "Public Works", "Emergency Services"],
        "GovTech": ["Civic Tech", "Digital Government", "Public Safety Tech"],
        "Policy & Research": ["Think Tanks", "Policy Analysis", "Legislative"],
    },

    # ─── REAL ESTATE ─────────────────────────────────────────────
    "Real Estate": {
        "Commercial": ["Office", "Retail Spaces", "Industrial Properties"],
        "Residential": ["Home Sales", "Rentals", "Property Management"],
        "PropTech": ["Real Estate Platforms", "Smart Buildings", "Virtual Tours"],
        "REITs": ["Equity REITs", "Mortgage REITs", "Hybrid REITs"],
    },

    # ─── CONSTRUCTION ────────────────────────────────────────────
    "Construction": {
        "General Contracting": ["Residential Construction", "Commercial Construction"],
        "Specialty Trades": ["Electrical", "Plumbing", "HVAC", "Roofing"],
        "Infrastructure": ["Roads & Bridges", "Tunnels", "Public Transit", "Water Systems"],
        "Architecture & Engineering": ["Civil Engineering", "Structural", "Environmental"],
    },

    # ─── TRANSPORTATION & LOGISTICS ──────────────────────────────
    "Transportation": {
        "Logistics": ["Freight", "Warehousing", "Supply Chain", "Last-mile Delivery"],
        "Shipping": ["Maritime", "Air Freight", "Rail", "Trucking"],
        "Mobility": ["Rideshare", "Autonomous Vehicles", "Micromobility", "Fleet Management"],
        "Aviation": ["Airlines", "Airports", "Air Traffic Control", "MRO"],
    },

    # ─── MEDIA & ENTERTAINMENT ───────────────────────────────────
    "Media & Entertainment": {
        "Digital Media": ["Streaming", "Social Media", "Content Platforms", "Podcasting"],
        "Publishing": ["News", "Books", "Magazines", "Academic Publishing"],
        "Gaming": ["Console", "Mobile Gaming", "Esports", "Game Studios"],
        "Film & TV": ["Production", "Post-Production", "Animation", "VFX"],
        "Advertising": ["Digital Advertising", "Creative Agencies", "PR", "Influencer Marketing"],
        "Music": ["Record Labels", "Music Streaming", "Live Events", "Artist Management"],
    },

    # ─── LEGAL ────────────────────────────────────────────────────
    "Legal": {
        "Law Firms": ["Corporate Law", "Litigation", "IP Law", "Employment Law"],
        "LegalTech": ["Contract Management", "Legal AI", "E-discovery"],
        "Compliance": ["Regulatory", "Risk Management", "Data Privacy", "AML/KYC"],
        "In-house Counsel": ["General Counsel", "Corporate Legal", "M&A Legal"],
    },

    # ─── HOSPITALITY & TOURISM ───────────────────────────────────
    "Hospitality": {
        "Hotels & Resorts": ["Luxury", "Boutique", "Budget", "Vacation Rentals"],
        "Food & Beverage": ["Restaurants", "Catering", "Fast Food", "Bars & Clubs"],
        "Travel": ["Travel Agencies", "Tour Operators", "Cruises", "Travel Tech"],
        "Events": ["Event Planning", "Conferences", "Venues", "Ticketing"],
    },

    # ─── RETAIL & CONSUMER ───────────────────────────────────────
    "Retail": {
        "E-commerce": ["Online Retail", "D2C Brands", "Subscription Commerce"],
        "Brick & Mortar": ["Department Stores", "Specialty Retail", "Grocery"],
        "Luxury & Fashion": ["Luxury Goods", "Fashion Brands", "Jewelry", "Watches"],
        "Consumer Goods": ["CPG", "Home Goods", "Personal Care", "Pet Products"],
    },

    # ─── TELECOM ──────────────────────────────────────────────────
    "Telecom": {
        "Carriers": ["Mobile Operators", "ISPs", "Cable", "Fiber"],
        "Network Equipment": ["5G Infrastructure", "Networking Hardware", "Satellite"],
        "Unified Communications": ["VoIP", "Video Conferencing", "UCaaS"],
    },

    # ─── NON-PROFIT & SOCIAL IMPACT ──────────────────────────────
    "Non-profit": {
        "NGOs": ["International Development", "Humanitarian Aid", "Human Rights"],
        "Social Enterprise": ["Social Impact", "Impact Investing", "B-Corps"],
        "Foundations": ["Philanthropy", "Grantmaking", "Community Foundations"],
        "Environmental": ["Conservation", "Climate Action", "Wildlife", "Ocean Protection"],
    },
}


# =============================================================================
# Alias Mappings (natural language → hierarchy position)
# =============================================================================

# Manually curated aliases for common natural language terms
_MANUAL_ALIASES = {
    # Technology
    "tech": ("Technology", None),
    "software": ("Technology", None),
    "saas": ("Technology", "SaaS"),
    "fintech": ("Technology", "FinTech"),
    "ai": ("Technology", "AI/ML"),
    "artificial intelligence": ("Technology", "AI/ML"),
    "machine learning": ("Technology", "AI/ML"),
    "ecommerce": ("Technology", "E-commerce"),
    "e-commerce": ("Technology", "E-commerce"),
    "cybersecurity": ("Technology", "Cybersecurity"),
    "cyber security": ("Technology", "Cybersecurity"),
    "cleantech": ("Technology", "CleanTech"),
    "clean tech": ("Technology", "CleanTech"),
    "crypto": ("Technology", "FinTech"),
    "blockchain": ("Technology", "FinTech"),
    "web3": ("Technology", "FinTech"),

    # Finance
    "finance": ("Finance", None),
    "financial": ("Finance", None),
    "banking": ("Finance", "Banking"),
    "banks": ("Finance", "Banking"),
    "investment banking": ("Finance", "Banking"),
    "hedge fund": ("Finance", "Asset Management"),
    "hedge funds": ("Finance", "Asset Management"),
    "private equity": ("Finance", "Asset Management"),
    "venture capital": ("Finance", "Asset Management"),
    "vc": ("Finance", "Asset Management"),
    "insurance": ("Finance", "Insurance"),
    "accounting": ("Finance", "Accounting"),
    "wealth management": ("Finance", "Financial Planning"),

    # Healthcare
    "healthcare": ("Healthcare", None),
    "health care": ("Healthcare", None),
    "medical": ("Healthcare", "Clinical"),
    "hospitals": ("Healthcare", "Clinical"),
    "biotech": ("Healthcare", "BioTech"),
    "pharma": ("Healthcare", "BioTech"),
    "pharmaceutical": ("Healthcare", "BioTech"),
    "healthtech": ("Healthcare", "HealthTech"),
    "telemedicine": ("Healthcare", "HealthTech"),
    "mental health": ("Healthcare", "Clinical"),
    "fitness": ("Healthcare", "Wellness"),

    # Agriculture
    "agriculture": ("Agriculture", None),
    "farming": ("Agriculture", "Farming"),
    "agritech": ("Agriculture", "AgTech"),
    "agtech": ("Agriculture", "AgTech"),
    "food": ("Agriculture", "Food Production"),
    "food production": ("Agriculture", "Food Production"),
    "dairy": ("Agriculture", "Farming"),
    "livestock": ("Agriculture", "Farming"),
    "forestry": ("Agriculture", "Forestry & Fishing"),
    "fishing": ("Agriculture", "Forestry & Fishing"),
    "aquaculture": ("Agriculture", "Forestry & Fishing"),

    # Energy
    "energy": ("Energy", None),
    "oil and gas": ("Energy", "Oil & Gas"),
    "oil & gas": ("Energy", "Oil & Gas"),
    "petroleum": ("Energy", "Oil & Gas"),
    "renewable": ("Energy", "Renewables"),
    "renewables": ("Energy", "Renewables"),
    "solar": ("Energy", "Renewables"),
    "wind energy": ("Energy", "Renewables"),
    "green energy": ("Energy", "Renewables"),
    "nuclear": ("Energy", "Nuclear"),
    "mining": ("Energy", "Mining"),
    "utilities": ("Energy", "Utilities"),

    # Manufacturing
    "manufacturing": ("Manufacturing", None),
    "automotive": ("Manufacturing", "Automotive"),
    "cars": ("Manufacturing", "Automotive"),
    "ev": ("Manufacturing", "Automotive"),
    "electric vehicles": ("Manufacturing", "Automotive"),
    "aerospace": ("Manufacturing", "Aerospace & Defense"),
    "defense": ("Manufacturing", "Aerospace & Defense"),
    "space": ("Manufacturing", "Aerospace & Defense"),
    "semiconductors": ("Manufacturing", "Electronics"),
    "chips": ("Manufacturing", "Electronics"),
    "electronics": ("Manufacturing", "Electronics"),

    # Education
    "education": ("Education", None),
    "edtech": ("Education", "EdTech"),
    "teaching": ("Education", "K-12"),
    "university": ("Education", "Higher Education"),
    "universities": ("Education", "Higher Education"),
    "training": ("Education", "Corporate Training"),
    "tutoring": ("Education", "Tutoring & Test Prep"),

    # Government
    "government": ("Government", None),
    "federal": ("Government", "Federal"),
    "military": ("Government", "Federal"),
    "public sector": ("Government", None),
    "govtech": ("Government", "GovTech"),
    "civic tech": ("Government", "GovTech"),

    # Real Estate & Construction
    "real estate": ("Real Estate", None),
    "property": ("Real Estate", None),
    "proptech": ("Real Estate", "PropTech"),
    "construction": ("Construction", None),
    "infrastructure": ("Construction", "Infrastructure"),
    "architecture": ("Construction", "Architecture & Engineering"),
    "plumbing": ("Construction", "Specialty Trades"),
    "hvac": ("Construction", "Specialty Trades"),
    "electrical": ("Construction", "Specialty Trades"),

    # Transportation
    "transportation": ("Transportation", None),
    "logistics": ("Transportation", "Logistics"),
    "supply chain": ("Transportation", "Logistics"),
    "shipping": ("Transportation", "Shipping"),
    "trucking": ("Transportation", "Shipping"),
    "freight": ("Transportation", "Logistics"),
    "aviation": ("Transportation", "Aviation"),
    "airlines": ("Transportation", "Aviation"),
    "rideshare": ("Transportation", "Mobility"),

    # Media & Entertainment
    "media": ("Media & Entertainment", None),
    "entertainment": ("Media & Entertainment", None),
    "gaming": ("Media & Entertainment", "Gaming"),
    "games": ("Media & Entertainment", "Gaming"),
    "esports": ("Media & Entertainment", "Gaming"),
    "streaming": ("Media & Entertainment", "Digital Media"),
    "social media": ("Media & Entertainment", "Digital Media"),
    "publishing": ("Media & Entertainment", "Publishing"),
    "news": ("Media & Entertainment", "Publishing"),
    "film": ("Media & Entertainment", "Film & TV"),
    "movies": ("Media & Entertainment", "Film & TV"),
    "television": ("Media & Entertainment", "Film & TV"),
    "tv": ("Media & Entertainment", "Film & TV"),
    "animation": ("Media & Entertainment", "Film & TV"),
    "vfx": ("Media & Entertainment", "Film & TV"),
    "advertising": ("Media & Entertainment", "Advertising"),
    "marketing": ("Media & Entertainment", "Advertising"),
    "pr": ("Media & Entertainment", "Advertising"),
    "music": ("Media & Entertainment", "Music"),

    # Legal
    "legal": ("Legal", None),
    "law": ("Legal", "Law Firms"),
    "law firm": ("Legal", "Law Firms"),
    "law firms": ("Legal", "Law Firms"),
    "legaltech": ("Legal", "LegalTech"),
    "compliance": ("Legal", "Compliance"),
    "regulatory": ("Legal", "Compliance"),

    # Hospitality
    "hospitality": ("Hospitality", None),
    "hotels": ("Hospitality", "Hotels & Resorts"),
    "restaurants": ("Hospitality", "Food & Beverage"),
    "catering": ("Hospitality", "Food & Beverage"),
    "travel": ("Hospitality", "Travel"),
    "tourism": ("Hospitality", "Travel"),
    "events": ("Hospitality", "Events"),
    "event planning": ("Hospitality", "Events"),

    # Retail
    "retail": ("Retail", None),
    "fashion": ("Retail", "Luxury & Fashion"),
    "luxury": ("Retail", "Luxury & Fashion"),
    "grocery": ("Retail", "Brick & Mortar"),
    "cpg": ("Retail", "Consumer Goods"),
    "consumer goods": ("Retail", "Consumer Goods"),

    # Telecom
    "telecom": ("Telecom", None),
    "telecommunications": ("Telecom", None),
    "5g": ("Telecom", "Network Equipment"),

    # Non-profit
    "non-profit": ("Non-profit", None),
    "nonprofit": ("Non-profit", None),
    "ngo": ("Non-profit", "NGOs"),
    "ngos": ("Non-profit", "NGOs"),
    "charity": ("Non-profit", "Foundations"),
    "philanthropy": ("Non-profit", "Foundations"),
    "social impact": ("Non-profit", "Social Enterprise"),
    "social good": ("Non-profit", "Social Enterprise"),
    "conservation": ("Non-profit", "Environmental"),
    "climate": ("Non-profit", "Environmental"),
    "environment": ("Non-profit", "Environmental"),
    "environmental": ("Non-profit", "Environmental"),
}


# =============================================================================
# Lookup Indexes (built at import time)
# =============================================================================

_SECTOR_LOOKUP: dict = {}        # "technology" → "Technology"
_SUB_INDUSTRY_LOOKUP: dict = {}  # "saas" → ("Technology", "SaaS", [...specializations])
_SPECIALIZATION_LOOKUP: dict = {}  # "payments" → ("Technology", "FinTech", "Payments")

# Combined aliases: manual + auto-generated from hierarchy
INDUSTRY_ALIASES: dict = {}  # "farming" → ("Agriculture", "Farming")


def _build_indexes():
    """Build flat lookup dicts from the hierarchy."""
    # Build from hierarchy structure
    for sector_name, sub_industries in INDUSTRY_HIERARCHY.items():
        _SECTOR_LOOKUP[sector_name.lower()] = sector_name

        for sub_name, specializations in sub_industries.items():
            _SUB_INDUSTRY_LOOKUP[sub_name.lower()] = (sector_name, sub_name, specializations)

            for spec in specializations:
                _SPECIALIZATION_LOOKUP[spec.lower()] = (sector_name, sub_name, spec)

    # Build combined alias dict
    # Start with auto-generated from hierarchy names
    for sector_name in _SECTOR_LOOKUP.values():
        INDUSTRY_ALIASES[sector_name.lower()] = (sector_name, None)
    for sub_lower, (sector, sub, _) in _SUB_INDUSTRY_LOOKUP.items():
        INDUSTRY_ALIASES[sub_lower] = (sector, sub)
    for spec_lower, (sector, sub, spec) in _SPECIALIZATION_LOOKUP.items():
        INDUSTRY_ALIASES[spec_lower] = (sector, sub)

    # Layer manual aliases on top (these override auto-generated ones)
    INDUSTRY_ALIASES.update(_MANUAL_ALIASES)


_build_indexes()


# =============================================================================
# Public API
# =============================================================================

def find_industry(name: str) -> Optional[dict]:
    """
    Find an industry in the hierarchy by name or alias.
    
    Returns dict with keys: level, value, parent_chain, children, siblings
    or None if not found.
    """
    name_lower = name.lower().strip()

    # Check alias first (catches most natural language)
    if name_lower in INDUSTRY_ALIASES:
        sector, sub_industry = INDUSTRY_ALIASES[name_lower]

        if sub_industry:
            # Sub-industry level
            specializations = INDUSTRY_HIERARCHY.get(sector, {}).get(sub_industry, [])
            siblings = [s for s in INDUSTRY_HIERARCHY.get(sector, {}).keys() if s != sub_industry]
            return {
                "level": "sub_industry",
                "value": sub_industry,
                "parent_chain": [sector],
                "children": specializations,
                "siblings": siblings,
            }
        else:
            # Sector level
            sub_industries = list(INDUSTRY_HIERARCHY.get(sector, {}).keys())
            return {
                "level": "sector",
                "value": sector,
                "parent_chain": [],
                "children": sub_industries,
                "siblings": [],
            }

    # Check specialization directly
    if name_lower in _SPECIALIZATION_LOOKUP:
        sector, sub_industry, spec = _SPECIALIZATION_LOOKUP[name_lower]
        siblings = [s for s in INDUSTRY_HIERARCHY[sector][sub_industry] if s != spec]
        return {
            "level": "specialization",
            "value": spec,
            "parent_chain": [sub_industry, sector],
            "children": [],
            "siblings": siblings,
        }

    return None


def get_all_sectors() -> List[str]:
    """Get all sector names."""
    return list(INDUSTRY_HIERARCHY.keys())


def get_sub_industries(sector: str) -> List[str]:
    """Get all sub-industries for a given sector."""
    return list(INDUSTRY_HIERARCHY.get(sector, {}).keys())


def match_industry_signal(signal: str) -> Optional[Tuple[str, Optional[str]]]:
    """
    Match a raw signal string to an industry position.
    
    Returns (sector, sub_industry) or None.
    Used by signal_extractor/query_resolver to replace the flat INDUSTRY_SIGNALS dict.
    """
    signal_lower = signal.lower().strip()

    if signal_lower in INDUSTRY_ALIASES:
        return INDUSTRY_ALIASES[signal_lower]

    # For multi-word signals, try matching each word combo
    # But only if the signal itself is 2+ words (avoid false positives)
    words = signal_lower.split()
    if len(words) >= 2:
        # Try full signal, then progressively shorter
        for i in range(len(words)):
            for j in range(i + 2, len(words) + 1):
                phrase = " ".join(words[i:j])
                if phrase in INDUSTRY_ALIASES:
                    return INDUSTRY_ALIASES[phrase]

    return None
