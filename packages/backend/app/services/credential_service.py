"""Credential Service.

Analyzes a user's resume/profile against Canadian credential pathways.
Produces a deterministic step-by-step "Metro Map" with statuses.
"""

import re
from typing import Dict, List, Optional, Any, Iterable

from app.data.taxonomies.canada_credentials import get_pathway_for_role


def _has_any(text_lower: str, patterns: Iterable[str]) -> bool:
    return any(re.search(p, text_lower, flags=re.I) for p in patterns)


_PATTERNS = {
    "degree_eval": [
        r"\bwes\b",
        r"world\s+education\s+services",
        r"\bicas\b",
        r"credential\s+assessment",
        r"educational\s+credential\s+assessment",
        r"\b(bachelor|master|phd)\b",
        r"\bdegree\b",
    ],
    "eit_program": [
        r"\beit\b",
        r"engineer\s*-?\s*in\s*-?\s*training",
        r"engineering\s+intern",
    ],
    "nppe_exam": [r"\bnppe\b", r"national\s+professional\s+practice\s+exam"],
    "nclex_exam": [r"\bnclex\b", r"nclex\s*-?\s*rn"],
    "jurisp_exam": [r"jurisprudence\s+exam", r"\bjurisprudence\b"],
    "cfe_exam": [r"\bcfe\b", r"common\s+final\s+exam"],
    "language_prof": [r"\bielts\b", r"\bcelban\b", r"language\s+proficiency"],
    "nnas_app": [r"\bnnas\b", r"national\s+nursing\s+assessment\s+service"],
}

_LICENSE_PATTERNS_BY_PATHWAY = {
    "engineer": [r"\bp\s*\.?\s*eng\b", r"\bprofessional\s+engineer\b"],
    "nurse": [r"\brn\b", r"\bregistered\s+nurse\b"],
    "accountant": [r"\bcpa\b", r"\bchartered\s+professional\s+accountant\b"],
}


def analyze_credentials(resume_text: str, target_role_title: str) -> Optional[Dict[str, Any]]:
    """
    Compare a resume against the regulated pathway for a target role.
    Returns the pathway with updated step statuses (completed, available, locked).
    
    This is the core logic for the "Metro Map".
    """
    pathway_dict = get_pathway_for_role(target_role_title)
    
    if not pathway_dict:
        return None

    steps: List[Dict[str, Any]] = pathway_dict.get("steps", [])
    resume_lower = (resume_text or "").lower()
    pathway_title_lower = pathway_dict.get("title", "").lower()

    # Determine which "license family" this pathway likely belongs to.
    license_family = None
    for family in _LICENSE_PATTERNS_BY_PATHWAY.keys():
        if family in pathway_title_lower:
            license_family = family
            break

    license_patterns = _LICENSE_PATTERNS_BY_PATHWAY.get(license_family or "", [])
    has_license_claim = _has_any(resume_lower, license_patterns) if license_patterns else False

    completed_flags: List[bool] = []
    for step in steps:
        step_id = (step.get("id") or "").strip()
        step_type = (step.get("type") or "").strip().lower()
        label_lower = (step.get("label") or "").lower()

        is_completed = False
        if step_id in _PATTERNS:
            is_completed = _has_any(resume_lower, _PATTERNS[step_id])

        # Generic exam steps: try pathway-specific patterns, fallback to 'exam' keyword.
        if not is_completed and step_type == "exam":
            if "engineer" in pathway_title_lower:
                is_completed = _has_any(resume_lower, _PATTERNS.get("nppe_exam", []))
            elif "nurse" in pathway_title_lower:
                is_completed = _has_any(resume_lower, _PATTERNS.get("nclex_exam", []) + _PATTERNS.get("jurisp_exam", []))
            elif "accountant" in pathway_title_lower:
                is_completed = _has_any(resume_lower, _PATTERNS.get("cfe_exam", []))

        # Experience step: treat as completed if they already hold the final license.
        if not is_completed and step_type == "experience" and has_license_claim:
            is_completed = True

        # License step: check for license claims.
        if step_type == "license" and license_patterns:
            if not is_completed:
                is_completed = _has_any(resume_lower, license_patterns)

        # Very light heuristic: if label mentions assessment/exam/etc.
        if not is_completed and "assessment" in label_lower:
            is_completed = _has_any(resume_lower, _PATTERNS.get("degree_eval", []))

        completed_flags.append(is_completed)

    final_steps: List[Dict[str, Any]] = []
    found_next = False

    for i, step in enumerate(steps):
        if completed_flags[i]:
            status = "completed"
        else:
            if not found_next:
                status = "available"
                found_next = True
            else:
                status = "locked"
        final_steps.append({**step, "status": status})

    # Overall status.
    if final_steps and final_steps[-1]["status"] == "completed":
        overall_status = "licensed"
    elif any(completed_flags):
        overall_status = "in_progress"
    else:
        overall_status = "not_started"

    pathway_meta = {k: v for k, v in pathway_dict.items() if k != "steps"}
    return {
        "pathway": pathway_meta,
        "status": overall_status,
        "steps": final_steps,
    }
