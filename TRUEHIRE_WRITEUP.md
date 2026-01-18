# TrueHire - Technical Project Writeup

## Overview

**TrueHire** is an AI-powered job search platform that protects job seekers from scam postings and matches them with legitimate opportunities. It combines real-time job aggregation with multi-dimensional safety and fit analysis.

**Live Demo**: `tru3hire.netlify.app` (Frontend) + `safehire-api.onrender.com` (Backend)

---

## Core Value Proposition

> "Know if a job is real before you waste your time applying."

The Canadian job market is flooded with fake postings, data harvesting schemes, and ghost jobs. TrueHire analyzes each job posting using AI to give users confidence in their applications.

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React + Vite  │◄──►│   FastAPI       │◄──►│  PostgreSQL     │
│   (Netlify)     │    │   (Render)      │    │  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  ML Services    │
                       │  - Classifier   │
                       │  - Embeddings   │
                       │  - TF-IDF       │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  External APIs  │
                       │  - Adzuna       │
                       │  - Gemini       │
                       └─────────────────┘
```

---

## AI/ML Components

### 1. Fake Job Detection (Authenticity Scorer)

**Purpose**: Detect scam job postings before users apply.

**Approach**: Hybrid ML + Rule-Based

- **ML Model**: TF-IDF Vectorizer + Logistic Regression classifier
  - Trained on 17,000+ real/fake job postings dataset
  - Features: text patterns, word frequencies, n-grams
  - Outputs: fake_probability (0-1), authenticity_score (0-100)
- **Rule-Based Layer**: Regex pattern matching for red flags
  - Financial requests ("send money", "upfront payment")
  - Urgency tactics ("act now", "limited positions")
  - Unprofessional contacts (Gmail, WhatsApp)
  - Defensive language ("100% real", "not a scam")

**Location**: `app/ml/predictor.py`, `app/services/authenticity.py`

---

### 2. Semantic Resume Matching

**Purpose**: Measure how well a candidate's resume matches a job description.

**Approach**: Hybrid Embeddings + TF-IDF (70/30 weighted)

- **Semantic Embeddings** (70% weight):
  - Primary: Google Gemini `text-embedding-004` (768-dimensional)
  - Fallback: SentenceTransformers `all-MiniLM-L6-v2` (384-dimensional, local)
  - Computes cosine similarity between resume and job embeddings
  - Captures: meaning, context, transferable skills
- **TF-IDF Matching** (30% weight):
  - Sklearn TfidfVectorizer with custom preprocessing
  - Exact keyword matching for ATS compatibility
  - Captures: specific technologies, certifications, acronyms

**Location**: `app/ml/embeddings.py`, `app/ml/resume_matcher.py`

---

### 3. Market Activity Analysis

**Purpose**: Verify if a company is actually hiring (not a ghost job).

**Approach**: Live API integration with Adzuna job board

- Queries: How many jobs does this company have listed?
- Queries: How many similar titles exist in the market?
- Scoring: More active companies = higher hiring likelihood
- Caching: 60-minute TTL to reduce API calls

**Location**: `app/services/market_activity.py`

---

### 4. Company Reputation Analysis

**Purpose**: Assess employer trustworthiness.

**Approach**: Multi-source heuristics

- Known company database matching
- Presence on verified platforms (LinkedIn, Glassdoor)
- Industry/sector classification
- Red flag pattern detection (vague names, PO box addresses)

**Location**: `app/services/reputation.py`, `app/services/company_db.py`

---

## TrueScore Algorithm

The **TrueScore** (0-100) combines all AI signals into a single actionable metric:

```python
WEIGHTS = {
    "resume_match": 0.30,       # Does this job fit the user?
    "authenticity": 0.25,       # Is this job real?
    "hiring_activity": 0.20,    # Is the company actively hiring?
    "recency": 0.15,            # How fresh is this posting?
    "company_reputation": 0.10, # What do employees say?
}
```

**Risk Levels**:

- 🟢 **Safe** (70-100): High confidence, apply with confidence
- 🟡 **Caution** (40-69): Some concerns, research before applying
- 🔴 **Danger** (0-39): Likely scam or ghost job, avoid

---

## Match Score (Quick Scoring)

For batch job listing, we use a **lightweight "Match Score"**:

- Uses TF-IDF only (no embeddings) for speed
- Skips market activity API calls
- Aggressive caching (30-minute TTL)
- Returns results in <100ms per job

**Key distinction**:

- **Match Score**: Fast, keyword-based (shown in job list)
- **TrueScore**: Full AI analysis (shown when user clicks "View TrueScore")

**Location**: `app/services/quick_scorer.py`, `app/services/cache.py`

---

## Interview Probability Score

**Purpose**: Predict likelihood of getting an interview.

**Algorithm v2** incorporates:

1. **Competition estimation** (job age × category × location)
2. **ATS pass probability** (keyword density)
3. **Recency multiplier** (fresh jobs = 8x higher response rate)
4. **Ghost job detection** (stale postings with corporate-speak)
5. **Easy Apply penalty** (high-volume applications = low response)

**Output**: 0-100% probability with action recommendations:

- `apply_now` - Strong match, fresh posting
- `tailor_resume` - Good fit but needs optimization
- `high_competition` - Many applicants, stand out
- `likely_ghost` - Probably not actively recruiting

---

## Progressive Loading Architecture

**Problem**: Full TrueScore analysis for 30+ jobs = 30+ seconds = timeout

**Solution**: Two-phase loading

1. **Phase 1** (< 1 sec): Fetch jobs from Adzuna API, display immediately
2. **Phase 2** (background): Calculate Match Scores in batches of 8

```
User searches "Software Engineer"
    │
    ▼ (50ms)
