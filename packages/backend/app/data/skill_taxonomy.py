"""
Skill Taxonomy

Static skill hierarchy: Domain → Family → Individual Skills.
Plus co-occurrence data for "Also X" suggestions.

Used by the Faceted Spectrum system for skill-based expand/narrow suggestions.
Loaded once at startup. ~10KB memory.
"""

import logging
from typing import Optional, List

logger = logging.getLogger(__name__)


# =============================================================================
# Skill Hierarchy
# =============================================================================

SKILL_HIERARCHY = {
    "Engineering": {
        "Frontend": [
            "React", "Vue", "Angular", "Svelte", "Next.js",
            "TypeScript", "JavaScript", "HTML/CSS", "Tailwind",
            "Redux", "GraphQL",
        ],
        "Backend": [
            "Python", "Java", "Go", "Node.js", "Ruby",
            "C#", ".NET", "Rust", "PHP", "FastAPI",
            "Django", "Spring", "Express",
        ],
        "Mobile": [
            "Swift", "Kotlin", "React Native", "Flutter",
            "iOS", "Android", "Xamarin",
        ],
        "DevOps": [
            "Kubernetes", "Docker", "Terraform", "AWS", "GCP",
            "Azure", "CI/CD", "Jenkins", "GitHub Actions",
            "Ansible", "Linux",
        ],
        "Data Engineering": [
            "SQL", "Spark", "Airflow", "dbt", "Snowflake",
            "BigQuery", "Redshift", "Kafka", "Flink",
            "Databricks", "ETL",
        ],
        "Embedded": [
            "C", "C++", "RTOS", "Firmware", "FPGA",
            "Arduino", "Raspberry Pi",
        ],
        "QA/Testing": [
            "Selenium", "Cypress", "Jest", "Playwright",
            "JUnit", "TestRail", "Postman",
        ],
    },
    "Data Science": {
        "Machine Learning": [
            "PyTorch", "TensorFlow", "scikit-learn", "MLflow",
            "XGBoost", "Keras", "ONNX",
        ],
        "NLP": [
            "Transformers", "spaCy", "NLTK", "Hugging Face",
            "LangChain", "GPT", "BERT",
        ],
        "Computer Vision": [
            "OpenCV", "YOLO", "ResNet", "Image Classification",
        ],
        "Analytics": [
            "Tableau", "Power BI", "Looker", "Excel",
            "Google Analytics", "Amplitude", "Mixpanel",
        ],
        "Statistics": [
            "R", "SAS", "SPSS", "A/B Testing",
            "Bayesian", "Regression",
        ],
    },
    "Design": {
        "UX/UI": [
            "Figma", "Sketch", "Adobe XD", "InVision",
            "Prototyping", "Wireframing", "User Research",
        ],
        "Graphic Design": [
            "Photoshop", "Illustrator", "InDesign", "Canva",
            "After Effects", "Motion Graphics",
        ],
        "Product Design": [
            "Design Systems", "Accessibility", "Responsive Design",
            "Information Architecture",
        ],
    },
    "Product & Management": {
        "Product Management": [
            "Jira", "Confluence", "Roadmapping", "PRD",
            "User Stories", "OKRs", "A/B Testing",
        ],
        "Project Management": [
            "Agile", "Scrum", "Kanban", "PMP", "Asana",
            "Monday.com", "Gantt",
        ],
        "Business Analysis": [
            "Requirements", "Process Mapping", "BPMN",
            "Stakeholder Management",
        ],
    },
    "Security": {
        "Application Security": [
            "OWASP", "Penetration Testing", "SAST", "DAST",
            "Code Review", "Vulnerability Assessment",
        ],
        "Cloud Security": [
            "IAM", "Zero Trust", "SOC 2", "ISO 27001",
            "Encryption", "KMS",
        ],
        "Network Security": [
            "Firewall", "IDS/IPS", "VPN", "WAF", "SIEM",
        ],
    },
    "Marketing & Growth": {
        "Digital Marketing": [
            "SEO", "SEM", "Google Ads", "Facebook Ads",
            "Content Marketing", "Email Marketing",
        ],
        "Growth": [
            "Growth Hacking", "Conversion Optimization",
            "Funnel Analysis", "Retention",
        ],
    },
}


# =============================================================================
# Skill Co-occurrence (for "Also X" suggestions)
# =============================================================================

