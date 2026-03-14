"""
World Locations Hierarchy

Static geographic hierarchy: Continent → Country → Province/State → Cities (with lat/lon).
Used by the Faceted Spectrum system for geo-based expand/narrow suggestions.

Loaded once at startup. ~20KB memory.
"""

from typing import Optional, Tuple, List


# =============================================================================
# Geographic Hierarchy
# =============================================================================

GEO_HIERARCHY = {
    "North America": {
        "Canada": {
            "Alberta": {
                "cities": {
                    "Calgary": {"lat": 51.05, "lon": -114.07},
                    "Edmonton": {"lat": 53.55, "lon": -113.49},
                    "Red Deer": {"lat": 52.27, "lon": -113.81},
                    "Lethbridge": {"lat": 49.69, "lon": -112.83},
                },
                "lat": 53.93, "lon": -116.58,
            },
            "British Columbia": {
                "cities": {
                    "Vancouver": {"lat": 49.28, "lon": -123.12},
                    "Victoria": {"lat": 48.43, "lon": -123.37},
                    "Burnaby": {"lat": 49.25, "lon": -122.95},
                    "Surrey": {"lat": 49.19, "lon": -122.85},
                    "Kelowna": {"lat": 49.89, "lon": -119.50},
                },
                "lat": 53.73, "lon": -127.65,
            },
            "Manitoba": {
                "cities": {
                    "Winnipeg": {"lat": 49.90, "lon": -97.14},
                    "Brandon": {"lat": 49.84, "lon": -99.95},
                },
                "lat": 56.42, "lon": -98.74,
            },
            "New Brunswick": {
                "cities": {
                    "Fredericton": {"lat": 45.96, "lon": -66.64},
                    "Saint John": {"lat": 45.27, "lon": -66.06},
                    "Moncton": {"lat": 46.09, "lon": -64.77},
                },
                "lat": 46.50, "lon": -66.16,
            },
            "Newfoundland and Labrador": {
                "cities": {
                    "St. John's": {"lat": 47.56, "lon": -52.71},
                },
                "lat": 53.14, "lon": -57.66,
            },
            "Nova Scotia": {
                "cities": {
                    "Halifax": {"lat": 44.65, "lon": -63.57},
                    "Dartmouth": {"lat": 44.67, "lon": -63.57},
                },
                "lat": 44.68, "lon": -63.74,
            },
            "Ontario": {
                "cities": {
                    "Toronto": {"lat": 43.65, "lon": -79.38},
                    "Ottawa": {"lat": 45.42, "lon": -75.70},
                    "Mississauga": {"lat": 43.59, "lon": -79.64},
                    "Brampton": {"lat": 43.73, "lon": -79.76},
                    "Hamilton": {"lat": 43.26, "lon": -79.87},
                    "London": {"lat": 42.98, "lon": -81.25},
                    "Kitchener": {"lat": 43.45, "lon": -80.49},
                    "Waterloo": {"lat": 43.46, "lon": -80.52},
                    "Windsor": {"lat": 42.32, "lon": -83.04},
                    "Markham": {"lat": 43.86, "lon": -79.34},
                },
                "lat": 51.25, "lon": -85.32,
            },
            "Prince Edward Island": {
                "cities": {
                    "Charlottetown": {"lat": 46.24, "lon": -63.13},
                },
                "lat": 46.25, "lon": -63.00,
            },
            "Quebec": {
                "cities": {
                    "Montreal": {"lat": 45.50, "lon": -73.57},
                    "Quebec City": {"lat": 46.81, "lon": -71.21},
                    "Laval": {"lat": 45.57, "lon": -73.69},
                    "Gatineau": {"lat": 45.48, "lon": -75.70},
                    "Sherbrooke": {"lat": 45.40, "lon": -71.90},
                },
                "lat": 52.94, "lon": -73.55,
            },
            "Saskatchewan": {
                "cities": {
                    "Regina": {"lat": 50.45, "lon": -104.62},
                    "Saskatoon": {"lat": 52.13, "lon": -106.67},
                },
                "lat": 52.94, "lon": -106.45,
            },
            "Northwest Territories": {
                "cities": {
                    "Yellowknife": {"lat": 62.45, "lon": -114.37},
                },
                "lat": 64.27, "lon": -119.18,
            },
            "Nunavut": {
                "cities": {
                    "Iqaluit": {"lat": 63.75, "lon": -68.52},
                },
                "lat": 70.30, "lon": -83.11,
            },
            "Yukon": {
                "cities": {
                    "Whitehorse": {"lat": 60.72, "lon": -135.06},
                },
                "lat": 64.28, "lon": -135.00,
            },
        },
        "United States": {
            "California": {
                "cities": {
                    "San Francisco": {"lat": 37.77, "lon": -122.42},
                    "Los Angeles": {"lat": 34.05, "lon": -118.24},
                    "San Diego": {"lat": 32.72, "lon": -117.16},
                    "San Jose": {"lat": 37.34, "lon": -121.89},
                    "Palo Alto": {"lat": 37.44, "lon": -122.14},
                },
                "lat": 36.78, "lon": -119.42,
            },
            "New York": {
                "cities": {
                    "New York City": {"lat": 40.71, "lon": -74.01},
                    "Buffalo": {"lat": 42.89, "lon": -78.88},
                },
                "lat": 42.17, "lon": -74.95,
            },
            "Texas": {
                "cities": {
                    "Austin": {"lat": 30.27, "lon": -97.74},
                    "Dallas": {"lat": 32.78, "lon": -96.80},
                    "Houston": {"lat": 29.76, "lon": -95.37},
                    "San Antonio": {"lat": 29.42, "lon": -98.49},
                },
                "lat": 31.97, "lon": -99.90,
            },
            "Washington": {
                "cities": {
                    "Seattle": {"lat": 47.61, "lon": -122.33},
                    "Bellevue": {"lat": 47.61, "lon": -122.20},
                },
                "lat": 47.75, "lon": -120.74,
            },
            "Massachusetts": {
                "cities": {
                    "Boston": {"lat": 42.36, "lon": -71.06},
                    "Cambridge": {"lat": 42.37, "lon": -71.11},
                },
                "lat": 42.41, "lon": -71.38,
            },
            "Illinois": {
                "cities": {
                    "Chicago": {"lat": 41.88, "lon": -87.63},
                },
                "lat": 40.63, "lon": -89.40,
            },
            "Colorado": {
                "cities": {
                    "Denver": {"lat": 39.74, "lon": -104.99},
                    "Boulder": {"lat": 40.01, "lon": -105.27},
                },
                "lat": 39.55, "lon": -105.78,
            },
            "Georgia": {
                "cities": {
                    "Atlanta": {"lat": 33.75, "lon": -84.39},
                },
                "lat": 32.17, "lon": -82.91,
            },
            "Florida": {
                "cities": {
                    "Miami": {"lat": 25.76, "lon": -80.19},
                    "Tampa": {"lat": 27.95, "lon": -82.46},
                    "Orlando": {"lat": 28.54, "lon": -81.38},
                },
                "lat": 27.66, "lon": -81.52,
            },
            "Pennsylvania": {
                "cities": {
                    "Philadelphia": {"lat": 39.95, "lon": -75.17},
                    "Pittsburgh": {"lat": 40.44, "lon": -79.99},
                },
                "lat": 41.20, "lon": -77.19,
            },
            "District of Columbia": {
                "cities": {
                    "Washington": {"lat": 38.91, "lon": -77.04},
                },
                "lat": 38.91, "lon": -77.04,
            },
        },
        "Mexico": {
            "Mexico City": {
                "cities": {
                    "Mexico City": {"lat": 19.43, "lon": -99.13},
                },
                "lat": 19.43, "lon": -99.13,
            },
        },
    },
    "Europe": {
        "United Kingdom": {
            "England": {
                "cities": {
                    "London": {"lat": 51.51, "lon": -0.13},
                    "Manchester": {"lat": 53.48, "lon": -2.24},
                    "Birmingham": {"lat": 52.49, "lon": -1.90},
                    "Bristol": {"lat": 51.45, "lon": -2.59},
                    "Leeds": {"lat": 53.80, "lon": -1.55},
                    "Cambridge": {"lat": 52.21, "lon": 0.12},
                },
                "lat": 52.36, "lon": -1.17,
            },
            "Scotland": {
                "cities": {
                    "Edinburgh": {"lat": 55.95, "lon": -3.19},
                    "Glasgow": {"lat": 55.86, "lon": -4.25},
                },
                "lat": 56.49, "lon": -4.20,
            },
        },
        "Germany": {
            "Berlin": {
                "cities": {"Berlin": {"lat": 52.52, "lon": 13.41}},
                "lat": 52.52, "lon": 13.41,
            },
            "Bavaria": {
                "cities": {"Munich": {"lat": 48.14, "lon": 11.58}},
                "lat": 48.79, "lon": 11.50,
            },
        },
        "France": {
            "Île-de-France": {
                "cities": {"Paris": {"lat": 48.86, "lon": 2.35}},
                "lat": 48.86, "lon": 2.35,
            },
        },
        "Netherlands": {
            "North Holland": {
                "cities": {"Amsterdam": {"lat": 52.37, "lon": 4.90}},
                "lat": 52.37, "lon": 4.90,
            },
        },
        "Ireland": {
            "Leinster": {
                "cities": {"Dublin": {"lat": 53.35, "lon": -6.26}},
                "lat": 53.35, "lon": -6.26,
            },
        },
        "Switzerland": {
            "Zurich Canton": {
                "cities": {"Zurich": {"lat": 47.38, "lon": 8.54}},
                "lat": 47.38, "lon": 8.54,
            },
        },
        "Sweden": {
            "Stockholm County": {
                "cities": {"Stockholm": {"lat": 59.33, "lon": 18.07}},
                "lat": 59.33, "lon": 18.07,
            },
        },
        "Spain": {
            "Catalonia": {
                "cities": {"Barcelona": {"lat": 41.39, "lon": 2.17}},
                "lat": 41.39, "lon": 2.17,
            },
            "Community of Madrid": {
                "cities": {"Madrid": {"lat": 40.42, "lon": -3.70}},
                "lat": 40.42, "lon": -3.70,
            },
        },
    },
    "Asia": {
        "India": {
            "Maharashtra": {
                "cities": {"Mumbai": {"lat": 19.08, "lon": 72.88}},
                "lat": 19.08, "lon": 72.88,
            },
            "Karnataka": {
                "cities": {"Bangalore": {"lat": 12.97, "lon": 77.59}},
                "lat": 12.97, "lon": 77.59,
            },
            "Delhi": {
                "cities": {"New Delhi": {"lat": 28.61, "lon": 77.21}},
                "lat": 28.61, "lon": 77.21,
            },
        },
        "Japan": {
            "Kanto": {
                "cities": {"Tokyo": {"lat": 35.68, "lon": 139.69}},
                "lat": 35.68, "lon": 139.69,
            },
        },
        "Singapore": {
            "Singapore": {
                "cities": {"Singapore": {"lat": 1.35, "lon": 103.82}},
                "lat": 1.35, "lon": 103.82,
            },
        },
        "China": {
            "Shanghai Municipality": {
                "cities": {"Shanghai": {"lat": 31.23, "lon": 121.47}},
                "lat": 31.23, "lon": 121.47,
            },
            "Beijing Municipality": {
                "cities": {"Beijing": {"lat": 39.90, "lon": 116.40}},
                "lat": 39.90, "lon": 116.40,
            },
        },
    },
    "Oceania": {
        "Australia": {
            "New South Wales": {
                "cities": {"Sydney": {"lat": -33.87, "lon": 151.21}},
                "lat": -33.87, "lon": 151.21,
            },
            "Victoria": {
                "cities": {"Melbourne": {"lat": -37.81, "lon": 144.96}},
                "lat": -37.81, "lon": 144.96,
            },
        },
        "New Zealand": {
            "Auckland Region": {
                "cities": {"Auckland": {"lat": -36.85, "lon": 174.76}},
                "lat": -36.85, "lon": 174.76,
            },
        },
    },
    "South America": {
        "Brazil": {
            "São Paulo State": {
                "cities": {"São Paulo": {"lat": -23.55, "lon": -46.63}},
                "lat": -23.55, "lon": -46.63,
            },
        },
        "Argentina": {
            "Buenos Aires Province": {
                "cities": {"Buenos Aires": {"lat": -34.60, "lon": -58.38}},
                "lat": -34.60, "lon": -58.38,
            },
        },
    },
    "Africa": {
        "Nigeria": {
            "Lagos State": {
                "cities": {"Lagos": {"lat": 6.52, "lon": 3.38}},
                "lat": 6.52, "lon": 3.38,
            },
        },
        "South Africa": {
            "Western Cape": {
                "cities": {"Cape Town": {"lat": -33.92, "lon": 18.42}},
                "lat": -33.92, "lon": 18.42,
            },
            "Gauteng": {
                "cities": {"Johannesburg": {"lat": -26.20, "lon": 28.05}},
                "lat": -26.20, "lon": 28.05,
            },
        },
        "Kenya": {
            "Nairobi County": {
                "cities": {"Nairobi": {"lat": -1.29, "lon": 36.82}},
                "lat": -1.29, "lon": 36.82,
            },
        },
    },
}


