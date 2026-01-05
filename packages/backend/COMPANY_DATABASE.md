# Company Database Documentation

## Overview

The company database is a robust **hybrid system** for verifying company legitimacy and tracking company trustworthiness. It uses:

### 🌐 **Real-Time API Verification** (NEW!)

- **OpenCorporates API**: 200M+ companies from 140 official government registries
- **Wikidata**: Millions of notable companies worldwide (completely free, unlimited)
- **Abstract API**: Optional enrichment with industry, employee count, etc.

### 💾 **Local Database**  

- **1,500+ Pre-seeded Companies**: Fortune 500, Canadian, Global companies across all sectors
- **Fuzzy Matching**: Handles typos and variations in company names
- **User Reporting**: Crowdsourced data for company verification
- **Caching**: API results are cached locally for faster subsequent lookups

## How It Works

### Verification Flow

```
1. Check local database (instant) → Found? ✅ Return result
                                  ↓
2. Fuzzy match local DB (fast) → Found with 85%+ match? ✅ Return result
                                  ↓
3. Check scam patterns → Matches scam pattern? ⚠️ Return suspicious
                                  ↓
4. API Verification (if enabled):
   a. OpenCorporates → Found in official registry? ✅ Cache & return
   b. Wikidata → Found as notable company? ✅ Cache & return
                                  ↓
5. Return "Unknown" status
```

### API Usage

```bash
# Fast local-only check (default)
GET /api/company/check?name=Apple

# With real-time API verification for unknown companies
GET /api/company/check?name=Some%20Unknown%20Corp&use_api=true
```

## Environment Variables (Optional)

```bash
# For enhanced OpenCorporates access (higher rate limits)
OPENCORPORATES_API_KEY=your_key_here

# For Abstract API enrichment (100 free requests/month)
ABSTRACT_API_KEY=your_key_here
```

## Current Database Size

**1,583 pre-seeded companies** across all sectors:

| Region | Categories |
|--------|-----------|
| **Canada** | Banks, tech, retail, airlines, energy, insurance, media, government |
| **United States** | Tech, finance, healthcare, retail, manufacturing, media, government agencies |
| **United Kingdom** | Banks, oil & gas, consumer goods, pharma, media |
| **Europe** | Germany, France, Netherlands, Switzerland, Spain, Italy, Nordics |
| **Asia** | Japan, South Korea, China, India, Singapore, Australia |

| Sector | Coverage |
|--------|----------|
| **STEM** | Tech companies, national labs, research institutions, biotech |
| **Social Sciences** | Think tanks, policy research, market research, NGOs |
| **Professional Services** | Consulting, legal, accounting, HR |
| **Finance** | Banks, PE/VC, asset management, insurance |
| **Healthcare** | Hospitals, pharma, medical devices |

## How to Populate the Database

### Method 1: Automatic Seeding

The database is automatically seeded with the `VERIFIED_LEGIT_COMPANIES` list when the `CompanyDatabase` is first initialized. This happens automatically when the app starts.

### Method 2: Using the Python Script

Use the provided script to import companies from a text file or CSV:

```bash
# Import from a text file (one company per line)
python -m scripts.populate_companies --file companies.txt

# Import from a CSV file (first column should be company names)
python -m scripts.populate_companies --csv companies.csv

# Specify status and source
python -m scripts.populate_companies --file companies.txt --status verified_legit --source "fortune_500_2024"

# View current database statistics
python -m scripts.populate_companies
```

### Method 3: Using the API

#### Bulk Import via API

```bash
POST /api/company/bulk-import
Content-Type: application/json

{
  "companies": ["Company 1", "Company 2", "Company 3"],
  "status": "verified_legit",
  "source": "manual_import",
  "notes": "Imported from Fortune 500 list"
}
```

#### Import from File via API

```bash
POST /api/company/import-file
Content-Type: multipart/form-data

file: [upload your .txt, .csv, or .json file]
status: verified_legit
```

Supported file formats:

- **.txt**: One company name per line
- **.csv**: First column should contain company names
- **.json**: Array of company names or object with `companies` key

### Method 4: Programmatic Import

```python
from app.services.company_db import get_company_db, CompanyStatus

db = get_company_db()

# Import a list of companies
companies = ["Company A", "Company B", "Company C"]
result = db.bulk_import_companies(
    companies=companies,
    status=CompanyStatus.VERIFIED_LEGIT,
    source="programmatic_import",
    notes="Imported programmatically"
)

print(f"Imported: {result['imported']}, Skipped: {result['skipped']}")
```

## Data Sources for Company Lists

Here are some recommended sources to expand your company database:

### Free Sources

1. **Fortune 500 Lists**
   - Fortune 500 (US): <https://fortune.com/fortune500/>
   - Fortune Global 500: <https://fortune.com/global500/>
   - Download CSV/Excel files and extract company names

2. **Canadian Company Lists**
   - FP500 (Financial Post 500): <https://www.financialpost.com/fp500>
   - Canada's Top 100 Employers: <https://www.canadastop100.com/>
   - Tech Companies: <https://www.builtincanada.com/>

3. **Open Data Sources**
   - OpenCorporates: <https://opencorporates.com/> (140+ jurisdictions)
   - People Data Labs Free Dataset: <https://docs.peopledatalabs.com/docs/free-company-dataset> (22M+ companies)

4. **Job Board Company Lists**
   - LinkedIn Company Directory
   - Glassdoor Company Lists
   - Indeed Company Pages

### Paid/API Sources

1. **Company Verification APIs**
   - MeshVerify: Real-time US business verification
   - Gridlines: Company verification API
   - Surepass: Company monitoring API
   - Interzoid: Company verification with scoring

2. **Company Data Providers**
   - Bright Data: 147.8M+ company records
   - CompanyData.com: Verified global company databases
   - S&P Global: Company intelligence datasets

## Company Status Types

- **verified_legit**: Fortune 500, well-known companies (highest trust)
- **likely_legit**: Positive user reports, smaller known companies
- **unknown**: Not in database (default for new companies)
- **suspicious**: Some negative reports
- **known_scam**: Confirmed scam (multiple negative reports)

## Database Schema

```sql
CREATE TABLE companies (
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
);
```

## Best Practices

1. **Normalization**: Company names are automatically normalized (lowercase, remove common suffixes like "Inc", "LLC", etc.)

2. **Deduplication**: The database uses `name_normalized` as a unique key to prevent duplicates

3. **Source Tracking**: Always specify a `source` when importing to track where companies came from

4. **Status Assignment**:
   - Use `verified_legit` for Fortune 500, well-known companies
   - Use `likely_legit` for smaller but legitimate companies
   - Let user reports determine `suspicious` and `known_scam` statuses

5. **Regular Updates**: Consider setting up a scheduled job to import new companies from public sources

## API Endpoints

- `GET /api/company/check?name=CompanyName` - Check a company
- `POST /api/company/report` - Report a company (scam or legit)
- `GET /api/company/stats` - Get database statistics
- `POST /api/company/bulk-import` - Bulk import companies
- `POST /api/company/import-file` - Import from file

## Example: Importing Fortune 500 Companies

1. Download Fortune 500 list as CSV
2. Extract company names column
3. Save as `fortune500.txt` (one per line)
4. Run: `python -m scripts.populate_companies --file fortune500.txt --status verified_legit --source "fortune_500_2024"`

## Maintenance

- The database automatically seeds on first initialization
- Duplicate companies are automatically skipped during import
- User reports update company status based on report ratios
- Consider periodic imports from public sources to keep the database current
