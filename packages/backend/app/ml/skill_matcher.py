"""
Skill Extraction and Matching Module

Provides:
1. Skill extraction from job descriptions and resumes
2. Weighted skill matching (required vs nice-to-have)
3. Experience level extraction and comparison

This enhances resume-job matching by analyzing specific skills
rather than just comparing full text.
"""

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


# =============================================================================
# Skill Categories Database
# =============================================================================

# Comprehensive skill taxonomy with aliases and categories
SKILL_DATABASE = {
    # Programming Languages
    "python": ["python", "py", "python3", "python2"],
    "javascript": ["javascript", "js", "ecmascript", "es6", "es2015"],
    "typescript": ["typescript", "ts"],
    "java": ["java", "jvm"],
    "csharp": ["c#", "csharp", "c sharp", ".net", "dotnet"],
    "cpp": ["c++", "cpp", "c plus plus"],
    "c": ["c language", "c programming"],
    "go": ["go", "golang"],
    "rust": ["rust", "rustlang"],
    "ruby": ["ruby", "ruby on rails", "rails", "ror"],
    "php": ["php"],
    "scala": ["scala"],
    "kotlin": ["kotlin"],
    "swift": ["swift", "ios development"],
    "r": ["r programming", "r language", "rstudio"],
    
    # Web Frontend
    "react": ["react", "reactjs", "react.js", "react js"],
    "vue": ["vue", "vuejs", "vue.js", "vue js"],
    "angular": ["angular", "angularjs", "angular.js"],
    "nextjs": ["next.js", "nextjs", "next js"],
    "html": ["html", "html5"],
    "css": ["css", "css3", "scss", "sass", "less"],
    "tailwind": ["tailwind", "tailwindcss", "tailwind css"],
    "bootstrap": ["bootstrap"],
    
    # Backend & Frameworks
    "nodejs": ["node.js", "nodejs", "node js", "node"],
    "express": ["express", "expressjs", "express.js"],
    "django": ["django"],
    "flask": ["flask"],
    "fastapi": ["fastapi", "fast api"],
    "spring": ["spring", "spring boot", "springboot"],
    "laravel": ["laravel"],
    "rails": ["rails", "ruby on rails", "ror"],
    
    # Databases
    "sql": ["sql", "structured query language"],
    "mysql": ["mysql", "my sql"],
    "postgresql": ["postgresql", "postgres", "psql"],
    "mongodb": ["mongodb", "mongo", "mongo db"],
    "redis": ["redis"],
    "elasticsearch": ["elasticsearch", "elastic search", "elk"],
    "oracle": ["oracle", "oracle db"],
    "sqlserver": ["sql server", "mssql", "microsoft sql server"],
    
    # Cloud & DevOps
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "google cloud platform"],
    "docker": ["docker", "containerization", "containers"],
    "kubernetes": ["kubernetes", "k8s"],
    "terraform": ["terraform", "iac", "infrastructure as code"],
    "jenkins": ["jenkins", "ci/cd", "cicd"],
    "github_actions": ["github actions", "gh actions"],
    "gitlab_ci": ["gitlab ci", "gitlab"],
    
    # Data Science & ML
    "pandas": ["pandas", "pd"],
    "numpy": ["numpy", "np"],
    "scikit_learn": ["scikit-learn", "sklearn", "scikit learn"],
    "tensorflow": ["tensorflow", "tf"],
    "pytorch": ["pytorch", "torch"],
    "keras": ["keras"],
    "machine_learning": ["machine learning", "ml"],
    "deep_learning": ["deep learning", "dl", "neural network", "neural networks"],
    "nlp": ["nlp", "natural language processing", "text mining"],
    "computer_vision": ["computer vision", "cv", "image processing"],
    "data_science": ["data science", "data scientist"],
    "data_analysis": ["data analysis", "data analytics", "analytics"],
    "statistics": ["statistics", "statistical analysis", "stats"],
    
    # Data Engineering
    "spark": ["spark", "apache spark", "pyspark"],
    "hadoop": ["hadoop", "hdfs", "mapreduce"],
    "airflow": ["airflow", "apache airflow"],
    "kafka": ["kafka", "apache kafka"],
    "etl": ["etl", "extract transform load", "data pipeline", "data pipelines"],
    "data_warehouse": ["data warehouse", "dwh", "data warehousing"],
    "dbt": ["dbt", "data build tool"],
    
    # BI & Visualization
    "tableau": ["tableau"],
    "powerbi": ["power bi", "powerbi", "power-bi"],
    "looker": ["looker"],
    "metabase": ["metabase"],
    "matplotlib": ["matplotlib", "mpl"],
    "seaborn": ["seaborn"],
    "plotly": ["plotly"],
    
    # Mobile
    "android": ["android", "android development"],
    "ios": ["ios", "ios development", "iphone"],
    "react_native": ["react native", "react-native"],
    "flutter": ["flutter", "dart"],
    
    # Soft Skills & Methodologies
    "agile": ["agile", "scrum", "kanban", "sprint"],
    "git": ["git", "version control", "github", "gitlab", "bitbucket"],
    "api_design": ["api", "rest", "restful", "graphql", "api design"],
    "microservices": ["microservices", "micro services", "distributed systems"],
    "testing": ["testing", "unit testing", "tdd", "test driven", "pytest", "jest"],
    "leadership": ["leadership", "team lead", "tech lead", "lead"],
    "communication": ["communication", "collaboration", "teamwork"],
}