# =============================================================================
# Lookup Indexes (built at import time)
# =============================================================================

# Flat lookups: name → (level, continent, country, province, city_data)
_CITY_LOOKUP: dict = {}        # "toronto" → ("city", "North America", "Canada", "Ontario", {"lat":..., "lon":...})
_PROVINCE_LOOKUP: dict = {}    # "ontario" → ("province", "North America", "Canada", {"lat":..., "lon":..., "cities":{...}})
_COUNTRY_LOOKUP: dict = {}     # "canada" → ("country", "North America", {...provinces...})
_CONTINENT_LOOKUP: dict = {}   # "north america" → ("continent", {...countries...})


def _build_indexes():
    """Build flat lookup dicts from the hierarchy. Called once at import."""
    for continent_name, countries in GEO_HIERARCHY.items():
        _CONTINENT_LOOKUP[continent_name.lower()] = continent_name

        for country_name, provinces in countries.items():
            _COUNTRY_LOOKUP[country_name.lower()] = (continent_name, country_name)

            for province_name, prov_data in provinces.items():
                _PROVINCE_LOOKUP[province_name.lower()] = (
                    continent_name, country_name, province_name, prov_data
                )

                for city_name, city_data in prov_data.get("cities", {}).items():
                    key = city_name.lower()
                    entry = (continent_name, country_name, province_name, city_name, city_data)
                    if key not in _CITY_LOOKUP:
                        _CITY_LOOKUP[key] = []
                    _CITY_LOOKUP[key].append(entry)


