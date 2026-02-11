"""
Credential Service
Analyzes a user's resume/profile against Canadian credential pathways.
Generates the "Metro Map" status (Green/Yellow/Grey nodes).
"""

import re
from typing import Dict, List, Optional, Any

# Assuming app.data.taxonomies.canada_credentials is in the path
from app.data.taxonomies.canada_credentials import get_pathway_for_role

class CredentialAnalysis:
    def __init__(self, pathway: Dict, status: str, steps: List[Dict]):
        self.pathway = pathway
        self.status = status # "eligible", "needs_steps", "unknown_role"
        self.steps = steps

    def to_dict(self):
        return {
            "pathway": self.pathway,
            "status": self.status,
            "steps": self.steps
        }

def analyze_credentials(resume_text: str, target_role_title: str) -> Optional[Dict]:
    """
    Compare a resume against the regulated pathway for a target role.
    Returns the pathway with updated step statuses (completed, available, locked).
    
    This is the core logic for the "Metro Map".
    """
    pathway_dict = get_pathway_for_role(target_role_title)
    
    if not pathway_dict:
        return None

    steps = pathway_dict.get("steps", [])
    updated_steps = []
    resume_lower = resume_text.lower()
    
    completed_any = False
    
    # 1. First Pass: Detect what is definitively completed
    # (Based on simple keyword matching for Phase 1)
    
    temp_statuses = []
    
    for step in steps:
        is_completed = False
        step_id = step.get("id")
        step_type = step.get("type")
        label_lower = step.get("label", "").lower()

        # Education / WES
        if step_id == "degree_eval" or "assessment" in label_lower:
            keywords = ["wes", "world education services", "icas", "comparative education", "bachelor", "master", "phd", "degree"]
            if any(k in resume_lower for k in keywords):
                is_completed = True
        
        # EIT / Intern
        elif step_id == "eit_program" or "eit" in label_lower:
            if "eit" in resume_lower or "engineering intern" in resume_lower or "engineer-in-training" in resume_lower:
                is_completed = True
                
        # Exams (NPPE, NCLEX, CFE)
        elif step_type == "exam" or "exam" in label_lower:
            # Check for specific exam names related to the pathway
            pathway_title = pathway_dict.get("title", "").lower()
            if "engineer" in pathway_title:
                if any(k in resume_lower for k in ["nppe", "national professional practice exam"]):
                    is_completed = True
            elif "nurse" in pathway_title:
                if any(k in resume_lower for k in ["nclex", "jurisprudence"]):
                     is_completed = True
            elif "accountant" in pathway_title:
                if any(k in resume_lower for k in ["cfe", "common final exam"]):
                    is_completed = True
                
        # Experience
        elif step_type == "experience":
             # If they claim P.Eng, experience is implied
             if "p.eng" in resume_lower or "cpa" in resume_lower or "rn" in resume_lower:
                 is_completed = True
             # Or check for "experience" keywords + years? (Too fuzzy for regex)
        
        # License (The Goal)
        elif step_type == "license":
             if "p.eng" in resume_lower and "professional engineer" in resume_lower:
                 is_completed = True
             if "cpa" in resume_lower and "chartered professional accountant" in resume_lower:
                 is_completed = True
             if "rn" in resume_lower and "registered nurse" in resume_lower:
                 is_completed = True
        
        temp_statuses.append("completed" if is_completed else "locked")
        if is_completed:
            completed_any = True

    # 2. Second Pass: Determine "Next Step" (Yellow / "available")
    # The first "locked" step becomes "available"
    # All subsequent steps remain "locked" (Grey)
    
    final_steps = []
    found_next = False
    
    for i, step in enumerate(steps):
        current_status = temp_statuses[i]
        
        if current_status == "locked":
            if not found_next:
                current_status = "available" # Make this the ACTIVE step
                found_next = True
            else:
                current_status = "locked" # Keep locked
        
        # If it's the very first step and not completed, it IS the next step
        if i == 0 and current_status == "locked":
             current_status = "available"
             found_next = True

        final_steps.append({
            **step,
            "status": current_status
        })

    # Overall Status Calculation
    # If the last step is completed -> "licensed"
    # If stuck at step 1 -> "start"
    overall_status = "in_progress"
    if final_steps[-1]["status"] == "completed":
        overall_status = "licensed"
    elif final_steps[0]["status"] == "available":
        overall_status = "not_started"

    # Return Result
    # We remove 'steps' from the pathway dict to avoid duplication in the response structure
    pathway_meta = {k: v for k, v in pathway_dict.items() if k != 'steps'}
    
    return CredentialAnalysis(
        pathway=pathway_meta,
        status=overall_status,
        steps=final_steps
    ).to_dict()