# =============================================================================
# Experience Level Patterns
# =============================================================================

EXPERIENCE_PATTERNS = [
    # "X+ years" patterns
    (r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)', 1),
    (r'(?:minimum|min|at least)\s+(\d+)\s*(?:years?|yrs?)', 1),
    (r'(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)', 2),  # Range: uses lower bound
    
    # Seniority level patterns (map to approximate years)
    (r'\b(?:entry[\s-]?level|junior|associate)\b', 0),  # 0-2 years
    (r'\b(?:mid[\s-]?level|intermediate)\b', 3),  # 3-5 years
    (r'\b(?:senior|sr\.?|experienced)\b', 5),  # 5+ years
    (r'\b(?:staff|principal|lead)\b', 7),  # 7+ years
    (r'\b(?:director|manager|head\s+of)\b', 8),  # 8+ years
]


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class SkillMatch:
    """Represents a matched skill."""
    skill: str
    category: str
    found_in_job: bool
    found_in_resume: bool
    is_required: bool  # vs nice-to-have
    weight: float


@dataclass 
class ExperienceInfo:
    """Extracted experience information."""
    years_required: Optional[int]
    years_candidate: Optional[int]
    level_job: Optional[str]
    level_candidate: Optional[str]
    match_score: int  # 0-100


@dataclass
class SkillMatchResult:
    """Complete skill matching result."""
    score: int  # 0-100
    matched_skills: List[str]
    missing_required: List[str]
    missing_preferred: List[str]
    bonus_skills: List[str]  # Skills candidate has that job didn't ask for
    experience_match: ExperienceInfo
    detailed_breakdown: Dict


# =============================================================================
# Skill Extraction
# =============================================================================

def extract_skills(text: str) -> Dict[str, Dict]:
    """
    Extract skills from text using the skill database.
    
    Returns dict of {canonical_skill_name: {aliases_found: [...], positions: [...]}}
    """
    text_lower = text.lower()
    found_skills = {}
    
    for canonical_name, aliases in SKILL_DATABASE.items():
        for alias in aliases:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(alias) + r'\b'
            matches = list(re.finditer(pattern, text_lower))
            
            if matches:
                if canonical_name not in found_skills:
                    found_skills[canonical_name] = {
                        "aliases_found": [],
                        "positions": [],
                        "count": 0
                    }
                found_skills[canonical_name]["aliases_found"].append(alias)
                found_skills[canonical_name]["positions"].extend([m.start() for m in matches])
                found_skills[canonical_name]["count"] += len(matches)
    
    return found_skills


