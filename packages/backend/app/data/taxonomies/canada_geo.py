"""
Canadian Geographical Hierarchy

This module defines the hierarchical structure of Canadian geography for the Faceted Search system.
Structure: Country -> Province -> Region (Optional) -> City

Data is static and loaded at startup.
"""

from typing import Dict, List, Optional, Any

# =============================================================================
# Geo Hierarchy
# =============================================================================

CANADA_GEO_HIERARCHY: Dict[str, Dict[str, Any]] = {
    "Canada": {
        "Ontario": {
            "Greater Toronto Area (GTA)": [
                "Toronto", "Mississauga", "Brampton", "Markham", "Vaughan", 
                "Richmond Hill", "Oakville", "Burlington", "Pickering", "Ajax", "Whitby", "Oshawa"
            ],
            "Ottawa Region": ["Ottawa", "Gatineau", "Kanata", "Nepean"],
            "Southwestern Ontario": ["London", "Windsor", "Kitchener", "Waterloo", "Cambridge", "Guelph", "Hamilton"],
            "Eastern Ontario": ["Kingston", "Peterborough", "Belleville"],
            "Northern Ontario": ["Greater Sudbury", "Thunder Bay", "Sault Ste. Marie", "North Bay"]
        },
        "British Columbia": {
            "Metro Vancouver": [
                "Vancouver", "Surrey", "Burnaby", "Richmond", "Coquitlam", 
                "Langley", "Delta", "North Vancouver", "Maple Ridge", "New Westminster"
            ],
            "Vancouver Island": ["Victoria", "Nanaimo", "Saanich"],
            "Okanagan": ["Kelowna", "Kamloops", "Penticton"],
            "Fraser Valley": ["Abbotsford", "Chilliwack", "Mission"]
        },
        "Quebec": {
            "Greater Montreal": [
                "Montreal", "Laval", "Longueuil", "Brossard", "Terrebonne", "Repentigny"
            ],
            "Quebec City Area": ["Quebec City", "Levis"],
            "Gatineau": ["Gatineau", "Hull"], # Often cross-referenced with Ottawa
            "Sherbrooke": ["Sherbrooke"]
        },
        "Alberta": {
            "Calgary Region": ["Calgary", "Airdrie", "Cochrane", "Chestermere"],
            "Edmonton Region": ["Edmonton", "St. Albert", "Sherwood Park", "Spruce Grove", "Leduc"],
            "Central Alberta": ["Red Deer"],
            "Southern Alberta": ["Lethbridge", "Medicine Hat"],
            "Northern Alberta": ["Fort McMurray", "Grande Prairie"]
        },
        "Manitoba": {
            "Winnipeg Capital Region": ["Winnipeg", "Selkirk"],
            "Westman": ["Brandon"]
        },
        "Saskatchewan": {
            "Saskatoon Region": ["Saskatoon", "Martensville"],
            "Regina Region": ["Regina"],
        },
        "Nova Scotia": {
            "Halifax Region": ["Halifax", "Dartmouth", "Bedford"],
            "Cape Breton": ["Sydney"]
        },
        "New Brunswick": {
            "Greater Moncton": ["Moncton", "Dieppe", "Riverview"],
            "Saint John": ["Saint John"],
            "Fredericton": ["Fredericton"]
        },
        "Newfoundland and Labrador": {
            "St. John's Region": ["St. John's", "Mount Pearl", "Paradise"]
        },
        "Prince Edward Island": {
            "Charlottetown": ["Charlottetown", "Stratford"]
        },
        # Territories (Simplified as single regions for now due to lower job volume)
        "Yukon": {
            "Yukon Territory": ["Whitehorse"]
        },
        "Northwest Territories": {
            "NWT": ["Yellowknife"]
        },
        "Nunavut": {
            "Nunavut": ["Iqaluit"]
        }
    }
}

# =============================================================================
# Helper Functions
# =============================================================================

def get_provinces() -> List[str]:
    """Return a list of all Canadian provinces and territories."""
    return list(CANADA_GEO_HIERARCHY["Canada"].keys())

def get_regions(province: str) -> List[str]:
    """Return a list of regions within a specific province."""
    if province in CANADA_GEO_HIERARCHY["Canada"]:
        return list(CANADA_GEO_HIERARCHY["Canada"][province].keys())
    return []

def get_cities(province: str, region: Optional[str] = None) -> List[str]:
    """
    Return a list of cities in a province. 
    If region is provided, returns cities only in that region.
    """
    cities = []
    if province in CANADA_GEO_HIERARCHY["Canada"]:
        prov_data = CANADA_GEO_HIERARCHY["Canada"][province]
        if region:
            if region in prov_data:
                cities.extend(prov_data[region])
        else:
            for r_cities in prov_data.values():
                cities.extend(r_cities)
    # Deduplicate and sort
    return sorted(list(set(cities)))

def find_location_position(location_name: str) -> Optional[Dict[str, Any]]:
    """
    Identify the position of a location string in the hierarchy.
    Returns a dictionary with 'level', 'value', 'parent_chain' if found.
    Handles case-insensitive matching.
    """
    name_lower = location_name.lower().strip()
    
    # 1. Check Top Level (Country)
    if name_lower == "canada":
         return {
            "level": "country",
            "value": "Canada",
            "parent_chain": [],
            "children": get_provinces()
        }

    # 2. Check Provinces
    for prov in CANADA_GEO_HIERARCHY["Canada"]:
        if prov.lower() == name_lower.lower():
            return {
                "level": "province",
                "value": prov,
                "parent_chain": ["Canada"],
                "children": get_regions(prov)
            }
            
    # 3. Check Regions (Iterate through all provinces)
    for prov, regions_dict in CANADA_GEO_HIERARCHY["Canada"].items():
        for region_name, cities_list in regions_dict.items():
            if region_name.lower() == name_lower:
                 return {
                    "level": "region",
                    "value": region_name,
                    "parent_chain": [prov, "Canada"],
                    "children": cities_list
                }
                
    # 4. Check Cities (Deep search)
    for prov, regions_dict in CANADA_GEO_HIERARCHY["Canada"].items():
        for region_name, cities_list in regions_dict.items():
            for city in cities_list:
                if city.lower() == name_lower:
                     return {
                        "level": "city",
                        "value": city,
                        "parent_chain": [region_name, prov, "Canada"],
                        "children": []
                    }
                    
    return None
