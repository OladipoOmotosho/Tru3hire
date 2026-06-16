"""
Tests for Geo Filter Service
"""

from app.services.geo_filter import haversine, resolve_geo_position, is_within_geo_scope


class TestHaversine:
    """Test Haversine distance calculation."""

    def test_montreal_to_toronto(self):
        """Known distance: ~504 km."""
        dist = haversine(45.50, -73.57, 43.65, -79.38)
        assert 500 < dist < 510

    def test_montreal_to_ottawa(self):
        """Known distance: ~163 km."""
        dist = haversine(45.50, -73.57, 45.42, -75.70)
        assert 155 < dist < 175

    def test_same_point(self):
        """Distance to self should be 0."""
        dist = haversine(45.50, -73.57, 45.50, -73.57)
        assert dist == 0.0

    def test_new_york_to_london(self):
        """Transatlantic: ~5,570 km."""
        dist = haversine(40.71, -74.01, 51.51, -0.13)
        assert 5500 < dist < 5600


class TestResolveGeoPosition:
    """Test geographic position resolution."""

    def test_city(self):
        result = resolve_geo_position(city="Toronto")
        assert result is not None
        assert result["level"] == "city"
        assert result["value"] == "Toronto"
        assert "Ontario" in result["parent_chain"]
        assert "Canada" in result["parent_chain"]

    def test_province(self):
        result = resolve_geo_position(province="Quebec")
        assert result is not None
        assert result["level"] == "province"
        assert result["value"] == "Quebec"
        assert "Montreal" in result["children"]

    def test_city_overrides_province(self):
        """City is more specific, so it should win."""
        result = resolve_geo_position(province="Ontario", city="Montreal")
        assert result["level"] == "city"
        assert result["value"] == "Montreal"

    def test_unknown_returns_none(self):
        result = resolve_geo_position(city="Atlantis")
        assert result is None

    def test_none_returns_none(self):
        result = resolve_geo_position()
        assert result is None

    def test_international_city(self):
        result = resolve_geo_position(city="London")
        assert result is not None
        assert result["level"] == "city"
        assert result["value"] == "London"


class TestIsWithinGeoScope:
    """Test geographic scope matching."""

    def test_global_matches_everything(self):
        job = {"location": "Anywhere"}
        assert is_within_geo_scope(job, "global", "Global", []) is True

    def test_city_string_match(self):
        job = {"location": "Toronto, Ontario"}
        assert is_within_geo_scope(job, "city", "Toronto", ["Ontario", "Canada"], lat=43.65, lon=-79.38) is True

    def test_province_match(self):
        job = {"location": "Toronto, Ontario, Canada"}
        assert is_within_geo_scope(job, "province", "Ontario", ["Canada"]) is True

    def test_province_no_match(self):
        job = {"location": "Vancouver, BC"}
        assert is_within_geo_scope(job, "province", "Ontario", ["Canada"]) is False

    def test_country_match(self):
        job = {"location": "Toronto, Ontario"}
        assert is_within_geo_scope(job, "country", "Canada", ["North America"]) is True

    def test_city_haversine_match(self):
        """Job with coordinates within 50km radius."""
        job = {"location": "Laval", "_geoloc": {"lat": 45.57, "lon": -73.69}}
        # Laval is ~15km from Montreal
        assert is_within_geo_scope(job, "city", "Montreal", ["Quebec"], lat=45.50, lon=-73.57) is True

    def test_city_haversine_no_match(self):
        """Job with coordinates outside 50km radius."""
        job = {"location": "Ottawa", "_geoloc": {"lat": 45.42, "lon": -75.70}}
        # Ottawa is ~163km from Montreal
        assert is_within_geo_scope(job, "city", "Montreal", ["Quebec"], lat=45.50, lon=-73.57) is False