def classify_required_vs_preferred(job_text: str, skill_positions: Dict) -> Dict[str, bool]:
    """
    Classify skills as required vs preferred/nice-to-have.
    
    Looks at context around skill mentions:
    - "required", "must have", "essential" → required
    - "preferred", "nice to have", "bonus", "plus" → preferred
    """
    text_lower = job_text.lower()
    
    # Patterns indicating required skills
    required_patterns = [
        r'required', r'must[\s-]?have', r'essential', r'mandatory',
        r'need\s+to\s+have', r'requirements?:', r'qualifications?:'
    ]
    
    # Patterns indicating preferred skills
    preferred_patterns = [
        r'preferred', r'nice[\s-]?to[\s-]?have', r'bonus', r'plus\b',
        r'desirable', r'advantage', r'ideally', r'would\s+be\s+great'
    ]
    
    result = {}
    
    for skill, info in skill_positions.items():
        is_required = True  # Default to required
        
        for pos in info.get("positions", []):
            # Look at 100 characters before the skill mention
            context_start = max(0, pos - 100)
            context = text_lower[context_start:pos]
            
            # Check if in preferred section
            for pattern in preferred_patterns:
                if re.search(pattern, context):
                    is_required = False
                    break
        
        result[skill] = is_required
    
    return result


# =============================================================================
# Experience Extraction
# =============================================================================