┌─────────────────────────────────────┐
│ /api/jobs/search                    │
│ → Adzuna API                        │
│ → Return 30 jobs instantly          │
└─────────────────────────────────────┘
    │
    ▼ (displayed immediately)
┌─────────────────────────────────────┐
│ Jobs shown with "Matching..." badge │
└─────────────────────────────────────┘
    │
    ▼ (background, 8 at a time)
┌─────────────────────────────────────┐
│ /api/jobs/scores (batch)            │
│ → QuickScorer (TF-IDF + cache)      │
│ → Update UI progressively           │
└─────────────────────────────────────┘
```

---

## Application Tracking System

**Purpose**: Learn from user outcomes to improve recommendations.

**Features**:

- Log applications with timestamp, TrueScore at application
- Track outcomes: no_response, rejected, interview, offer
- Calculate response rate by TrueScore range
- Company-level response statistics

**Future**: Use aggregated outcomes to weight TrueScore predictions.

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | React 18, TypeScript, Tailwind CSS, Vite  |
| Auth       | Clerk (with onboarding flow)              |
| Backend    | FastAPI, Python 3.11+                     |
| ML         | Scikit-learn, SentenceTransformers, NumPy |
| Embeddings | Google Gemini API, all-MiniLM-L6-v2       |
| Database   | PostgreSQL (Supabase)                     |
| Job Data   | Adzuna API                                |
| Hosting    | Netlify (FE) + Render (BE)                |

---

## Key Files

| File                           | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `app/services/scorer.py`       | TrueScore orchestration (1100 lines) |
| `app/services/authenticity.py` | Fake job detection ML                |
| `app/ml/embeddings.py`         | Semantic embedding service           |
| `app/ml/resume_matcher.py`     | Hybrid resume matching               |
| `app/services/quick_scorer.py` | Fast batch scoring                   |
| `app/services/cache.py`        | TTL caching layer                    |
| `pages/JobsPage.tsx`           | Main job search UI                   |

---

## Differentiators

1. **Real Safety Analysis** - Not just keyword matching; trained ML model + rule engine
2. **Semantic Understanding** - Embeddings understand "Python developer" ≈ "Software engineer"
3. **Live Market Signals** - Verifies companies are actually hiring today
4. **Interview Probability** - Actionable predictions, not just scores
5. **Speed + Accuracy** - Progressive loading means instant results without sacrificing quality

---

_Built for Canadian job seekers by someone who understands the struggle._