_build_indexes()


# =============================================================================
# Public API
# =============================================================================

def find_location(name: str, country: str = None, province: str = None) -> Optional[dict]:
    """
    Find a location in the hierarchy by name.
    
    Returns dict with keys: level, value, parent_chain, children, lat, lon
    or None if not found.
    """
    name_lower = name.lower().strip()

    # Check city first (most specific)
    if name_lower in _CITY_LOOKUP:
        entries = _CITY_LOOKUP[name_lower]
        # Filter by country/province if provided for disambiguation
        if country or province:
            filtered = entries
            if country:
                filtered = [e for e in filtered if e[1].lower() == country.lower()]
            if province:
                filtered = [e for e in filtered if e[2].lower() == province.lower()]
            if filtered:
                entries = filtered
        # Use first (best) match
        continent, country_name, prov_name, city, data = entries[0]
        return {
            "level": "city",
            "value": city,
            "parent_chain": [prov_name, country_name, continent, "Global"],
            "children": [],
            "lat": data["lat"],
            "lon": data["lon"],
        }

    # Check province
    if name_lower in _PROVINCE_LOOKUP:
        continent, country, province, prov_data = _PROVINCE_LOOKUP[name_lower]
        return {
            "level": "province",
            "value": province,
            "parent_chain": [country, continent, "Global"],
            "children": list(prov_data.get("cities", {}).keys()),
            "lat": prov_data.get("lat"),
            "lon": prov_data.get("lon"),
        }

    # Check country
    if name_lower in _COUNTRY_LOOKUP:
        continent, country = _COUNTRY_LOOKUP[name_lower]
        provinces = list(GEO_HIERARCHY[continent][country].keys())
        return {
            "level": "country",
            "value": country,
            "parent_chain": [continent, "Global"],
            "children": provinces,
            "lat": None,
            "lon": None,
        }

    # Check continent
    if name_lower in _CONTINENT_LOOKUP:
        continent = _CONTINENT_LOOKUP[name_lower]
        countries = list(GEO_HIERARCHY[continent].keys())
        return {
            "level": "continent",
            "value": continent,
            "parent_chain": ["Global"],
            "children": countries,
            "lat": None,
            "lon": None,
        }

    return None


def get_all_cities() -> List[str]:
    """Get all unique city names in the hierarchy."""
    return list(dict.fromkeys(entry[3] for entries in _CITY_LOOKUP.values() for entry in entries))


def get_all_provinces() -> List[str]:
    """Get all unique province/state names in the hierarchy."""
    return list(dict.fromkeys(v[2] for v in _PROVINCE_LOOKUP.values()))


def get_all_countries() -> List[str]:
    """Get all unique country names in the hierarchy."""
    return list(dict.fromkeys(v[1] for v in _COUNTRY_LOOKUP.values()))


def get_countries_in_continent(continent: str) -> List[str]:
    """Get all countries in a specific continent."""
    continent_data = GEO_HIERARCHY.get(continent, {})
    return list(continent_data.keys())
