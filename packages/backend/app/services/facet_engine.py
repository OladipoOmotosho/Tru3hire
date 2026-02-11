"""
Facet Engine

Universal expand/narrow suggestion engine for the Faceted Spectrum system.
One function handles ALL dimensions — no dimension-specific logic.

$0 per query. ~15ms for distribution counting across 5 dimensions.
"""

import logging
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel
from collections import Counter

from app.data.taxonomies.canada_geo import find_location_position
from app.data.taxonomies.canada_skills import find_skill, CANADA_SKILL_HIERARCHY, SKILL_COOCCURRENCE
from app.data.taxonomies.canada_industry import (
    match_industry, match_industry_signal,
    CANADA_INDUSTRY_HIERARCHY, INDUSTRY_ALIASES,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Data Models
# =============================================================================

class FacetPosition(BaseModel):
    """Where the user currently sits on one dimension's spectrum."""
    dimension: str          # "location", "seniority", "skills", "company_size", "industry"
    level: str              # e.g. "city", "senior", "skill", "startup", "sub_industry"
    value: Optional[str] = None   # e.g. "Montreal", "senior", "React", "startup", "SaaS"
    parent_chain: List[str] = []  # ["Quebec", "Canada", "N. America", "Global"]
    child_options: List[str] = [] # ["Laval", "Quebec City"] or []


# =============================================================================
# Seniority & Company Size Spectrums (linear, not tree)
# =============================================================================

SENIORITY_SPECTRUM = ["intern", "junior", "mid", "senior", "lead", "principal", "executive"]

COMPANY_SIZE_SPECTRUM = [
    {"label": "Startup", "range": (1, 50), "aliases": ["startup", "early-stage", "early stage"]},
    {"label": "SMB", "range": (51, 200), "aliases": ["small business", "small company", "smb"]},
    {"label": "Mid-market", "range": (201, 1000), "aliases": ["mid-size", "growth-stage", "mid-market"]},
    {"label": "Enterprise", "range": (1001, 10000), "aliases": ["enterprise", "large company"]},
    {"label": "Fortune 500", "range": (10001, None), "aliases": ["fortune 500", "big tech", "faang"]},
]


# =============================================================================
# Facet Position Resolution
# =============================================================================

def resolve_facet_position(dimension: str, value: Optional[str]) -> Optional[FacetPosition]:
    """
    Resolve a dimension value to its position on the spectrum/hierarchy.
    
    Args:
        dimension: One of "location", "seniority", "skills", "company_size", "industry"
        value: The raw value to resolve (e.g. "Montreal", "senior", "React")
        
    Returns:
        FacetPosition or None if value is None/unresolvable
    """
    if not value:
        return None

    value_lower = value.lower().strip()

    if dimension == "location":
        result = find_location_position(value)
        if result:
            return FacetPosition(
                dimension="location",
                level=result["level"],
                value=result["value"],
                parent_chain=result["parent_chain"],
                child_options=result.get("children", []),
            )

    elif dimension == "seniority":
        if value_lower in SENIORITY_SPECTRUM:
            idx = SENIORITY_SPECTRUM.index(value_lower)
            # Parents = broader levels (all levels)
            parent_chain = ["all"]
            # Children = adjacent levels
            children = []
            if idx > 0:
                children.append(SENIORITY_SPECTRUM[idx - 1])
            if idx < len(SENIORITY_SPECTRUM) - 1:
                children.append(SENIORITY_SPECTRUM[idx + 1])
            return FacetPosition(
                dimension="seniority",
                level="specific",
                value=value_lower,
                parent_chain=parent_chain,
                child_options=children,
            )

    elif dimension == "skills":
        result = find_skill(value)
        if result:
            return FacetPosition(
                dimension="skills",
                level=result["level"],
                value=result["value"],
                parent_chain=result["parent_chain"],
                child_options=result.get("children", []),
            )

    elif dimension == "company_size":
        for i, size in enumerate(COMPANY_SIZE_SPECTRUM):
            if value_lower in size["aliases"] or value_lower == size["label"].lower():
                parent_chain = ["all"]
                children = []
                if i > 0:
                    children.append(COMPANY_SIZE_SPECTRUM[i - 1]["label"])
                if i < len(COMPANY_SIZE_SPECTRUM) - 1:
                    children.append(COMPANY_SIZE_SPECTRUM[i + 1]["label"])
                return FacetPosition(
                    dimension="company_size",
                    level="specific",
                    value=size["label"],
                    parent_chain=parent_chain,
                    child_options=children,
                )

    elif dimension == "industry":
        result = match_industry(value)
        if result:
            return FacetPosition(
                dimension="industry",
                level=result["level"],
                value=result["value"],
                parent_chain=result["parent_chain"],
                child_options=result.get("children", []),
            )

    return None


# =============================================================================
# Distribution Counting
# =============================================================================

def count_by_dimension(
    jobs: List[Dict[str, Any]],
    dimension: str,
) -> List[Tuple[str, int]]:
    """
    Count job distribution by a given dimension.
    
    Returns sorted list of (value, count) tuples, highest first.
    """
    counter = Counter()

    for job in jobs:
        values = _extract_dimension_values(job, dimension)
        for val in values:
            counter[val] += 1

    return counter.most_common()


def _extract_dimension_values(job: Dict[str, Any], dimension: str) -> List[str]:
    """Extract dimension values from a job dict for counting."""
    values = []

    if dimension == "location":
        location_text = ""
        loc = job.get("location") or job.get("job_location", "")
        if isinstance(loc, str):
            location_text = loc
        elif isinstance(loc, dict):
            location_text = loc.get("area", "") or loc.get("region", "")

        # Try to match to known locations
        for word in location_text.split(","):
            word = word.strip()
            if word:
                result = find_location_position(word)
                if result:
                    values.append(result["value"])
                    # Also add parents for broader counting
                    for parent in result["parent_chain"]:
                        if parent != "Global":
                            values.append(parent)
                    break

        if not values and location_text:
            values.append(location_text.strip())

    elif dimension == "seniority":
        title = (job.get("title") or "").lower()
        description = (job.get("description") or "")[:200].lower()
        text = f"{title} {description}"

        for level in SENIORITY_SPECTRUM:
            if level in text:
                values.append(level)
                break

    elif dimension == "skills":
        title = (job.get("title") or "").lower()
        description = (job.get("description") or "")[:500].lower()
        text = f"{title} {description}"

        for domain, families in CANADA_SKILL_HIERARCHY.items():
            for family, skills in families.items():
                for skill in skills:
                    if skill.lower() in text:
                        values.append(family)
                        break

    elif dimension == "company_size":
        company_data = job.get("v5_processed_company_data") or {}
        if isinstance(company_data, dict):
            size = company_data.get("company_size") or company_data.get("employees")
            if size:
                try:
                    size_num = int(str(size).replace(",", "").replace("+", ""))
                    for spec in COMPANY_SIZE_SPECTRUM:
                        low, high = spec["range"]
                        if high is None:
                            if size_num >= low:
                                values.append(spec["label"])
                        elif low <= size_num <= high:
                            values.append(spec["label"])
                            break
                except (ValueError, TypeError):
                    pass

    elif dimension == "industry":
        # Check company industry field
        company_data = job.get("v5_processed_company_data") or {}
        industry_text = ""
        if isinstance(company_data, dict):
            industry_text = company_data.get("industry") or company_data.get("sector") or ""

        if industry_text:
            result = match_industry_signal(industry_text)
            if result:
                sector, sub = result
                if sub:
                    values.append(sub)
                values.append(sector)

    return values


# =============================================================================
# Universal Suggestion Engine
# =============================================================================

class Suggestion(BaseModel):
    """A refinement suggestion tag."""
    text: str           # Display text: "All Quebec (47)"
    type: str           # "narrow_location", "expand_skills", "add_industry"
    reason: str         # "47 jobs in Quebec"
    signal: str         # The value to send back: "Quebec"
    dimension: str      # "location", "seniority", "skills", etc.


def generate_spectrum_suggestions(
    dimension: str,
    position: Optional[FacetPosition],
    jobs: List[Dict[str, Any]],
    max_suggestions: int = 4,
) -> List[Suggestion]:
    """
    Universal expand/narrow tag generator. Works for ANY dimension.
    
    If user didn't specify this dimension → suggest NARROWING (top clusters).
    If user DID specify → suggest EXPANDING (parent chain) + siblings.
    
    Args:
        dimension: The dimension name
        position: Current facet position (None = unspecified)
        jobs: Current job results
        max_suggestions: Max suggestions to return
        
    Returns:
        List of Suggestion objects
    """
    suggestions: List[Suggestion] = []

    if not jobs:
        return suggestions

    total = len(jobs)

    if not position or not position.value:
        # ── User didn't specify → suggest NARROWING ──
        distribution = count_by_dimension(jobs, dimension)
        seen_values = set()

        for value, count in distribution:
            if value in seen_values:
                continue
            seen_values.add(value)

            pct = int(count / total * 100)
            if pct >= 8 and count >= 2:  # Only suggest if meaningful cluster
                suggestions.append(Suggestion(
                    text=f"{value} ({count})",
                    type=f"narrow_{dimension}",
                    reason=f"{pct}% of results are in {value}",
                    signal=value,
                    dimension=dimension,
                ))

            if len(suggestions) >= max_suggestions:
                break
    else:
        # ── User DID specify → suggest EXPANDING ──

        # Expand UP the hierarchy (parent chain)
        for parent in position.parent_chain:
            if parent in ("Global", "all"):
                # Offer "All results" only if significantly more
                suggestions.append(Suggestion(
                    text=f"All results ({total})",
                    type=f"expand_{dimension}",
                    reason=f"Remove {dimension} filter",
                    signal="all",
                    dimension=dimension,
                ))
                continue

            broader_count = _count_matching_parent(jobs, dimension, parent)
            if broader_count > 0:
                suggestions.append(Suggestion(
                    text=f"All {parent} ({broader_count})",
                    type=f"expand_{dimension}",
                    reason=f"{broader_count} jobs in {parent}",
                    signal=parent,
                    dimension=dimension,
                ))

        # Expand to SIBLINGS (same level, different value)
        if position.child_options:
            for sibling in position.child_options[:2]:
                sib_count = _count_matching_exact(jobs, dimension, sibling)
                if sib_count > 0:
                    suggestions.append(Suggestion(
                        text=f"Also {sibling} (+{sib_count})",
                        type=f"add_{dimension}",
                        reason=f"{sib_count} jobs match {sibling}",
                        signal=sibling,
                        dimension=dimension,
                    ))

        # For seniority: suggest adjacent levels
        if dimension == "seniority" and position.value:
            value_lower = position.value.lower()
            if value_lower in SENIORITY_SPECTRUM:
                idx = SENIORITY_SPECTRUM.index(value_lower)
                if idx > 0:
                    adj = SENIORITY_SPECTRUM[idx - 1]
                    adj_count = _count_matching_exact(jobs, "seniority", adj)
                    if adj_count > 0:
                        suggestions.append(Suggestion(
                            text=f"Include {adj.title()} (+{adj_count})",
                            type="expand_seniority",
                            reason=f"{adj_count} {adj}-level jobs available",
                            signal=adj,
                            dimension="seniority",
                        ))
                if idx < len(SENIORITY_SPECTRUM) - 1:
                    adj = SENIORITY_SPECTRUM[idx + 1]
                    adj_count = _count_matching_exact(jobs, "seniority", adj)
                    if adj_count > 0:
                        suggestions.append(Suggestion(
                            text=f"Include {adj.title()} (+{adj_count})",
                            type="expand_seniority",
                            reason=f"{adj_count} {adj}-level jobs available",
                            signal=adj,
                            dimension="seniority",
                        ))

        # For skills: suggest co-occurring skills
        if dimension == "skills" and position.value:
            co_occurring = SKILL_COOCCURRENCE.get(position.value.lower(), [])
            for co_skill in co_occurring[:2]:
                co_count = _count_skill_in_jobs(jobs, co_skill)
                if co_count > 0:
                    suggestions.append(Suggestion(
                        text=f"Also {co_skill.title()} ({co_count})",
                        type="add_skills",
                        reason=f"{co_count} jobs also mention {co_skill}",
                        signal=co_skill,
                        dimension="skills",
                    ))

    return suggestions[:max_suggestions]


# =============================================================================
# Counting Helpers
# =============================================================================

def _count_matching_parent(jobs: List[Dict], dimension: str, parent: str) -> int:
    """Count jobs that match a parent-level value."""
    count = 0
    parent_lower = parent.lower()
    for job in jobs:
        values = _extract_dimension_values(job, dimension)
        if any(v.lower() == parent_lower for v in values):
            count += 1
    return count


def _count_matching_exact(jobs: List[Dict], dimension: str, value: str) -> int:
    """Count jobs that exactly match a dimension value."""
    count = 0
    value_lower = value.lower()

    for job in jobs:
        if dimension == "seniority":
            title = (job.get("title") or "").lower()
            desc = (job.get("description") or "")[:200].lower()
            if value_lower in f"{title} {desc}":
                count += 1
        else:
            values = _extract_dimension_values(job, dimension)
            if any(v.lower() == value_lower for v in values):
                count += 1
    return count


def _count_skill_in_jobs(jobs: List[Dict], skill: str) -> int:
    """Count how many jobs mention a specific skill."""
    count = 0
    skill_lower = skill.lower()
    for job in jobs:
        title = (job.get("title") or "").lower()
        desc = (job.get("description") or "")[:500].lower()
        if skill_lower in f"{title} {desc}":
            count += 1
    return count


# =============================================================================
# Orchestrator: Run all dimensions
# =============================================================================

DIMENSION_LIST = ["location", "seniority", "skills", "company_size", "industry"]


def generate_all_suggestions(
    jobs: List[Dict[str, Any]],
    facets: Dict[str, FacetPosition],
    max_per_dimension: int = 3,
    max_total: int = 8,
) -> List[Suggestion]:
    """
    Generate spectrum suggestions for ALL dimensions.
    
    Prioritizes user-unspecified dimensions (more useful to narrow)
    over specified dimensions (expand options).
    
    Args:
        jobs: Current job results
        facets: Dict of dimension → FacetPosition (from parsed query)
        max_per_dimension: Max suggestions per dimension
        max_total: Max total suggestions across all dimensions
        
    Returns:
        Prioritized list of Suggestion objects
    """
    all_suggestions: List[Suggestion] = []

    # Generate for each dimension
    for dim in DIMENSION_LIST:
        position = facets.get(dim)
        dim_suggestions = generate_spectrum_suggestions(
            dimension=dim,
            position=position,
            jobs=jobs,
            max_suggestions=max_per_dimension,
        )
        all_suggestions.extend(dim_suggestions)

    # Prioritize: narrowing (unspecified dims) before expanding (specified dims)
    narrow = [s for s in all_suggestions if s.type.startswith("narrow_")]
    expand = [s for s in all_suggestions if s.type.startswith("expand_")]
    add = [s for s in all_suggestions if s.type.startswith("add_")]

    prioritized = narrow + add + expand
    return prioritized[:max_total]
