"""
Company Verification Database Service

Provides company trustworthiness checking with:
- SQLite database for persistence
- Fortune 500 + known legit companies as seed data
- Fuzzy matching for typo tolerance
- User report system for crowdsourced data
"""

import sqlite3
import os
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

# Try to import rapidfuzz for fuzzy matching
try:
    from rapidfuzz import fuzz, process
    FUZZY_ENABLED = True
except ImportError:
    FUZZY_ENABLED = False
    print("Warning: rapidfuzz not installed. Fuzzy matching disabled.")


class CompanyStatus(Enum):
    VERIFIED_LEGIT = "verified_legit"  # Fortune 500, well-known companies
    LIKELY_LEGIT = "likely_legit"      # Positive user reports
    UNKNOWN = "unknown"                 # Not in database
    SUSPICIOUS = "suspicious"           # Some negative reports
    KNOWN_SCAM = "known_scam"          # Confirmed scam


@dataclass
class CompanyCheckResult:
    company_name: str
    status: CompanyStatus
    confidence: float  # 0.0 to 1.0
    match_type: str    # "exact", "fuzzy", "none"
    matched_name: Optional[str] = None  # The name we matched against
    scam_reports: int = 0
    legit_reports: int = 0
    notes: Optional[str] = None


# =============================================================================
# Fortune 500 + Well-Known Companies (Seed Data)
# =============================================================================

VERIFIED_LEGIT_COMPANIES = [
    # Tech Giants
    "Apple", "Microsoft", "Google", "Alphabet", "Amazon", "Meta", "Facebook",
    "Netflix", "Tesla", "NVIDIA", "Adobe", "Salesforce", "Oracle", "IBM",
    "Intel", "Cisco", "Dell", "HP", "Hewlett-Packard", "VMware", "ServiceNow",
    "Workday", "Shopify", "Zoom", "Slack", "Dropbox", "Twitter", "X Corp",
    "LinkedIn", "PayPal", "Square", "Block", "Stripe", "Coinbase", "Robinhood",
    "Uber", "Lyft", "Airbnb", "DoorDash", "Instacart", "Spotify", "Pinterest",
    
    # Consulting & Professional Services
    "McKinsey", "McKinsey & Company", "Bain", "Bain & Company", "BCG",
    "Boston Consulting Group", "Deloitte", "PwC", "PricewaterhouseCoopers",
    "EY", "Ernst & Young", "KPMG", "Accenture", "Capgemini", "Cognizant",
    "Infosys", "Wipro", "TCS", "Tata Consultancy Services", "HCL",
    
    # Finance & Banking
    "JPMorgan", "JPMorgan Chase", "Goldman Sachs", "Morgan Stanley",
    "Bank of America", "Wells Fargo", "Citibank", "Citigroup", "HSBC",
    "Barclays", "Deutsche Bank", "Credit Suisse", "UBS", "BlackRock",
    "Vanguard", "Fidelity", "Charles Schwab", "American Express", "Visa",
    "Mastercard", "Capital One", "Discover",
    
    # Healthcare & Pharma
    "Johnson & Johnson", "Pfizer", "Moderna", "Merck", "AbbVie", "Bristol-Myers",
    "Eli Lilly", "Novartis", "Roche", "AstraZeneca", "GlaxoSmithKline", "GSK",
    "UnitedHealth", "CVS Health", "Anthem", "Cigna", "Humana", "Kaiser",
    
    # Retail & Consumer
    "Walmart", "Target", "Costco", "Home Depot", "Lowe's", "Best Buy",
    "Kroger", "Walgreens", "CVS", "McDonald's", "Starbucks", "Nike", "Adidas",
    "Coca-Cola", "PepsiCo", "Unilever", "Procter & Gamble", "P&G", "Nestle",
    
    # Manufacturing & Industrial
    "General Electric", "GE", "3M", "Honeywell", "Caterpillar", "John Deere",
    "Boeing", "Lockheed Martin", "Raytheon", "Northrop Grumman", "General Dynamics",
    "Ford", "General Motors", "GM", "Toyota", "Honda", "BMW", "Mercedes-Benz",
    
    # Media & Entertainment
    "Disney", "Warner Bros", "NBCUniversal", "Paramount", "Sony", "ViacomCBS",
    "Fox", "News Corp", "New York Times", "Washington Post", "Bloomberg",
    
    # Telecom
    "AT&T", "Verizon", "T-Mobile", "Comcast", "Charter", "Spectrum",
    
    # Energy
    "ExxonMobil", "Chevron", "Shell", "BP", "ConocoPhillips", "NextEra Energy",
]

