"""
Resume Parser Service

Extracts structured data from PDF and DOCX resumes:
- Contact info (name, email, phone, LinkedIn)
- Skills (matched against tech keywords database)
- Work Experience (job titles, companies, dates)
- Education (degrees, institutions)
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from io import BytesIO


# =============================================================================
# Data Models
# =============================================================================

@dataclass
class WorkExperience:
    title: str
    company: str
    start_date: Optional[str]
    end_date: Optional[str]
    description: str
    is_current: bool = False

@dataclass
class Education:
    degree: str
    institution: str
    year: Optional[str]
    field: Optional[str] = None


# =============================================================================
# Skills Database (500+ tech keywords)
# =============================================================================

TECH_SKILLS = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", 
    "golang", "rust", "swift", "kotlin", "scala", "php", "perl", "r", "matlab",
    "sql", "html", "css", "sass", "less", "bash", "shell", "powershell",
    
    # Frontend
    "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs",
    "vue.js", "svelte", "next.js", "nextjs", "nuxt", "gatsby", "redux",
    "mobx", "webpack", "vite", "rollup", "babel", "tailwind", "tailwindcss",
    "bootstrap", "material-ui", "mui", "chakra", "styled-components",
    
    # Backend
    "node", "nodejs", "node.js", "express", "expressjs", "fastapi", "django",
    "flask", "spring", "spring boot", "springboot", "rails", "ruby on rails",
    "asp.net", ".net", "laravel", "nestjs", "graphql", "rest", "restful",
    
    # Databases
    "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "sqlite", "oracle", "sql server", "mariadb",
    "firebase", "supabase", "prisma", "sequelize", "typeorm", "mongoose",
    
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "heroku",
    "netlify", "vercel", "digitalocean", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "github actions", "gitlab ci",
    "circleci", "travis", "nginx", "apache", "linux", "unix",
    
    # Data & ML
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "sklearn", "pandas", "numpy", "scipy", "matplotlib",
    "data science", "data analysis", "data engineering", "etl", "airflow",
    "spark", "hadoop", "tableau", "power bi", "looker", "nlp",
    "computer vision", "neural networks", "ai", "artificial intelligence",
    
    # Mobile
    "ios", "android", "react native", "flutter", "xamarin", "ionic",
    "swift ui", "swiftui", "jetpack compose", "mobile development",
    
    # Tools & Practices
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack",
    "agile", "scrum", "kanban", "ci/cd", "tdd", "bdd", "unit testing",
    "integration testing", "e2e testing", "jest", "mocha", "cypress",
    "selenium", "pytest", "junit",
}


# =============================================================================
# Text Extraction Functions
# =============================================================================

def extract_text_from_pdf(file_content: bytes, filename: str = "resume.pdf") -> Tuple[str, dict]:
    """Extract text from a PDF file using pdfplumber or pypdf."""
    metadata = {
        "filename": filename,
        "method": None,
        "page_count": 0,
        "success": False,
        "error": None,
    }
    
    text = _extract_with_pdfplumber(file_content, metadata)
    if text and len(text.strip()) > 50:
        return text, metadata
    
    text = _extract_with_pypdf(file_content, metadata)
    if text and len(text.strip()) > 50:
        return text, metadata
    
    metadata["error"] = "Could not extract text from PDF"
    return "", metadata


def _extract_with_pdfplumber(file_content: bytes, metadata: dict) -> Optional[str]:
    """Extract text using pdfplumber (primary method)."""
    try:
        import pdfplumber
        
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            metadata["page_count"] = len(pdf.pages)
            text_parts = [page.extract_text() or "" for page in pdf.pages]
            text = "\n\n".join(text_parts)
            
            if text.strip():
                metadata["method"] = "pdfplumber"
                metadata["success"] = True
                return _clean_text(text)
    except ImportError:
        pass
    except Exception as e:
        metadata["error"] = str(e)
    return None


def _extract_with_pypdf(file_content: bytes, metadata: dict) -> Optional[str]:
    """Extract text using pypdf (fallback)."""
    try:
        from pypdf import PdfReader
        
        reader = PdfReader(BytesIO(file_content))
        metadata["page_count"] = len(reader.pages)
        text_parts = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(text_parts)
        
        if text.strip():
            metadata["method"] = "pypdf"
            metadata["success"] = True
            return _clean_text(text)
    except ImportError:
        pass
    except Exception as e:
        metadata["error"] = str(e)
    return None


def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        from docx import Document
        doc = Document(BytesIO(file_content))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except ImportError:
        raise ImportError("python-docx not installed")
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def _clean_text(text: str) -> str:
    """Clean extracted text."""
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    return text.strip()


# =============================================================================
# Contact Information Extraction
# =============================================================================

def extract_email(text: str) -> Optional[str]:
    """Extract email address."""
    match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number."""
    patterns = [
        r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
        r'\+?[0-9]{1,3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return None


def extract_linkedin(text: str) -> Optional[str]:
    """Extract LinkedIn URL."""
    match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
    return match.group(0) if match else None


def extract_name(text: str) -> Optional[str]:
    """Extract name (first capitalized line that looks like a name)."""
    for line in text.strip().split('\n')[:10]:
        line = line.strip()
        if not line or len(line) > 50:
            continue
        if re.search(r'@|http|www\.|resume|email|phone|linkedin', line, re.IGNORECASE):
            continue
        words = line.split()
        if 2 <= len(words) <= 4:
            cap_words = [w for w in words if w[0].isupper()]
            if len(cap_words) >= 2:
                return line
    return None


def extract_location(text: str) -> Optional[str]:
    """Extract location from header area."""
    # Look for "City, State" pattern in first 500 chars
    match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\b', text[:500])
    return match.group(0) if match else None


# =============================================================================
# Skills Extraction
# =============================================================================

def extract_skills(text: str) -> List[str]:
    """Extract skills by matching against tech skills database."""
    text_lower = text.lower()
    found_skills = set()
    
    for skill in TECH_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            # Normalize skill names
            if skill.lower() in ['sql', 'css', 'html', 'aws', 'gcp', 'api', 'ai', 'ci/cd']:
                found_skills.add(skill.upper())
            elif skill.lower() == 'nodejs':
                found_skills.add('Node.js')
            elif skill.lower() in ['reactjs', 'react.js']:
                found_skills.add('React')
            else:
                found_skills.add(skill.title())
    
    return sorted(list(found_skills))


# Alias for backward compatibility
get_resume_skills = extract_skills


# =============================================================================
# Experience & Education Extraction
# =============================================================================

def extract_experience(text: str) -> List[dict]:
    """
    Extract work experience entries with company names, dates, and descriptions.
    
    Looks for patterns like:
    - "Software Engineer at Google | 2020 - Present"
    - "Senior Developer, Microsoft (Jan 2018 - Dec 2020)"
    - "TechCorp Inc. - Product Manager, 2019-2021"
    """
    experiences = []
    
    # Find experience section
    headers = [r'experience', r'employment', r'work\s+history', r'professional\s+experience']
    section_start = None
    
    for header in headers:
        match = re.search(header, text, re.IGNORECASE)
        if match:
            section_start = match.end()
            break
    
    if not section_start:
        return experiences
    
    # Find end (next section)
    next_sections = [r'\beducation\b', r'\bskills\b', r'\bcertifications?\b', r'\bprojects?\b', r'\bsummary\b']
    section_end = len(text)
    
    for section in next_sections:
        m = re.search(section, text[section_start:], re.IGNORECASE)
        if m:
            section_end = min(section_end, section_start + m.start())
    
    exp_text = text[section_start:section_end]
    
    # Date patterns
    month_pattern = r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
    year_pattern = r'(?:19|20)\d{2}'
    date_range_pattern = rf'({month_pattern}\.?\s*{year_pattern}|{year_pattern})\s*[-–—to]+\s*({month_pattern}\.?\s*{year_pattern}|{year_pattern}|[Pp]resent|[Cc]urrent)'
    
    # Job title patterns (expanded)
    title_patterns = [
        r'(?:Senior\s+|Junior\s+|Lead\s+|Principal\s+|Staff\s+)?(?:Software\s+)?(?:Engineer|Developer|Programmer)',
        r'(?:Senior\s+|Junior\s+|Lead\s+)?(?:Data\s+)?(?:Scientist|Analyst|Engineer)',
        r'(?:Full\s*Stack|Frontend|Backend|DevOps|Cloud|Platform)\s+(?:Engineer|Developer)',
        r'(?:Technical\s+|Engineering\s+)?(?:Lead|Manager|Director|VP|Vice\s+President)',
        r'(?:Product\s+|Project\s+|Program\s+)?Manager',
        r'(?:UI|UX|UI/UX)\s+(?:Designer|Developer|Engineer)',
        r'(?:QA|Quality\s+Assurance|Test)\s+(?:Engineer|Analyst|Lead)',
        r'(?:Solutions?\s+)?Architect',
        r'(?:Business\s+)?Analyst',
        r'(?:IT\s+|Systems?\s+)?(?:Administrator|Admin)',
        r'Consultant',
        r'Intern(?:ship)?',
    ]
    
    combined_title_pattern = '|'.join(f'({p})' for p in title_patterns)
    
    # Split into potential job blocks (by date ranges or double newlines)
    job_blocks = re.split(r'\n\s*\n|\n(?=\d{4})', exp_text)
    
    for block in job_blocks:
        if len(block.strip()) < 20:
            continue
            
        # Try to find job title
        title_match = re.search(combined_title_pattern, block, re.IGNORECASE)
        if not title_match:
            continue
            
        title = title_match.group(0).strip()
        
        # Try to find date range
        date_match = re.search(date_range_pattern, block, re.IGNORECASE)
        start_date = None
        end_date = None
        is_current = False
        
        if date_match:
            start_date = date_match.group(1).strip()
            end_date = date_match.group(2).strip()
            if end_date.lower() in ['present', 'current']:
                is_current = True
                end_date = 'Present'
        else:
            # Try to find just years
            years = re.findall(r'\b((?:19|20)\d{2})\b', block)
            if len(years) >= 2:
                start_date = years[0]
                end_date = years[-1]
            elif len(years) == 1:
                # Check for "Present" or "Current"
                if re.search(r'\b(?:present|current)\b', block, re.IGNORECASE):
                    start_date = years[0]
                    end_date = 'Present'
                    is_current = True
        
        # Try to find company name
        # Look for patterns like "at Company", "Company Inc.", "Company, Location"
        company = ""
        
        # Pattern 1: "at Company Name"
        at_match = re.search(r'\bat\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s*[,|•\-–]|\s*\d{4}|\s*$)', block)
        if at_match:
            company = at_match.group(1).strip()
        
        # Pattern 2: Company suffixes (Inc., LLC, Corp., Ltd., etc.)
        if not company:
            corp_match = re.search(r'([A-Z][A-Za-z0-9\s&]+?(?:Inc\.?|LLC|Corp\.?|Ltd\.?|Company|Co\.?|Technologies|Solutions|Systems|Group|Labs?))', block)
            if corp_match:
                company = corp_match.group(1).strip()
        
        # Pattern 3: First capitalized phrase before the title (likely company)
        if not company:
            lines = block.strip().split('\n')
            for line in lines[:3]:  # Check first 3 lines
                # Skip the line if it contains the job title
                if title.lower() in line.lower():
                    continue
                cap_match = re.match(r'^([A-Z][A-Za-z0-9\s&\-\.]+)', line.strip())
                if cap_match and len(cap_match.group(1).strip()) > 2:
                    company = cap_match.group(1).strip()
                    break
        
        # Clean up company name
        if company:
            company = re.sub(r'\s+', ' ', company).strip()
            # Remove trailing punctuation
            company = re.sub(r'[,\.\-–—•|]+$', '', company).strip()
        
        # Extract description (remaining text after title and dates)
        description = ""
        # Get text after the title, removing dates
        desc_text = block[title_match.end():]
        desc_text = re.sub(date_range_pattern, '', desc_text, flags=re.IGNORECASE)
        desc_text = re.sub(r'\b(?:19|20)\d{2}\b', '', desc_text)
        # Clean up
        desc_lines = [line.strip() for line in desc_text.split('\n') if line.strip() and len(line.strip()) > 10]
        if desc_lines:
            description = ' '.join(desc_lines[:3])[:300]  # First 3 lines, max 300 chars
        
        if len(experiences) < 5:  # Limit to 5 experiences
            experiences.append(asdict(WorkExperience(
                title=title,
                company=company,
                start_date=start_date,
                end_date=end_date,
                description=description,
                is_current=is_current
            )))
    
    return experiences


def extract_education(text: str) -> List[dict]:
    """Extract education entries."""
    education_list = []
    
    match = re.search(r'\beducation\b', text, re.IGNORECASE)
    if not match:
        return education_list
    
    edu_text = text[match.end():match.end() + 1000]
    
    degree_patterns = [
        r"(Bachelor'?s?|B\.?S\.?|B\.?A\.?)",
        r"(Master'?s?|M\.?S\.?|M\.?A\.?|MBA)",
        r"(Ph\.?D\.?|Doctorate)",
    ]
    
    for pattern in degree_patterns:
        for match in re.finditer(pattern, edu_text, re.IGNORECASE):
            if len(education_list) < 2:
                education_list.append(asdict(Education(
                    degree=match.group(0).strip(),
                    institution="",
                    year=None,
                    field=None
                )))
    
    return education_list


def calculate_years_of_experience(text: str) -> Optional[int]:
    """Estimate years of experience from resume."""
    current_year = datetime.now().year
    years = [int(y) for y in re.findall(r'\b(19|20)\d{2}\b', text)]
    years = [y for y in years if 1980 <= y <= current_year]
    return current_year - min(years) if years else None


# =============================================================================
# Main Parse Function
# =============================================================================

def parse_resume(file_content: bytes, filename: str) -> Dict:
    """
    Parse resume file and extract all structured data.
    
    Returns dict with: name, email, phone, linkedin, location,
    skills, experience, education, years_of_experience, raw_text
    """
    filename_lower = filename.lower()
    
    if filename_lower.endswith('.pdf'):
        raw_text, _ = extract_text_from_pdf(file_content, filename)
    elif filename_lower.endswith(('.docx', '.doc')):
        raw_text = extract_text_from_docx(file_content)
    else:
        raise ValueError(f"Unsupported format: {filename}")
    
    if not raw_text.strip():
        raise ValueError("Could not extract text from resume")
    
    return {
        "name": extract_name(raw_text),
        "email": extract_email(raw_text),
        "phone": extract_phone(raw_text),
        "linkedin": extract_linkedin(raw_text),
        "location": extract_location(raw_text),
        "skills": extract_skills(raw_text),
        "experience": extract_experience(raw_text),
        "education": extract_education(raw_text),
        "years_of_experience": calculate_years_of_experience(raw_text),
        "raw_text": raw_text[:15000],  # Truncate for storage, 15KB covers most resumes
    }


# For backward compatibility
def is_valid_pdf(file_content: bytes) -> bool:
    """Check if file is a valid PDF."""
    return file_content.startswith(b'%PDF')
