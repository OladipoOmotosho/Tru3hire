"""
Tests for Facet Engine
"""

import pytest
from app.services.facet_engine import (
    FacetPosition,
    resolve_facet_position,
    generate_spectrum_suggestions,
    generate_all_suggestions,
    count_by_dimension,
)


# =============================================================================
# Test FacetPosition Resolution
# =============================================================================

class TestResolveFacetPosition:
    """Test resolving values to FacetPosition across all dimensions."""

    # ── Location ──

    def test_location_city(self):
        pos = resolve_facet_position("location", "Montreal")
        assert pos is not None
        assert pos.dimension == "location"
        assert pos.level == "city"
        assert pos.value == "Montreal"
        assert "Quebec" in pos.parent_chain
        assert "Canada" in pos.parent_chain

    def test_location_province(self):
        pos = resolve_facet_position("location", "Ontario")
        assert pos is not None
        assert pos.level == "province"
        assert "Toronto" in pos.child_options

    def test_location_country(self):
        pos = resolve_facet_position("location", "Canada")
        assert pos is not None
        assert pos.level == "country"
        assert "Ontario" in pos.child_options
        assert "Quebec" in pos.child_options

    def test_location_unknown(self):
        pos = resolve_facet_position("location", "Narnia")
        assert pos is None

    # ── Seniority ──

    def test_seniority_senior(self):
        pos = resolve_facet_position("seniority", "senior")
        assert pos is not None
        assert pos.value == "senior"
        assert "mid" in pos.child_options
        assert "lead" in pos.child_options

    def test_seniority_intern(self):
        pos = resolve_facet_position("seniority", "intern")
        assert pos is not None
        assert pos.value == "intern"
        # Intern is first, so only "junior" neighbor
        assert "junior" in pos.child_options

    def test_seniority_unknown(self):
        pos = resolve_facet_position("seniority", "wizard")
        assert pos is None

    # ── Skills ──

    def test_skills_specific(self):
        pos = resolve_facet_position("skills", "React")
        assert pos is not None
        assert pos.level == "skill"
        assert pos.value == "React"
        assert "Frontend" in pos.parent_chain

    def test_skills_family(self):
        pos = resolve_facet_position("skills", "Frontend")
        assert pos is not None
        assert pos.level == "family"
        assert "React" in pos.child_options

    def test_skills_domain(self):
        pos = resolve_facet_position("skills", "Engineering")
        assert pos is not None
        assert pos.level == "domain"
        assert "Frontend" in pos.child_options

    # ── Company Size ──

    def test_company_size_startup(self):
        pos = resolve_facet_position("company_size", "startup")
        assert pos is not None
        assert pos.value == "Startup"
        assert "SMB" in pos.child_options

    def test_company_size_enterprise(self):
        pos = resolve_facet_position("company_size", "enterprise")
        assert pos is not None
        assert pos.value == "Enterprise"

    # ── Industry ──

    def test_industry_sector(self):
        pos = resolve_facet_position("industry", "Technology")
        assert pos is not None
        assert pos.level == "sector"
        assert "SaaS" in pos.child_options

    def test_industry_alias(self):
        pos = resolve_facet_position("industry", "fintech")
        assert pos is not None
        assert pos.value == "FinTech"
        assert "Technology" in pos.parent_chain

    def test_industry_farming(self):
        pos = resolve_facet_position("industry", "farming")
        assert pos is not None
        assert pos.value == "Farming"
        assert "Agriculture" in pos.parent_chain


# =============================================================================
# Test Suggestion Generation
# =============================================================================

class TestGenerateSpectrumSuggestions:
    """Test the universal expand/narrow suggestion engine."""

    @pytest.fixture
    def mock_jobs(self):
        """Sample jobs for testing."""
        return [
            {"title": "Senior React Developer", "location": "Toronto, Ontario", "description": "React TypeScript SaaS"},
            {"title": "Junior Python Dev", "location": "Montreal, Quebec", "description": "Python Django startup"},
            {"title": "Mid Backend Engineer", "location": "Toronto, Ontario", "description": "Java Spring enterprise"},
            {"title": "Senior Frontend Dev", "location": "Vancouver, BC", "description": "React Next.js fintech"},
            {"title": "Lead Data Scientist", "location": "Ottawa, Ontario", "description": "Python ML healthcare"},
        ]

    def test_no_position_suggests_narrowing(self, mock_jobs):
        """When no position specified, suggest top clusters."""
        suggestions = generate_spectrum_suggestions("seniority", None, mock_jobs)
        assert len(suggestions) > 0
        assert all(s.type == "narrow_seniority" for s in suggestions)

    def test_with_position_suggests_expanding(self, mock_jobs):
        """When position specified, suggest expanding."""
        pos = FacetPosition(
            dimension="seniority",
            level="specific",
            value="senior",
            parent_chain=["all"],
            child_options=["mid", "lead"],
        )
        suggestions = generate_spectrum_suggestions("seniority", pos, mock_jobs)
        assert len(suggestions) > 0
        # Should include expand or add types
        types = {s.type for s in suggestions}
        assert "expand_seniority" in types or "add_seniority" in types

    def test_empty_jobs_returns_empty(self):
        """No jobs = no suggestions."""
        suggestions = generate_spectrum_suggestions("location", None, [])
        assert suggestions == []

    def test_max_suggestions_respected(self, mock_jobs):
        """Should not exceed max_suggestions."""
        suggestions = generate_spectrum_suggestions("seniority", None, mock_jobs, max_suggestions=2)
        assert len(suggestions) <= 2


class TestGenerateAllSuggestions:
    """Test the orchestrator that runs all dimensions."""

    def test_generates_across_dimensions(self):
        """Should produce suggestions from multiple dimensions."""
        jobs = [
            {"title": "Senior React Dev", "location": "Toronto", "description": "React startup SaaS"},
            {"title": "Junior Python Dev", "location": "Montreal", "description": "Python enterprise"},
            {"title": "Mid Go Engineer", "location": "Toronto", "description": "Go Docker kubernetes"},
        ]
        suggestions = generate_all_suggestions(jobs, facets={}, max_total=8)
        assert len(suggestions) > 0
        dimensions = {s.dimension for s in suggestions}
        assert len(dimensions) >= 1  # At least one dimension represented

    def test_max_total_respected(self):
        """Total suggestions should not exceed max_total."""
        jobs = [{"title": f"Dev {i}", "location": "Toronto", "description": "Python"} for i in range(20)]
        suggestions = generate_all_suggestions(jobs, facets={}, max_total=5)
        assert len(suggestions) <= 5

    def test_empty_jobs_returns_empty(self):
        """No jobs should return no suggestions."""
        suggestions = generate_all_suggestions([], facets={})
        assert suggestions == []


# =============================================================================
# Test Distribution Counting
# =============================================================================

class TestCountByDimension:
    """Test dimension-specific distribution counting."""

    def test_seniority_counting(self):
        jobs = [
            {"title": "Senior Dev", "description": ""},
            {"title": "Senior Eng", "description": ""},
            {"title": "Junior Dev", "description": ""},
        ]
        dist = count_by_dimension(jobs, "seniority")
        values = dict(dist)
        assert values.get("senior", 0) == 2
        assert values.get("junior", 0) == 1
