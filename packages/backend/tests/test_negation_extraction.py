"""
Tests for enhanced negation extraction in query_resolver.
"""

from app.services.query_resolver import _extract_exclusions


class TestNegationExtraction:
    """Test HiringCafe-style negation pattern extraction."""

    def test_not_pattern(self):
        exclusions = _extract_exclusions(["not management"])
        assert "manager" in exclusions or "management" in exclusions

    def test_no_pattern(self):
        exclusions = _extract_exclusions(["no sales"])
        assert "sales" in exclusions

    def test_without_pattern(self):
        exclusions = _extract_exclusions(["without management"])
        assert "manager" in exclusions or "management" in exclusions

    def test_avoid_pattern(self):
        exclusions = _extract_exclusions(["avoid sales"])
        assert "sales" in exclusions

    def test_exclude_pattern(self):
        exclusions = _extract_exclusions(["exclude marketing"])
        assert "marketing" in exclusions

    def test_excluding_pattern(self):
        exclusions = _extract_exclusions(["excluding contract"])
        assert any("contract" in e for e in exclusions)

    def test_dont_want_pattern(self):
        exclusions = _extract_exclusions(["don't want management"])
        assert "manager" in exclusions or "management" in exclusions

    def test_neither_nor_pattern(self):
        exclusions = _extract_exclusions(["neither management nor sales"])
        has_management = any("manag" in e for e in exclusions)
        has_sales = any("sales" in e or "selling" in e for e in exclusions)
        assert has_management
        assert has_sales

    def test_expansion(self):
        """When 'management' is excluded, it should expand to variants."""
        exclusions = _extract_exclusions(["not management"])
        assert "manager" in exclusions
        assert "management" in exclusions
        assert "head of" in exclusions

    def test_no_match(self):
        exclusions = _extract_exclusions(["python", "developer"])
        assert exclusions == []

    def test_multiple_exclusions(self):
        exclusions = _extract_exclusions(["not management", "avoid sales"])
        assert len(exclusions) > 0
        has_management = any("manag" in e for e in exclusions)
        has_sales = any("sales" in e or "selling" in e for e in exclusions)
        assert has_management
        assert has_sales
