"""
URL Scraper Service - Extracts job posting content from URLs.

This service handles fetching and parsing job posting pages from various
job boards and career sites.
"""

import httpx
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse
import re


@dataclass
class ScrapedJobData:
    """Structured data extracted from a job posting URL."""
    job_text: str
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    source_url: str = ""
    source_domain: str = ""
    error: Optional[str] = None


# Common user agent to avoid being blocked
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Domains known to block scraping
BLOCKED_DOMAINS = [
    "linkedin.com",
    "linkedin.ca",
]

# Request timeout in seconds
REQUEST_TIMEOUT = 15.0


def is_valid_url(url: str) -> bool:
    """Check if a string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme in ("http", "https"), result.netloc])
    except Exception:
        return False


def get_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Remove www. prefix
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def is_blocked_domain(url: str) -> bool:
    """Check if URL is from a domain known to block scraping."""
    domain = get_domain(url)
    return any(blocked in domain for blocked in BLOCKED_DOMAINS)


def clean_text(text: str) -> str:
    """Clean extracted text by removing extra whitespace."""
    if not text:
        return ""
    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    return text.strip()


def extract_job_bank_canada(soup: BeautifulSoup, url: str) -> ScrapedJobData:
    """Extract job data from Job Bank Canada (jobbank.gc.ca)."""
    job_text_parts = []
    title = None
    company = None
    location = None
    salary = None
    
    # Job title
    title_elem = soup.find("h1", class_="title")
    if title_elem:
        title = clean_text(title_elem.get_text())
        job_text_parts.append(f"Job Title: {title}")
    
    # Company name
    company_elem = soup.find("span", {"property": "hiringOrganization"})
    if company_elem:
        company = clean_text(company_elem.get_text())
        job_text_parts.append(f"Company: {company}")
    
    # Location
    location_elem = soup.find("span", {"property": "addressLocality"})
    if location_elem:
        location = clean_text(location_elem.get_text())
        job_text_parts.append(f"Location: {location}")
    
    # Salary
    salary_elem = soup.find("span", {"property": "baseSalary"})
    if salary_elem:
        salary = clean_text(salary_elem.get_text())
        job_text_parts.append(f"Salary: {salary}")
    
    # Job description
    desc_elem = soup.find("div", {"property": "description"})
    if desc_elem:
        job_text_parts.append(f"\nJob Description:\n{clean_text(desc_elem.get_text())}")
    
    # Requirements
    requirements = soup.find_all("div", class_="job-posting-detail-requirements")
    for req in requirements:
        job_text_parts.append(clean_text(req.get_text()))
    
    return ScrapedJobData(
        job_text="\n\n".join(job_text_parts),
        title=title,
        company=company,
        location=location,
        salary=salary,
        source_url=url,
        source_domain="jobbank.gc.ca"
    )


def extract_indeed(soup: BeautifulSoup, url: str) -> ScrapedJobData:
    """Extract job data from Indeed."""
    job_text_parts = []
    title = None
    company = None
    location = None
    salary = None
    
    # Job title - multiple possible selectors
    title_elem = (
        soup.find("h1", {"data-testid": "jobsearch-JobInfoHeader-title"}) or
        soup.find("h1", class_="jobsearch-JobInfoHeader-title") or
        soup.find("h1")
    )
    if title_elem:
        title = clean_text(title_elem.get_text())
        job_text_parts.append(f"Job Title: {title}")
    
    # Company name
    company_elem = (
        soup.find("div", {"data-testid": "inlineHeader-companyName"}) or
        soup.find("div", class_="jobsearch-InlineCompanyRating")
    )
    if company_elem:
        company = clean_text(company_elem.get_text())
        job_text_parts.append(f"Company: {company}")
    
    # Location
    location_elem = soup.find("div", {"data-testid": "job-location"})
    if location_elem:
        location = clean_text(location_elem.get_text())
        job_text_parts.append(f"Location: {location}")
    
    # Salary
    salary_elem = soup.find("div", {"id": "salaryInfoAndJobType"})
    if salary_elem:
        salary = clean_text(salary_elem.get_text())
        job_text_parts.append(f"Salary: {salary}")
    
    # Job description
    desc_elem = (
        soup.find("div", {"id": "jobDescriptionText"}) or
        soup.find("div", class_="jobsearch-jobDescriptionText")
    )
    if desc_elem:
        job_text_parts.append(f"\nJob Description:\n{clean_text(desc_elem.get_text())}")
    
    return ScrapedJobData(
        job_text="\n\n".join(job_text_parts),
        title=title,
        company=company,
        location=location,
        salary=salary,
        source_url=url,
        source_domain="indeed.com"
    )


def extract_generic(soup: BeautifulSoup, url: str) -> ScrapedJobData:
    """Generic extraction for unknown job sites."""
    job_text_parts = []
    title = None
    company = None
    
    # Try common title patterns
    title_elem = (
        soup.find("h1") or
        soup.find("title")
    )
    if title_elem:
        title = clean_text(title_elem.get_text())
        if title:
            job_text_parts.append(f"Title: {title}")
    
    # Try to find main content area
    main_content = (
        soup.find("main") or
        soup.find("article") or
        soup.find("div", class_=re.compile(r"(job|posting|description|content)", re.I)) or
        soup.find("div", {"id": re.compile(r"(job|posting|description|content)", re.I)})
    )
    
    if main_content:
        # Get all text from main content, preserving some structure
        text = clean_text(main_content.get_text(separator="\n"))
        job_text_parts.append(text)
    else:
        # Fallback: get body text but filter out navigation/footer
        body = soup.find("body")
        if body:
            # Remove script and style elements
            for elem in body.find_all(["script", "style", "nav", "footer", "header"]):
                elem.decompose()
            text = clean_text(body.get_text(separator="\n"))
            job_text_parts.append(text)
    
    return ScrapedJobData(
        job_text="\n\n".join(job_text_parts),
        title=title,
        company=company,
        source_url=url,
        source_domain=get_domain(url)
    )


async def scrape_job_url(url: str) -> ScrapedJobData:
    """
    Scrape job posting content from a URL.
    
    Args:
        url: The job posting URL to scrape
        
    Returns:
        ScrapedJobData containing the extracted job information
    """
    # Validate URL
    if not is_valid_url(url):
        return ScrapedJobData(
            job_text="",
            source_url=url,
            error="Invalid URL format. Please provide a valid job posting URL."
        )
    
    # Check for blocked domains
    if is_blocked_domain(url):
        domain = get_domain(url)
        return ScrapedJobData(
            job_text="",
            source_url=url,
            source_domain=domain,
            error=f"Sorry, {domain} blocks automated access. Please copy and paste the job description text manually."
        )
    
    try:
        # Fetch the page
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True
        ) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                }
            )
            response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, "lxml")
        
        # Route to appropriate extractor based on domain
        domain = get_domain(url)
        
        if "jobbank.gc.ca" in domain:
            result = extract_job_bank_canada(soup, url)
        elif "indeed" in domain:
            result = extract_indeed(soup, url)
        else:
            result = extract_generic(soup, url)
        
        # Validate we got some content
        if not result.job_text or len(result.job_text.strip()) < 50:
            result.error = (
                "Could not extract enough job content from this page. "
                "Please copy and paste the job description text manually."
            )
        
        return result
        
    except httpx.TimeoutException:
        return ScrapedJobData(
            job_text="",
            source_url=url,
            source_domain=get_domain(url),
            error="Request timed out. The job site may be slow or unavailable. Please try again or paste the text manually."
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            return ScrapedJobData(
                job_text="",
                source_url=url,
                source_domain=get_domain(url),
                error="This site blocked our request. Please copy and paste the job description text manually."
            )
        elif e.response.status_code == 404:
            return ScrapedJobData(
                job_text="",
                source_url=url,
                source_domain=get_domain(url),
                error="Job posting not found (404). The listing may have been removed."
            )
        else:
            return ScrapedJobData(
                job_text="",
                source_url=url,
                source_domain=get_domain(url),
                error=f"Failed to fetch page (HTTP {e.response.status_code}). Please try again or paste the text manually."
            )
    except Exception as e:
        return ScrapedJobData(
            job_text="",
            source_url=url,
            source_domain=get_domain(url),
            error=f"An error occurred while fetching the page. Please try again or paste the text manually."
        )