# Known scam patterns (companies that don't exist or are fake)
KNOWN_SCAM_PATTERNS = [
    "easy money", "work from home guaranteed", "no experience needed $$$",
    "unlimited income", "be your own boss", "make money fast",
]


class CompanyDatabase:
    """SQLite-backed company verification database."""
    
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Use same directory as main database
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            db_path = os.path.join(base_dir, "companies.db")
        
        self.db_path = db_path
        self._init_database()
        self._seed_verified_companies()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_database(self):
        """Initialize the companies table."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                name_normalized TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'unknown',
                scam_reports INTEGER DEFAULT 0,
                legit_reports INTEGER DEFAULT 0,
                source TEXT DEFAULT 'seed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name_normalized)
            )
        """)
        
        # Create index for fast lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_companies_normalized 
            ON companies(name_normalized)
        """)
        
        conn.commit()
        conn.close()
    
    def _normalize_name(self, name: str) -> str:
        """Normalize company name for matching."""
        # Lowercase, strip whitespace, remove common suffixes
        normalized = name.lower().strip()
        suffixes = [" inc", " inc.", " llc", " ltd", " corp", " corporation", 
                    " co", " company", " technologies", " tech", " solutions"]
        for suffix in suffixes:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
        return normalized.strip()
    
    def _seed_verified_companies(self):
        """Seed database with Fortune 500 and known legit companies."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        for company in VERIFIED_LEGIT_COMPANIES:
            normalized = self._normalize_name(company)
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO companies 
                    (name, name_normalized, status, source, notes)
                    VALUES (?, ?, ?, ?, ?)
                """, (company, normalized, CompanyStatus.VERIFIED_LEGIT.value, 
                      "fortune500", "Pre-seeded verified company"))
            except sqlite3.IntegrityError:
                pass  # Already exists
        
        conn.commit()
        conn.close()
    
    def check_company(self, company_name: str) -> CompanyCheckResult:
        """
        Check if a company is known and trustworthy.
        
        Returns CompanyCheckResult with status and confidence.
        """
        if not company_name or len(company_name.strip()) < 2:
            return CompanyCheckResult(
                company_name=company_name,
                status=CompanyStatus.UNKNOWN,
                confidence=0.0,
                match_type="none",
                notes="Company name too short or empty"
            )
        
        normalized = self._normalize_name(company_name)
        
        # Step 1: Exact match
        result = self._exact_match(normalized, company_name)
        if result:
            return result
        
        # Step 2: Fuzzy match (if rapidfuzz available)
        if FUZZY_ENABLED:
            result = self._fuzzy_match(normalized, company_name)
            if result:
                return result
        
        # Step 3: Check for scam patterns
        if self._contains_scam_pattern(company_name):
            return CompanyCheckResult(
                company_name=company_name,
                status=CompanyStatus.SUSPICIOUS,
                confidence=0.7,
                match_type="pattern",
                notes="Company name contains suspicious patterns"
            )
        
        # Not found
        return CompanyCheckResult(
            company_name=company_name,
            status=CompanyStatus.UNKNOWN,
            confidence=0.0,
            match_type="none",
            notes="Company not found in database"
        )
    
    def _exact_match(self, normalized: str, original: str) -> Optional[CompanyCheckResult]:
        """Try exact match in database."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT name, status, scam_reports, legit_reports, notes
            FROM companies WHERE name_normalized = ?
        """, (normalized,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return CompanyCheckResult(
                company_name=original,
                status=CompanyStatus(row["status"]),
                confidence=1.0,
                match_type="exact",
                matched_name=row["name"],
                scam_reports=row["scam_reports"],
                legit_reports=row["legit_reports"],
                notes=row["notes"]
            )
        
        return None
    
    def _fuzzy_match(self, normalized: str, original: str) -> Optional[CompanyCheckResult]:
        """Try fuzzy matching against known companies."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT name, name_normalized, status FROM companies")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return None
        
        # Get all normalized names
        company_names = [(row["name"], row["name_normalized"], row["status"]) for row in rows]
        normalized_names = [c[1] for c in company_names]
        
        # Find best match
        match = process.extractOne(normalized, normalized_names, scorer=fuzz.ratio)
        
        if match and match[1] >= 85:  # 85% similarity threshold
            matched_normalized = match[0]
            # Find the original entry
            for name, norm, status in company_names:
                if norm == matched_normalized:
                    return CompanyCheckResult(
                        company_name=original,
                        status=CompanyStatus(status),
                        confidence=match[1] / 100.0,
                        match_type="fuzzy",
                        matched_name=name,
                        notes=f"Fuzzy match ({match[1]}% similarity)"
                    )
        
        return None
    
    def _contains_scam_pattern(self, name: str) -> bool:
        """Check if name contains known scam patterns."""
        name_lower = name.lower()
        return any(pattern in name_lower for pattern in KNOWN_SCAM_PATTERNS)
    
    def report_company(self, company_name: str, is_scam: bool, notes: Optional[str] = None) -> bool:
        """
        Submit a user report about a company.
        
        Args:
            company_name: Name of the company
            is_scam: True if reporting as scam, False if reporting as legit
            notes: Optional notes about the report
        
        Returns:
            True if report was recorded successfully
        """
        normalized = self._normalize_name(company_name)
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Check if company exists
        cursor.execute(
            "SELECT id, scam_reports, legit_reports FROM companies WHERE name_normalized = ?",
            (normalized,)
        )
        row = cursor.fetchone()
        
        if row:
            # Update existing
            if is_scam:
                cursor.execute("""
                    UPDATE companies 
                    SET scam_reports = scam_reports + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (row["id"],))
            else:
                cursor.execute("""
                    UPDATE companies 
                    SET legit_reports = legit_reports + 1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (row["id"],))
            
            # Update status based on reports
            new_scam = row["scam_reports"] + (1 if is_scam else 0)
            new_legit = row["legit_reports"] + (0 if is_scam else 1)
            new_status = self._calculate_status(new_scam, new_legit)
            
            cursor.execute(
                "UPDATE companies SET status = ? WHERE id = ?",
                (new_status.value, row["id"])
            )
        else:
            # Insert new
            status = CompanyStatus.SUSPICIOUS if is_scam else CompanyStatus.LIKELY_LEGIT
            cursor.execute("""
                INSERT INTO companies 
                (name, name_normalized, status, scam_reports, legit_reports, source, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (company_name, normalized, status.value, 
                  1 if is_scam else 0, 0 if is_scam else 1, "user_report", notes))
        
        conn.commit()
        conn.close()
        return True
    
    def _calculate_status(self, scam_reports: int, legit_reports: int) -> CompanyStatus:
        """Calculate status based on report counts."""
        total = scam_reports + legit_reports
        if total == 0:
            return CompanyStatus.UNKNOWN
        
        scam_ratio = scam_reports / total
        
        if scam_ratio >= 0.8 and scam_reports >= 3:
            return CompanyStatus.KNOWN_SCAM
        elif scam_ratio >= 0.5:
            return CompanyStatus.SUSPICIOUS
        elif scam_ratio <= 0.2 and legit_reports >= 3:
            return CompanyStatus.LIKELY_LEGIT
        else:
            return CompanyStatus.UNKNOWN
    
    def get_stats(self) -> Dict:
        """Get database statistics."""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as total FROM companies")
        total = cursor.fetchone()["total"]
        
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM companies GROUP BY status
        """)
        by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            "total_companies": total,
            "by_status": by_status,
            "fuzzy_matching_enabled": FUZZY_ENABLED
        }


# Global instance
_company_db: Optional[CompanyDatabase] = None


def get_company_db() -> CompanyDatabase:
    """Get or create the global CompanyDatabase instance."""
    global _company_db
    if _company_db is None:
        _company_db = CompanyDatabase()
    return _company_db


def check_company(company_name: str) -> CompanyCheckResult:
    """Convenience function to check a company."""
    return get_company_db().check_company(company_name)


def report_company(company_name: str, is_scam: bool, notes: Optional[str] = None) -> bool:
    """Convenience function to report a company."""
    return get_company_db().report_company(company_name, is_scam, notes)
