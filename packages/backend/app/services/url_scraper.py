import httpx
import asyncio
import logging
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse
import re
import socket
import ipaddress


logger = logging.getLogger(__name__)


# Known cloud metadata CIDRs to block
_METADATA_CIDRS = [
    ipaddress.ip_network("169.254.169.254/32"),  # AWS/GCP metadata
    ipaddress.ip_network("100.100.100.200/32"),   # Alibaba metadata
]


def _is_dangerous_ip(ip_str: str) -> bool:
    """Check if an IP address is dangerous (private, loopback, link-local, metadata, etc.)."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # If we can't parse it, block it

    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified or ip.is_multicast:
        return True

    # Check cloud metadata CIDRs
    for cidr in _METADATA_CIDRS:
        if ip in cidr:
            return True

    return False


def _build_netloc(parsed, new_ip: str) -> str:
    """Build a netloc string replacing only the hostname with new_ip, preserving userinfo and port."""
    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo += f":{parsed.password}"
        userinfo += "@"

    # Wrap IPv6 addresses in brackets
    host = new_ip
    if ":" in new_ip and not new_ip.startswith("["):
        host = f"[{new_ip}]"

    port = ""
    if parsed.port:
        port = f":{parsed.port}"

    return f"{userinfo}{host}{port}"


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


async def scrape_job_url(
    url: str,
    resolved_ip: Optional[str] = None,
    host_header: Optional[str] = None
) -> ScrapedJobData:
    """
    Scrape job posting content from a URL.
    
    Args:
        url: The job posting URL to scrape
        resolved_ip: Optional pre-resolved IP address to connect to (SSRF protection)
        host_header: Optional Host header to send if connecting via IP
        
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

        # Configure request target
        target_url = url
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        # SSRF Protection: Use resolved IP if provided
        use_unverified_tls = False
        if resolved_ip and host_header:
            # Validate resolved_ip is not dangerous
            if _is_dangerous_ip(resolved_ip):
                logger.warning("Dangerous resolved_ip %s rejected — falling back to original URL", resolved_ip)
            else:
                parsed = urlparse(url)
                # Safe reconstruction to prevent accidental replace in path/query
                if parsed.hostname:
                    netloc = _build_netloc(parsed, resolved_ip)
                    target_url = parsed._replace(netloc=netloc).geturl()
                else:
                    target_url = url
                headers["Host"] = host_header
                use_unverified_tls = True
                logger.warning(
                    "Connecting via resolved IP %s with Host header %s — TLS verification disabled",
                    resolved_ip, host_header,
                )
        else:
            # No resolved_ip supplied — do pre-flight SSRF DNS validation
            parsed_initial = urlparse(url)
            initial_hostname = parsed_initial.hostname or ""
            try:
                loop = asyncio.get_running_loop()
                addr_infos = await loop.getaddrinfo(initial_hostname, None)
                for info in addr_infos:
                    ip = info[4][0]
                    if _is_dangerous_ip(ip):
                        raise ValueError(f"SSRF blocked: {initial_hostname} resolves to dangerous IP {ip}")
            except socket.gaierror:
                raise ValueError(f"DNS resolution failed for {initial_hostname}")

        # Fetch the page with manual redirect resolution to prevent SSRF bypass via redirects
        MAX_REDIRECTS = 5
        redirect_count = 0
        response_content = ""
        
        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=False,
            verify=not use_unverified_tls,
        ) as client:
            while redirect_count < MAX_REDIRECTS:
                response = await client.get(target_url, headers=headers)
                
                if response.status_code in (301, 302, 303, 307, 308):
                    redirect_url = response.headers.get("Location")
                    if not redirect_url:
                        break
                        
                    # Handle relative redirects — use current target host
                    if redirect_url.startswith("/"):
                        parsed_target = urlparse(target_url)
                        redirect_url = f"{parsed_target.scheme}://{parsed_target.netloc}{redirect_url}"
                        
                    # Re-validate the redirect URL for SSRF
                    parsed_redirect = urlparse(redirect_url)
                    if parsed_redirect.scheme not in ("http", "https"):
                        raise ValueError("Invalid redirect scheme")
                    
                    # Async DNS resolution and comprehensive SSRF checks
                    redirect_hostname = parsed_redirect.hostname or ""
                    try:
                        loop = asyncio.get_running_loop()
                        addr_infos = await loop.getaddrinfo(redirect_hostname, None)
                        new_ip = addr_infos[0][4][0] if addr_infos else ""
                    except socket.gaierror:
                        raise ValueError("Invalid redirect address — DNS resolution failed")
                    
                    if not new_ip or _is_dangerous_ip(new_ip):
                        raise ValueError("SSRF detected on redirect")
                        
                    # Setup next request — build netloc explicitly
                    new_netloc = _build_netloc(parsed_redirect, new_ip)
                    target_url = parsed_redirect._replace(netloc=new_netloc).geturl()
                    headers["Host"] = redirect_hostname
                    # IP-based netloc needs TLS verification disabled
                    use_unverified_tls = True
                    redirect_count += 1
                else:
                    response.raise_for_status()
                    # Buffer response content inside the async context
                    response_content = response.text
                    break
            else:
                raise ValueError("Too many redirects")
        
        # If redirect switched to IP-based netloc, re-request with TLS disabled
        if use_unverified_tls and not response_content:
            async with httpx.AsyncClient(
                timeout=REQUEST_TIMEOUT,
                follow_redirects=False,
                verify=False,
            ) as ip_client:
                response = await ip_client.get(target_url, headers=headers)
                response.raise_for_status()
                response_content = response.text
        
        # Parse HTML from buffered content
        soup = BeautifulSoup(response_content, "lxml")
        
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
