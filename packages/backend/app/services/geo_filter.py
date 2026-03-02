"""
Geo Filter Service

Haversine distance calculation, geo scope matching, and geographic
position resolution for the Faceted Spectrum system.

All pure math — $0 cost, ~10ms for 100K jobs.
"""

import math
from typing import Optional, Dict, Any, List

from app.data.world_locations import find_location, GEO_HIERARCHY


# =============================================================================
# Haversine Distance
# =============================================================================

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    
    Args:
        lat1, lon1: Latitude and longitude of point 1 (degrees)
        lat2, lon2: Latitude and longitude of point 2 (degrees)
        
    Returns:
        Distance in kilometers. ~100ns per call.
    """
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    a = min(max(a, 0.0), 1.0)
    return R * 2 * math.asin(math.sqrt(a))


# =============================================================================
# Geo Scope Matching
# =============================================================================

# Default radius for city-level matching (km)
CITY_RADIUS_KM = 50


def is_within_geo_scope(
    job: Dict[str, Any],
    level: str,
    value: str,
    parent_chain: List[str],
    lat: Optional[float] = None,
    lon: Optional[float] = None,
) -> bool:
    """
    Check if a job falls within the specified geographic scope.
    
    Uses Haversine for city-level, string matching for broader levels.
    
    Args:
        job: Job dict (must have location text or _geoloc)
        level: Geographic level (city, province, country, continent, global)
        value: The location value (e.g. "Montreal", "Ontario", "Canada")
        parent_chain: Parent locations for context
        lat, lon: Coordinates for city-level Haversine matching
        
    Returns:
        True if job is within scope
    """
    if level == "global":
        return True

    # Get job location text (normalize)
    job_location = _get_job_location_text(job).lower()

    if level == "city" and lat is not None and lon is not None:
        # City-level: use Haversine if job has coordinates
        job_geoloc = job.get("_geoloc") or job.get("geoloc")
        if job_geoloc:
            job_lat = job_geoloc.get("lat")
            job_lon = job_geoloc.get("lon") or job_geoloc.get("lng")
            if job_lat is not None and job_lon is not None:
                distance = haversine(lat, lon, float(job_lat), float(job_lon))
                return distance <= CITY_RADIUS_KM

        # Fallback: string match on city name
        return value.lower() in job_location

    if level == "province":
        # Match province name or any of its cities in job location
        return value.lower() in job_location

    if level == "country":
        # Match country name in job location
        if value.lower() in job_location:
            return True
        # Also check if any province of this country matches
        for continent_countries in GEO_HIERARCHY.values():
            if value in continent_countries:
                for province in continent_countries[value]:
                    if province.lower() in job_location:
                        return True
        return False

    if level == "continent":
        # Match any country in this continent
        continent_data = GEO_HIERARCHY.get(value, {})
        for country in continent_data:
            if country.lower() in job_location:
                return True
        return False

    return True  # Unknown level = no filter


def _get_job_location_text(job: Dict[str, Any]) -> str:
    """Extract location text from a job dict. Handles multiple field names."""
    # Try common field names
    for field in ["location", "job_location", "display_location", "company_location"]:
        loc = job.get(field)
        if loc and isinstance(loc, str):
            return loc
        if loc and isinstance(loc, dict):
            parts = []
            for key in ["city", "area", "region", "country"]:
                if loc.get(key):
                    parts.append(str(loc[key]))
            if parts:
                return ", ".join(parts)

    return ""


# =============================================================================
# Geo Position Resolution
# =============================================================================

def resolve_geo_position(
    province: Optional[str] = None,
    city: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Resolve province/city strings to a full geographic position.
    
    Used by query_resolver to build a FacetPosition for geography.
    
    Args:
        province: Province/state name (from existing extraction)
        city: City name (from existing extraction)
        
    Returns:
        Dict with level, value, parent_chain, children, lat, lon
        or None if nothing specified
    """
    # Try city first (most specific)
    if city:
        result = find_location(city)
        if result:
            return result

    # Try province
    if province:
        result = find_location(province)
        if result:
            return result

    # Nothing specified = global scope
    return None