SKILL_COOCCURRENCE = {
    # Frontend
    "react": ["typescript", "next.js", "node.js", "tailwind", "redux", "graphql"],
    "vue": ["typescript", "nuxt.js", "tailwind", "javascript"],
    "angular": ["typescript", "rxjs", "node.js"],
    "next.js": ["react", "typescript", "tailwind", "vercel"],
    "typescript": ["react", "node.js", "next.js"],
    # Backend
    "python": ["sql", "pandas", "fastapi", "django", "aws"],
    "java": ["spring", "sql", "aws", "kubernetes", "maven"],
    "go": ["kubernetes", "docker", "grpc", "aws"],
    "node.js": ["typescript", "express", "react", "mongodb"],
    "ruby": ["rails", "postgresql", "redis"],
    "c#": [".net", "azure", "sql server"],
    # DevOps
    "kubernetes": ["docker", "terraform", "aws", "helm", "ci/cd"],
    "docker": ["kubernetes", "ci/cd", "linux", "aws"],
    "terraform": ["aws", "kubernetes", "ansible", "gcp"],
    "aws": ["terraform", "docker", "kubernetes", "python", "lambda"],
    # Data
    "sql": ["python", "pandas", "dbt", "snowflake"],
    "spark": ["python", "scala", "airflow", "databricks"],
    "airflow": ["python", "spark", "dbt", "sql"],
    "kafka": ["java", "spark", "flink", "microservices"],
    # ML/AI
    "pytorch": ["python", "transformers", "cuda", "mlflow"],
    "tensorflow": ["python", "keras", "mlflow"],
    "scikit-learn": ["python", "pandas", "numpy", "sql"],
    # Mobile
    "swift": ["ios", "xcode", "swiftui", "objective-c"],
    "kotlin": ["android", "java", "jetpack compose"],
    "react native": ["react", "typescript", "javascript"],
    "flutter": ["dart", "firebase", "mobile"],
    # Design
    "figma": ["sketch", "prototyping", "user research", "design systems"],
}


# =============================================================================
# Lookup Indexes (built at import time)
# =============================================================================

_SKILL_LOOKUP: dict = {}  # "react" → ("Engineering", "Frontend", "React")
_FAMILY_LOOKUP: dict = {} # "frontend" → ("Engineering", "Frontend", [...skills])
_DOMAIN_LOOKUP: dict = {} # "engineering" → ("Engineering", {...families...})


def _build_indexes():
    """Build flat lookup dicts from the hierarchy and validate co-occurrence data."""
    for domain_name, families in SKILL_HIERARCHY.items():
        _DOMAIN_LOOKUP[domain_name.lower()] = domain_name

        for family_name, skills in families.items():
            _FAMILY_LOOKUP[family_name.lower()] = (domain_name, family_name, skills)

            for skill in skills:
                _SKILL_LOOKUP[skill.lower()] = (domain_name, family_name, skill)

    # Validate SKILL_COOCCURRENCE against SKILL_HIERARCHY
    for key, co_skills in list(SKILL_COOCCURRENCE.items()):
        if key not in _SKILL_LOOKUP:
            logger.warning("Co-occurrence key '%s' not found in SKILL_HIERARCHY — skipping", key)
        filtered = [s for s in co_skills if s in _SKILL_LOOKUP]
        removed = [s for s in co_skills if s not in _SKILL_LOOKUP]
        if removed:
            logger.warning(
                "Co-occurrence for '%s': removed unknown skills %s", key, removed
            )
        SKILL_COOCCURRENCE[key] = filtered


_build_indexes()


# =============================================================================
# Public API
# =============================================================================

def find_skill(name: str) -> Optional[dict]:
    """
    Find a skill in the hierarchy by name.
    
    Returns dict with keys: level, value, parent_chain, children, co_occurring
    or None if not found.
    """
    name_lower = name.lower().strip()

    # Check individual skill first
    if name_lower in _SKILL_LOOKUP:
        domain, family, skill = _SKILL_LOOKUP[name_lower]
        siblings = [s for s in SKILL_HIERARCHY[domain][family] if s.lower() != name_lower]
        return {
            "level": "skill",
            "value": skill,
            "parent_chain": [family, domain],
            "children": [],
            "siblings": siblings[:5],
            "co_occurring": SKILL_COOCCURRENCE.get(name_lower, []),
        }

    # Check skill family
    if name_lower in _FAMILY_LOOKUP:
        domain, family, skills = _FAMILY_LOOKUP[name_lower]
        return {
            "level": "family",
            "value": family,
            "parent_chain": [domain],
            "children": skills,
            "siblings": [],
            "co_occurring": [],
        }

    # Check domain
    if name_lower in _DOMAIN_LOOKUP:
        domain = _DOMAIN_LOOKUP[name_lower]
        families = list(SKILL_HIERARCHY[domain].keys())
        return {
            "level": "domain",
            "value": domain,
            "parent_chain": [],
            "children": families,
            "siblings": [],
            "co_occurring": [],
        }

    return None


def get_family_for_skill(skill_name: str) -> Optional[str]:
    """Get the family name for a given skill."""
    result = find_skill(skill_name)
    if result and result["level"] == "skill":
        return result["parent_chain"][0] if result["parent_chain"] else None
    return None


def get_co_occurring_skills(skill_name: str) -> List[str]:
    """Get co-occurring skills for a given skill."""
    return SKILL_COOCCURRENCE.get(skill_name.lower().strip(), [])
