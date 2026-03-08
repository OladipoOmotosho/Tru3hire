"""
Refinement Analyzer Service

Data-driven refinement suggestions from result distribution.
Analyzes what users got vs what they asked for.

Now enhanced with Faceted Spectrum suggestions for expand/narrow tags.
NOT LLM-generated - purely analytical.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from collections import Counter
import re
import logging

from app.services.facet_engine import (
    FacetPosition, Suggestion,
    generate_all_suggestions,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Data Models
# =============================================================================

class Refinement(BaseModel):
    """A suggested query refinement."""
    text: str
    type: str  # "filter", "broaden", "specify"
    reason: str
    signal: str  # The signal to add/remove if clicked


class RefinementAnalysis(BaseModel):
    """Analysis of results with suggested refinements."""
    total_jobs: int
    suggestions: List[Refinement]
    distribution: Dict[str, Any]
    facet_suggestions: List[Dict[str, Any]] = []  # Spectrum expand/narrow tags


# =============================================================================
# Distribution Analysis
# =============================================================================

def _analyze_remote_distribution(jobs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count remote vs non-remote jobs."""
    remote_count = 0
    hybrid_count = 0
    onsite_count = 0
    
    for job in jobs:
        text = f"{job.get('title', '')} {job.get('description', '')}".lower()
        
        if re.search(r'\bremote\b|\bwfh\b|\bwork from home\b', text):
            remote_count += 1
        elif re.search(r'\bhybrid\b', text):
            hybrid_count += 1
        else:
            onsite_count += 1
    
    return {
        "remote": remote_count,
        "hybrid": hybrid_count,
        "onsite": onsite_count,
    }


