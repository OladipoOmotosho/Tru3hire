"""
Canadian Credential Pathways and Rules.
Defines the "Metro Map" stops for regulated professions.
"""

from typing import List, Dict, Optional, Literal

# Type definitions for better structure
StepType = Literal["education", "exam", "experience", "license", "application"]
StepStatus = Literal["locked", "available", "in_progress", "completed", "skipped"]

class CredentialStep:
    def __init__(
        self, 
        id: str, 
        label: str, 
        step_type: str, # Using str instead of StepType to avoid runtime issues if strict typing not enabled
        description: str,
        required: bool = True,
        resources: List[Dict[str, str]] = None
    ):
        self.id = id
        self.label = label
        self.step_type = step_type
        self.description = description
        self.required = required
        self.resources = resources or []

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "type": self.step_type,
            "description": self.description,
            "required": self.required,
            "resources": self.resources
        }

class ProfessionPathway:
    def __init__(
        self, 
        id: str, 
        title: str, 
        noc_code: str, 
        province: str, 
        regulator_name: str,
        steps: List[CredentialStep]
    ):
        self.id = id
        self.title = title
        self.noc_code = noc_code
        self.province = province
        self.regulator_name = regulator_name
        self.steps = steps

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "noc_code": self.noc_code,
            "province": self.province,
            "regulator": self.regulator_name,
            "steps": [s.to_dict() for s in self.steps]
        }

# =============================================================================
# DATA: Pathways
# =============================================================================

# 1. Professional Engineer (P.Eng) - Ontario
# Source: PEO (Professional Engineers Ontario)
P_ENG_ONTARIO = ProfessionPathway(
    id="peng_ontario",
    title="Professional Engineer (P.Eng)",
    noc_code="21300", # General Civil Engineering code as example
    province="Ontario",
    regulator_name="Professional Engineers Ontario (PEO)",
    steps=[
        CredentialStep(
            id="degree_eval",
            label="Academic Assessment",
            step_type="education",
            description="Ensure your engineering degree matches Canadian standards. Use WES (World Education Services) or PEO's internal review.",
            resources=[{"name": "WES Canada", "url": "https://www.wes.org/ca/"}]
        ),
        CredentialStep(
            id="eit_program",
            label="EIT Program",
            step_type="application",
            description="Register as an Engineering Intern (EIT) with PEO to start recording experience.",
            required=False # Optional but recommended
        ),
        CredentialStep(
            id="nppe_exam",
            label="NPPE Exam",
            step_type="exam",
            description="Pass the National Professional Practice Examination (NPPE) on law and ethics.",
        ),
        CredentialStep(
            id="work_exp",
            label="48 Months Experience",
            step_type="experience",
            description="Acquire 4 years of engineering experience. At least 12 months must be in a Canadian jurisdiction under a P.Eng.",
        ),
        CredentialStep(
            id="final_app",
            label="P.Eng Application",
            step_type="license",
            description="Submit final application and references to PEO for licensure.",
        )
    ]
)

# 2. Registered Nurse (RN) - Ontario
# Source: CNO (College of Nurses of Ontario)
RN_ONTARIO = ProfessionPathway(
    id="rn_ontario",
    title="Registered Nurse (RN)",
    noc_code="31301",
    province="Ontario",
    regulator_name="College of Nurses of Ontario (CNO)",
    steps=[
        CredentialStep(
            id="nnas_app",
            label="NNAS Application",
            step_type="application",
            description="Apply to the National Nursing Assessment Service (NNAS) for document verification.",
            resources=[{"name": "NNAS", "url": "https://www.nnas.ca/"}]
        ),
        CredentialStep(
            id="cno_eval",
            label="CNO Competency Assessment",
            step_type="education",
            description="CNO reviews your education. You may need upgrade courses if gaps are found.",
        ),
        CredentialStep(
            id="nclex_exam",
            label="NCLEX-RN Exam",
            step_type="exam",
            description="Pass the NCLEX-RN registration examination.",
        ),
        CredentialStep(
            id="jurisp_exam",
            label="Jurisprudence Exam",
            step_type="exam",
            description="Pass the RN Jurisprudence Examination on Ontario nursing laws.",
        ),
        CredentialStep(
            id="language_prof",
            label="Language Proficiency",
            step_type="exam",
            description="Demonstrate English or French proficiency (IELTS/CELBAN).",
        ),
        CredentialStep(
            id="registration",
            label="Initial Registration",
            step_type="license",
            description="Register with CNO and obtain your license to practice.",
        )
    ]
)

# 3. CPA (Chartered Professional Accountant) - Ontario
# Source: CPA Ontario
CPA_ONTARIO = ProfessionPathway(
    id="cpa_ontario",
    title="Chartered Professional Accountant (CPA)",
    noc_code="11100",
    province="Ontario",
    regulator_name="CPA Ontario",
    steps=[
        CredentialStep(
            id="transcript_assess",
            label="Transcript Assessment",
            step_type="education",
            description="Submit transcripts to CPA Ontario to determine prerequisites coverage.",
        ),
        CredentialStep(
            id="pep_program",
            label="CPA PEP Program",
            step_type="education",
            description="Complete the Professional Education Program (PEP) modules.",
        ),
        CredentialStep(
            id="cfe_exam",
            label="Common Final Exam (CFE)",
            step_type="exam",
            description="Pass the 3-day Common Final Examination.",
        ),
        CredentialStep(
            id="practical_exp",
            label="Practical Experience",
            step_type="experience",
            description="Complete 30 months of relevant accounting experience.",
        ),
        CredentialStep(
            id="admission",
            label="Admission to Membership",
            step_type="license",
            description="Apply for membership with CPA Ontario.",
        )
    ]
)

# Registry of all pathways
CREDENTIAL_PATHWAYS: Dict[str, ProfessionPathway] = {
    "civil engineer": P_ENG_ONTARIO,
    "software engineer": P_ENG_ONTARIO, # Simplified mapping for now, though SoftEng is debated
    "engineer": P_ENG_ONTARIO,
    "nurse": RN_ONTARIO,
    "registered nurse": RN_ONTARIO,
    "accountant": CPA_ONTARIO,
    "cpa": CPA_ONTARIO,
}

def get_pathway_for_role(role_name: str) -> Optional[Dict]:
    """
    Find a credential pathway for a given role name.
    Basic keyword matching for now.
    """
    role_lower = role_name.lower().strip()
    
    # Try exact match first
    if role_lower in CREDENTIAL_PATHWAYS:
        return CREDENTIAL_PATHWAYS[role_lower].to_dict()
    
    # Try fuzzy matching
    for key, pathway in CREDENTIAL_PATHWAYS.items():
        if key in role_lower:
            return pathway.to_dict()
            
    return None
