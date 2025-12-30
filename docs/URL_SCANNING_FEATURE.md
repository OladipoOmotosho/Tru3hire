# URL Job Scanning Feature

Analyze job postings by simply pasting a URL — no need to copy the full job description.

## Why This Feature?

Job seekers often find postings on various job boards (Indeed, Job Bank Canada, Glassdoor) and want to quickly verify legitimacy. Manually copying and pasting long job descriptions is tedious and error-prone. URL scanning makes the verification process as simple as sharing a link.

---

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  User       │────▶│  /api/analyze-url │────▶│   URL Scraper   │────▶│  TrueScore   │
│  pastes URL │     │   endpoint        │     │   Service       │     │  Analysis    │
└─────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
```

### 1. URL Validation

The scraper first validates the URL format and checks if the domain is known to block scraping (e.g., LinkedIn).

### 2. Content Extraction

Using `httpx` for HTTP requests and `BeautifulSoup` for HTML parsing, the scraper:

- Fetches the job posting page
- Identifies the job board type (Job Bank, Indeed, or generic)
- Extracts structured data: title, company, location, salary, description

### 3. Site-Specific Extractors

Different job boards have different HTML structures. We use specialized extractors:

| Site                | Extraction Strategy                                          |
| ------------------- | ------------------------------------------------------------ |
| **Job Bank Canada** | Schema.org microdata (`property="hiringOrganization"`, etc.) |
| **Indeed**          | Data-testid attributes and common class patterns             |
| **Generic**         | Semantic HTML (`<main>`, `<article>`) and regex patterns     |

### 4. Fallback to Generic

If no site-specific extractor matches, we fall back to generic extraction that looks for common job posting patterns in any HTML structure.

### 5. TrueScore Analysis

The extracted text is passed to the existing ML-powered TrueScore analyzer — the same pipeline used for manual text input.

---

## Architecture

### Backend

```
packages/backend/
├── app/
│   ├── routes/
│   │   └── analyze.py          # /api/analyze-url endpoint
│   └── services/
│       └── url_scraper.py      # Scraping service
└── requirements.txt            # Added beautifulsoup4, lxml
```

### Frontend

```
packages/frontend/src/
├── components/
│   ├── JobInputForm.tsx        # Text/URL toggle tabs
│   └── ui/
│       └── input.tsx           # URL input component
├── pages/
│   └── AnalyzePage.tsx         # Handles URL analysis flow
└── lib/
    └── api.ts                  # analyzeJobUrl() function
```

---

## Design Decisions

### Why Server-Side Scraping?

- **CORS restrictions**: Browsers block cross-origin requests to job sites
- **JavaScript rendering**: Some sites require JS execution (possible to add with Playwright later)
- **Rate limiting**: Centralized control over request frequency
- **User privacy**: URLs never leave our backend

### Why BeautifulSoup over Playwright/Selenium?

- **Speed**: No browser startup overhead (milliseconds vs seconds)
- **Simplicity**: Most job boards serve static HTML
- **Resources**: Lower memory and CPU usage
- **Trade-off**: Can't handle JS-heavy sites, but covers 90%+ of use cases

### Why Site-Specific Extractors?

- **Accuracy**: Generic extraction misses structured data
- **Reliability**: Known selectors are more stable than heuristics
- **Extensibility**: Easy to add new extractors for popular sites

### Graceful Degradation

If URL scraping fails (blocked, timeout, parsing error), we:

1. Show a clear, friendly error message
2. Guide users to paste the text manually instead
3. Never leave users stuck

---

## Supported Sites

| Status                 | Sites                                             |
| ---------------------- | ------------------------------------------------- |
| ✅ **Full Support**    | Job Bank Canada, Indeed                           |
| ✅ **Generic Support** | Glassdoor, Google Jobs, most company career pages |
| ❌ **Blocked**         | LinkedIn (requires login), Facebook Jobs          |

---

## API Reference

### `POST /api/analyze-url`

**Request:**

```
Content-Type: multipart/form-data

job_url: https://www.jobbank.gc.ca/jobsearch/jobposting/12345678
```

**Response:**

```json
{
  "true_score": 72,
  "risk_level": "safe",
  "breakdown": { ... },
  "insights": [ ... ],
  "recommendations": [ ... ],
  "company": { ... },
  "scraped": {
    "title": "Software Developer",
    "company": "Example Corp",
    "location": "Toronto, ON",
    "salary": "$80,000 - $100,000",
    "source_domain": "jobbank.gc.ca"
  }
}
```

---

## Future Improvements

- [ ] Add Playwright for JavaScript-rendered pages
- [ ] Cache scraped results to reduce duplicate requests
- [ ] Add rate limiting per IP/user
- [ ] Support more job boards (Workday, Lever, Greenhouse)
- [ ] Extract and display job requirements separately