def extract_experience_years(text: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Extract years of experience from text.
    
    Returns (years, level_description)
    """
    text_lower = text.lower()
    
    # Try numeric patterns first
    for pattern, group_idx in EXPERIENCE_PATTERNS[:3]:
        match = re.search(pattern, text_lower)
        if match:
            try:
                years = int(match.group(1))
                return years, f"{years}+ years"
            except (ValueError, IndexError):
                continue
    
    # Try seniority level patterns
    for pattern, approx_years in EXPERIENCE_PATTERNS[3:]:
        if re.search(pattern, text_lower):
            level_map = {
                0: "Entry Level",
                3: "Mid Level", 
                5: "Senior",
                7: "Staff/Principal",
                8: "Director/Manager"
            }
            return approx_years, level_map.get(approx_years, "Unknown")
    
    return None, None


def calculate_experience_match(job_years: Optional[int], resume_years: Optional[int]) -> int:
    """
    Calculate experience match score (0-100).
    
    Scoring:
    - Exact match or over-qualified: 100
    - 1 year under: 85
    - 2 years under: 70
    - 3+ years under: 50
    - No experience data: 60 (neutral)
    """
    if job_years is None or resume_years is None:
        return 60  # Neutral if data missing
    
    diff = resume_years - job_years
    
    if diff >= 0:
        # Meets or exceeds requirements
        return 100
    elif diff == -1:
        return 85
    elif diff == -2:
        return 70
    else:
        return 50


# =============================================================================
# Main Matching Function
# =============================================================================

def calculate_skill_match(
    job_text: str, 
    resume_text: Optional[str],
    user_skills: Optional[List[str]] = None,
    user_experience_years: Optional[int] = None
) -> SkillMatchResult:
    """
    Calculate comprehensive skill-based match score.
    
    Args:
        job_text: Job description text
        resume_text: Resume/CV text (optional)
        user_skills: List of user's skills from profile (optional)
        user_experience_years: Years of experience from profile (optional)
        
    Returns:
        SkillMatchResult with detailed breakdown
    """
    # Extract skills from job description
    job_skills = extract_skills(job_text)
    job_skill_requirements = classify_required_vs_preferred(job_text, job_skills)
    
    # Extract skills from resume (if provided)
    resume_skills = {}
    if resume_text and len(resume_text) > 50:
        resume_skills = extract_skills(resume_text)
    
    # Add user profile skills if provided
    candidate_skills = set(resume_skills.keys())
    if user_skills:
        for skill in user_skills:
            skill_lower = skill.lower()
            # Try to match to canonical name
            for canonical, aliases in SKILL_DATABASE.items():
                if skill_lower in aliases or skill_lower == canonical:
                    candidate_skills.add(canonical)
                    break
    
    # Calculate skill matches
    required_skills = {s for s, req in job_skill_requirements.items() if req}
    preferred_skills = {s for s, req in job_skill_requirements.items() if not req}
    all_job_skills = set(job_skills.keys())
    
    matched_required = candidate_skills & required_skills
    matched_preferred = candidate_skills & preferred_skills
    missing_required = required_skills - candidate_skills
    missing_preferred = preferred_skills - candidate_skills
    bonus_skills = candidate_skills - all_job_skills  # Skills candidate has but job didn't ask for
    
    # Calculate skill score
    if required_skills:
        # Weight: 70% required, 20% preferred, 10% bonus
        required_score = (len(matched_required) / len(required_skills)) * 100 if required_skills else 100
        preferred_score = (len(matched_preferred) / len(preferred_skills)) * 100 if preferred_skills else 100
        bonus_score = min(len(bonus_skills) * 5, 30)  # Up to 30 bonus points for extra skills
        
        skill_score = int(
            (required_score * 0.70) +
            (preferred_score * 0.20) +
            (bonus_score * 0.10)
        )
    else:
        # No skills extracted from job - use simple overlap
        if all_job_skills:
            skill_score = int((len(candidate_skills & all_job_skills) / len(all_job_skills)) * 100)
        else:
            skill_score = 60  # Neutral if no skills found
    
    # Experience matching
    job_years, job_level = extract_experience_years(job_text)
    resume_years, resume_level = None, None
    
    if user_experience_years is not None:
        resume_years = user_experience_years
        resume_level = f"{user_experience_years} years"
    elif resume_text:
        resume_years, resume_level = extract_experience_years(resume_text)
    
    exp_match_score = calculate_experience_match(job_years, resume_years)
    
    experience_info = ExperienceInfo(
        years_required=job_years,
        years_candidate=resume_years,
        level_job=job_level,
        level_candidate=resume_level,
        match_score=exp_match_score
    )
    
    # Combined final score (80% skills, 20% experience)
    final_score = int((skill_score * 0.80) + (exp_match_score * 0.20))
    final_score = max(0, min(100, final_score))
    
    return SkillMatchResult(
        score=final_score,
        matched_skills=list(matched_required | matched_preferred),
        missing_required=list(missing_required),
        missing_preferred=list(missing_preferred),
        bonus_skills=list(bonus_skills)[:10],  # Limit for display
        experience_match=experience_info,
        detailed_breakdown={
            "skill_score": skill_score,
            "experience_score": exp_match_score,
            "required_matched": len(matched_required),
            "required_total": len(required_skills),
            "preferred_matched": len(matched_preferred),
            "preferred_total": len(preferred_skills),
            "bonus_skills_count": len(bonus_skills),
        }
    )


def get_skill_display_name(canonical_name: str) -> str:
    """Convert canonical skill name to display-friendly format."""
    display_map = {
        "nodejs": "Node.js",
        "nextjs": "Next.js",
        "reactjs": "React",
        "vuejs": "Vue.js",
        "csharp": "C#",
        "cpp": "C++",
        "scikit_learn": "scikit-learn",
        "machine_learning": "Machine Learning",
        "deep_learning": "Deep Learning",
        "data_science": "Data Science",
        "data_analysis": "Data Analysis",
        "data_warehouse": "Data Warehouse",
        "github_actions": "GitHub Actions",
        "gitlab_ci": "GitLab CI",
        "react_native": "React Native",
        "api_design": "API Design",
    }
    return display_map.get(canonical_name, canonical_name.replace("_", " ").title())