def _analyze_seniority_distribution(jobs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count jobs by seniority level."""
    counts = Counter()
    
    for job in jobs:
        title = job.get("title", "").lower()
        
        if re.search(r'\bsenior\b|\bsr\.?\b', title):
            counts["senior"] += 1
        elif re.search(r'\bjunior\b|\bjr\.?\b|\bentry\b', title):
            counts["junior"] += 1
        elif re.search(r'\blead\b|\bprincipal\b|\bstaff\b', title):
            counts["lead"] += 1
        else:
            counts["mid"] += 1
    
    return dict(counts)


def _analyze_company_type(jobs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count jobs by company type indicators."""
    counts = Counter()
    
    for job in jobs:
        text = f"{job.get('company', '')} {job.get('description', '')}".lower()
        
        if re.search(r'\bstartup\b|\bstart-up\b|\bearly stage\b', text):
            counts["startup"] += 1
        elif re.search(r'\benterprise\b|\bcorporate\b|\bfortune\b', text):
            counts["enterprise"] += 1
        else:
            counts["other"] += 1
    
    return dict(counts)


def _analyze_salary_presence(jobs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count jobs with/without salary info."""
    with_salary = 0
    without_salary = 0
    
    for job in jobs:
        salary = job.get("salary_display", "")
        if salary and salary.lower() != "not specified":
            with_salary += 1
        else:
            without_salary += 1
    
    return {
        "with_salary": with_salary,
        "without_salary": without_salary,
    }


def _analyze_job_type(jobs: List[Dict[str, Any]]) -> Dict[str, int]:
    """Count jobs by employment type."""
    counts = Counter()
    
    for job in jobs:
        text = f"{job.get('title', '')} {job.get('description', '')}".lower()
        contract_type = job.get("contract_type", "").lower()
        
        if "contract" in contract_type or re.search(r'\bcontract\b|\bfreelance\b', text):
            counts["contract"] += 1
        elif "part" in contract_type or re.search(r'\bpart.?time\b', text):
            counts["part_time"] += 1
        else:
            counts["full_time"] += 1
    
    return dict(counts)


# =============================================================================
# Suggestion Generation
# =============================================================================

def _generate_suggestions(
    distribution: Dict[str, Any],
    current_query: Optional[Dict[str, Any]] = None,
) -> List[Refinement]:
    """
    Generate refinement suggestions from result distribution.
    
    Purely data-driven - no LLM involved.
    """
    suggestions = []
    total = distribution.get("total", 0)
    
    if total <= 0:
        return suggestions
    
    def _pct(count: int) -> int:
        """Compute a clamped percentage."""
        return min(max(int(float(count) / float(total) * 100), 0), 100)
    
    # Check remote distribution
    remote_dist = distribution.get("remote", {})
    remote_count = remote_dist.get("remote", 0)
    non_remote_count = remote_dist.get("onsite", 0) + remote_dist.get("hybrid", 0)
    
    if non_remote_count > 0 and float(remote_count) / float(total) < 0.3:
        suggestions.append(Refinement(
            text="Only remote roles",
            type="filter",
            reason=f"{_pct(total - remote_count)}% are not remote",
            signal="remote",
        ))
    elif float(remote_count) / float(total) > 0.8:
        suggestions.append(Refinement(
            text="Include on-site roles",
            type="broaden",
            reason=f"{_pct(remote_count)}% are remote, consider broadening",
            signal="not remote",
        ))
    
    # Check seniority distribution
    seniority_dist = distribution.get("seniority", {})
    senior_count = seniority_dist.get("senior", 0)
    junior_count = seniority_dist.get("junior", 0)
    
    if float(senior_count) / float(total) > 0.7 and current_query and not current_query.get("seniority"):
        suggestions.append(Refinement(
            text="Include mid-level roles",
            type="broaden",
            reason=f"{_pct(senior_count)}% are senior-level",
            signal="mid level",
        ))
    elif float(junior_count) / float(total) > 0.5:
        suggestions.append(Refinement(
            text="Focus on senior roles",
            type="filter",
            reason=f"{_pct(junior_count)}% are junior/entry-level",
            signal="senior",
        ))
    
    # Check company type
    company_dist = distribution.get("company_type", {})
    startup_count = company_dist.get("startup", 0)
    
    if float(startup_count) / float(total) < 0.1 and total > 5:
        suggestions.append(Refinement(
            text="Focus on startups",
            type="filter",
            reason=f"Only {_pct(startup_count)}% are startups",
            signal="startup",
        ))
    
    # Check salary presence
    salary_dist = distribution.get("salary", {})
    no_salary = salary_dist.get("without_salary", 0)
    
    if float(no_salary) / float(total) > 0.8:
        suggestions.append(Refinement(
            text="Filter to jobs with salary",
            type="filter",
            reason=f"{_pct(no_salary)}% don't show salary",
            signal="salary listed",
        ))
    
    # Limit to top 5 suggestions
    return suggestions[:5]


# =============================================================================
# Main Analysis Function
# =============================================================================

def analyze_results(
    jobs: List[Dict[str, Any]],
    parsed_query: Optional[Dict[str, Any]] = None,
) -> RefinementAnalysis:
    """
    Analyze job results and suggest refinements.
    
    Combines two engines:
    1. Distribution analysis (remote, salary, etc.) — existing
    2. Faceted Spectrum suggestions (expand/narrow tags) — NEW
    
    Args:
        jobs: List of job results
        parsed_query: Current parsed query (optional, for context)
        
    Returns:
        RefinementAnalysis with distribution data and suggestions
    """
    total = len(jobs)
    
    if total == 0:
        return RefinementAnalysis(
            total_jobs=0,
            suggestions=[
                Refinement(
                    text="Try broader keywords",
                    type="broaden",
                    reason="No results found",
                    signal="",
                ),
                Refinement(
                    text="Remove location filter",
                    type="broaden",
                    reason="Location may be too specific",
                    signal="any location",
                ),
            ],
            distribution={},
            facet_suggestions=[],
        )
    
    # Analyze distributions
    distribution = {
        "total": total,
        "remote": _analyze_remote_distribution(jobs),
        "seniority": _analyze_seniority_distribution(jobs),
        "company_type": _analyze_company_type(jobs),
        "salary": _analyze_salary_presence(jobs),
        "job_type": _analyze_job_type(jobs),
    }
    
    # Generate distribution-based suggestions (existing)
    query_dict = None
    if parsed_query:
        query_dict = parsed_query.model_dump() if hasattr(parsed_query, 'model_dump') else parsed_query
    
    suggestions = _generate_suggestions(distribution, query_dict)
    
    # Generate faceted spectrum suggestions (NEW)
    facet_suggestions = []
    try:
        # Build FacetPosition dict from parsed query facets
        facets: Dict[str, FacetPosition] = {}
        if query_dict and "facets" in query_dict:
            for dim, facet_data in query_dict["facets"].items():
                if isinstance(facet_data, dict):
                    facets[dim] = FacetPosition(**facet_data)
        
        spectrum_tags = generate_all_suggestions(
            jobs=jobs,
            facets=facets,
            max_per_dimension=3,
            max_total=8,
        )
        facet_suggestions = [s.model_dump() for s in spectrum_tags]
    except Exception as e:
        logger.warning(f"Facet suggestion generation failed: {e}")
    
    return RefinementAnalysis(
        total_jobs=total,
        suggestions=suggestions,
        distribution=distribution,
        facet_suggestions=facet_suggestions,
    )
