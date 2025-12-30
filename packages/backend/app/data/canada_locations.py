"""
Canadian Locations Data

Static data for Canadian provinces/territories and major cities.
Used for job search location filtering.
"""

from typing import List, Dict, Optional

# =============================================================================
# Provinces and Territories
# =============================================================================

PROVINCES = [
    {"code": "AB", "name": "Alberta"},
    {"code": "BC", "name": "British Columbia"},
    {"code": "MB", "name": "Manitoba"},
    {"code": "NB", "name": "New Brunswick"},
    {"code": "NL", "name": "Newfoundland and Labrador"},
    {"code": "NS", "name": "Nova Scotia"},
    {"code": "NT", "name": "Northwest Territories"},
    {"code": "NU", "name": "Nunavut"},
    {"code": "ON", "name": "Ontario"},
    {"code": "PE", "name": "Prince Edward Island"},
    {"code": "QC", "name": "Quebec"},
    {"code": "SK", "name": "Saskatchewan"},
    {"code": "YT", "name": "Yukon"},
]

# =============================================================================
# Cities by Province
# =============================================================================

CITIES_BY_PROVINCE: Dict[str, List[str]] = {
    "Alberta": [
        "Calgary",
        "Edmonton",
        "Red Deer",
        "Lethbridge",
        "St. Albert",
        "Medicine Hat",
        "Grande Prairie",
        "Airdrie",
        "Spruce Grove",
        "Leduc",
        "Fort McMurray",
    ],
    "British Columbia": [
        "Vancouver",
        "Victoria",
        "Surrey",
        "Burnaby",
        "Richmond",
        "Coquitlam",
        "Kelowna",
        "Langley",
        "Abbotsford",
        "Nanaimo",
        "Kamloops",
        "New Westminster",
        "North Vancouver",
        "Chilliwack",
        "Prince George",
    ],
    "Manitoba": [
        "Winnipeg",
        "Brandon",
        "Steinbach",
        "Thompson",
        "Portage la Prairie",
        "Selkirk",
        "Winkler",
        "Morden",
    ],
    "New Brunswick": [
        "Moncton",
        "Saint John",
        "Fredericton",
        "Dieppe",
        "Miramichi",
        "Edmundston",
        "Bathurst",
    ],
    "Newfoundland and Labrador": [
        "St. John's",
        "Mount Pearl",
        "Corner Brook",
        "Conception Bay South",
        "Paradise",
        "Grand Falls-Windsor",
        "Gander",
    ],
    "Nova Scotia": [
        "Halifax",
        "Dartmouth",
        "Sydney",
        "Truro",
        "New Glasgow",
        "Glace Bay",
        "Kentville",
        "Amherst",
    ],
    "Northwest Territories": [
        "Yellowknife",
        "Hay River",
        "Inuvik",
        "Fort Smith",
    ],
    "Nunavut": [
        "Iqaluit",
        "Rankin Inlet",
        "Arviat",
        "Baker Lake",
    ],
    "Ontario": [
        "Toronto",
        "Ottawa",
        "Mississauga",
        "Brampton",
        "Hamilton",
        "London",
        "Markham",
        "Vaughan",
        "Kitchener",
        "Windsor",
        "Richmond Hill",
        "Oakville",
        "Burlington",
        "Greater Sudbury",
        "Oshawa",
        "Barrie",
        "St. Catharines",
        "Cambridge",
        "Kingston",
        "Guelph",
        "Waterloo",
        "Thunder Bay",
        "Chatham-Kent",
        "Whitby",
        "Ajax",
        "Pickering",
        "Niagara Falls",
        "Peterborough",
        "Sault Ste. Marie",
        "Newmarket",
    ],
    "Prince Edward Island": [
        "Charlottetown",
        "Summerside",
        "Stratford",
        "Cornwall",
    ],
    "Quebec": [
        "Montreal",
        "Quebec City",
        "Laval",
        "Gatineau",
        "Longueuil",
        "Sherbrooke",
        "Saguenay",
        "Levis",
        "Trois-Rivieres",
        "Terrebonne",
        "Saint-Jean-sur-Richelieu",
        "Repentigny",
        "Brossard",
        "Drummondville",
        "Saint-Jerome",
        "Granby",
    ],
    "Saskatchewan": [
        "Saskatoon",
        "Regina",
        "Prince Albert",
        "Moose Jaw",
        "Swift Current",
        "Yorkton",
        "North Battleford",
        "Estevan",
    ],
    "Yukon": [
        "Whitehorse",
        "Dawson City",
        "Watson Lake",
    ],
}


# =============================================================================
# Helper Functions
# =============================================================================

def get_all_provinces() -> List[Dict[str, str]]:
    """Get list of all provinces with code and name."""
    return PROVINCES


def get_province_names() -> List[str]:
    """Get list of province names only."""
    return [p["name"] for p in PROVINCES]


def get_cities_for_province(province_name: str) -> List[str]:
    """Get list of cities for a given province name."""
    return CITIES_BY_PROVINCE.get(province_name, [])


def is_valid_province(province_name: str) -> bool:
    """Check if province name is valid."""
    return province_name in CITIES_BY_PROVINCE


def is_valid_city(province_name: str, city_name: str) -> bool:
    """Check if city is valid for the given province."""
    cities = CITIES_BY_PROVINCE.get(province_name, [])
    return city_name in cities


def get_province_code(province_name: str) -> Optional[str]:
    """Get province code from name."""
    for p in PROVINCES:
        if p["name"] == province_name:
            return p["code"]
    return None
