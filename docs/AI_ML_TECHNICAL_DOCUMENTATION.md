# TrueHire - AI/ML Technical Documentation

> Comprehensive documentation of the AI and Machine Learning implementation powering TrueHire's job posting analysis.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [TrueScore Model](#truescore-model)
3. [Fake Job Detection (ML)](#fake-job-detection-ml)
4. [Rule-Based Analysis](#rule-based-analysis)
5. [Company Verification System](#company-verification-system)
6. [Bias & Fairness Detection](#bias--fairness-detection)
7. [Resume Matching](#resume-matching)
8. [Data Flow](#data-flow)
9. [How to Retrain](#how-to-retrain)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Job Text Input                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: Company Verification                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Extract Company │───►│ SQLite Lookup   │───► Company Status  │
│  │     Name        │    │ + Fuzzy Match   │    (legit/scam/unknown)│
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STEP 2: TrueScore Analysis                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               TrueScoreAggregator                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │Authenticity │ │   Bias &    │ │  Resume     │          │ │
│  │  │  (25%)      │ │  Fairness   │ │   Match     │          │ │
│  │  │             │ │   (15%)     │ │   (25%)     │          │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘          │ │
│  │         │               │               │                  │ │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐          │ │
│  │  │ ML Model    │ │ Bias Rules  │ │ TF-IDF      │          │ │
│  │  │ (70%)       │ └─────────────┘ │ Cosine Sim  │          │ │
│  │  │ +           │                 └─────────────┘          │ │
│  │  │ Rules (30%) │                                          │ │
│  │  └─────────────┘                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐                          │ │
│  │  │  Hiring     │ │  Company    │                          │ │
│  │  │ Likelihood  │ │ Reputation  │                          │ │
│  │  │   (25%)     │ │   (10%)     │                          │ │
│  │  └─────────────┘ └─────────────┘                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Final TrueScore (0-100)                    │
│              + Risk Level + Insights + Recommendations           │
└─────────────────────────────────────────────────────────────────┘
```

---

## TrueScore Model

### Overview

TrueScore is a **weighted composite score** (0-100) that evaluates job postings across 5 dimensions.

### Weight Distribution

| Dimension              | Weight | Description                 |
| ---------------------- | ------ | --------------------------- |
| **Authenticity**       | 25%    | Is the job real or a scam?  |
| **Hiring Likelihood**  | 25%    | Will they actually hire?    |
| **Resume Match**       | 25%    | Does your resume fit?       |
| **Bias & Fairness**    | 15%    | Is the workplace inclusive? |
| **Company Reputation** | 10%    | What do employees say?      |

### Score Calculation

```python
true_score = (
    authenticity * 0.25 +
    hiring_likelihood * 0.25 +
    resume_match * 0.25 +
    bias_fairness * 0.15 +
    company_reputation * 0.10
)
```

### Risk Levels

| Score Range | Risk Level | Meaning                      |
| ----------- | ---------- | ---------------------------- |
| 70-100      | `safe`     | Low risk, apply confidently  |
| 40-69       | `caution`  | Some concerns, research more |
| 0-39        | `danger`   | High risk, likely scam       |

---

## Fake Job Detection (ML)

### Model Architecture

```
Job Text (title + description + requirements)
    ↓
Text Preprocessing (lowercase, remove special chars)
    ↓
TF-IDF Vectorizer (5000 features, bigrams)
    ↓
RandomForest Classifier (100 trees, balanced class weights)
    ↓
Fake/Real Prediction + Confidence Score
```

### Training Data

| Property          | Value                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **Dataset**       | [Kaggle Fake Job Posting](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction) |
| **Total Samples** | 17,880                                                                                                     |
| **Real Jobs**     | 17,014 (95%)                                                                                               |
| **Fake Jobs**     | 866 (5%)                                                                                                   |
| **Model Size**    | 3.5 MB                                                                                                     |

### Key Design Decisions

| Decision                              | Rationale                             |
| ------------------------------------- | ------------------------------------- |
| **TF-IDF over embeddings**            | Faster training, no GPU, small model  |
| **RandomForest over neural networks** | Interpretable, robust, good for text  |
| **Class weight balancing**            | Handles 5% vs 95% class imbalance     |
| **Hybrid scoring**                    | 70% ML + 30% rules for explainability |

### Files

```
packages/backend/app/ml/
├── __init__.py          # Module exports
├── train_model.py       # Training script
├── predictor.py         # Inference service
└── models/
    └── fake_job_classifier.joblib  # Saved model (3.5MB)
```

### Usage

```python
from app.ml.predictor import predict_fake_job

result = predict_fake_job("Job description text...")
# Returns:
# {
#   "is_fake": bool,
#   "confidence": float (0-1),
#   "fake_probability": float,
#   "authenticity_score": float (0-100),
#   "risk_level": "low" | "medium" | "high" | "critical"
# }
```

---

## Rule-Based Analysis

### Hybrid Approach

The authenticity score combines **ML prediction (70%)** with **rule-based heuristics (30%)** for:

- Explainability (users see specific red flags)
- Robustness (rules catch patterns ML might miss)
- Fallback (works even if ML model fails)

### Red Flag Patterns

Regex patterns that indicate scams:

| Category                   | Examples                                      | Penalty |
| -------------------------- | --------------------------------------------- | ------- |
| **Financial Request**      | "send money", "training fee", "buy equipment" | 15-30   |
| **PII Request**            | "social security", "credit card number"       | 15-30   |
| **Unrealistic Pay**        | "earn $5000/week", "unlimited income"         | 15-25   |
| **Urgency Tactics**        | "act now", "limited time", "immediate start"  | 8-10    |
| **Defensive Language**     | "100% legitimate", "not a scam"               | 10-15   |
| **Unprofessional Contact** | gmail.com, WhatsApp, Telegram                 | 8-12    |

### Legitimacy Signals

Positive indicators that boost the score:

| Signal                         | Bonus |
| ------------------------------ | ----- |
| LinkedIn/Glassdoor URL         | +10   |
| Benefits mentioned (401k, PTO) | +8    |
| Proper interview process       | +5    |
| Physical office location       | +5    |
| Company history/founding date  | +5    |

### Score Formula

```python
base_score = 85  # Start optimistic

# Apply penalties from red flags
total_penalty = sum(rf["penalty"] for rf in red_flags)

# Apply bonuses from positive signals
total_bonus = sum(ps["bonus"] for ps in positive_signals)

# Rule-based score
rule_score = base_score - total_penalty + total_bonus

# Final hybrid score (if ML available)
final_score = 0.7 * ml_score + 0.3 * rule_score
```

---

## Company Verification System

### Two-Step Analysis Flow

1. **Extract company name** from job text using regex patterns
2. **Lookup company** in database
3. **Return status** before running ML analysis

### Company Status Types

| Status           | Risk    | Description                       |
| ---------------- | ------- | --------------------------------- |
| `verified_legit` | Low     | Fortune 500, well-known companies |
| `likely_legit`   | Low     | Positive user reports             |
| `unknown`        | Unknown | Not in database                   |
| `suspicious`     | Medium  | Some negative reports             |
| `known_scam`     | High    | Confirmed scam company            |

### Database

- **Storage**: SQLite (local file)
- **Seed Data**: 100+ Fortune 500 companies
- **Fuzzy Matching**: `rapidfuzz` library (85% similarity threshold)
- **User Reports**: Community-sourced intelligence

### Seed Companies Include

- Tech Giants: Apple, Microsoft, Google, Amazon, Meta, Netflix, etc.
- Consulting: McKinsey, BCG, Deloitte, PwC, Accenture
- Finance: JPMorgan, Goldman Sachs, Morgan Stanley, Visa
- Healthcare: Johnson & Johnson, Pfizer, UnitedHealth
- Retail: Walmart, Target, Costco, Starbucks
- And 70+ more...

### API Endpoints

```
GET /api/company/check?name=Google    → Check company status
POST /api/company/report              → Submit user report
GET /api/company/stats                → Database statistics
```

---

## Bias & Fairness Detection

### Research Basis

Based on academic research:

- Gaucher, D., Friesen, J., & Kay, A. C. (2011). "Evidence that gendered wording in job advertisements exists and sustains gender inequality."

### Masculine-Coded Words

Words that may discourage female applicants:

```
aggressive, ambitious, analytical, assertive, autonomous,
competitive, confident, decisive, determined, dominant,
driven, fearless, headstrong, hierarchical, independent,
ninja, rockstar, brogrammer, guru, wizard,
crush it, kill it, dominate, attack, conquer
```

**Scoring**: 1-2 words = OK, 3+ words = penalty (5 points per extra word, max 25)

### Feminine-Coded Words

Words that may discourage male applicants (less common):

```
collaborative, committed, compassionate, cooperative,
dependable, emotional, empathetic, interpersonal,
nurturing, pleasant, polite, sensitive, supportive
```

### Exclusionary Phrases

| Phrase                   | Penalty | Why                              |
| ------------------------ | ------- | -------------------------------- |
| "young and dynamic"      | -15     | Age discrimination               |
| "digital native"         | -10     | Age discrimination               |
| "native English speaker" | -10     | May exclude qualified applicants |
| "culture fit"            | -5      | Often used to justify bias       |
| "work hard play hard"    | -5      | Code for overwork culture        |
| "like a family"          | -5      | Often hides poor boundaries      |

### Inclusive Signals

| Signal                | Bonus |
| --------------------- | ----- |
| "equal opportunity"   | +10   |
| "diversity"           | +8    |
| "inclusive"           | +8    |
| "accessible"          | +5    |
| "parental leave"      | +5    |
| "flexible" / "remote" | +3    |

---

## Resume Matching

### Algorithm

Uses **TF-IDF Cosine Similarity**:

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

vectorizer = TfidfVectorizer()
vectors = vectorizer.fit_transform([job_text, resume_text])
similarity = cosine_similarity(vectors[0], vectors[1])[0][0]

# Convert to 0-100 score
match_score = similarity * 100
```

### Why TF-IDF?

| Factor                        | Explanation                                          |
| ----------------------------- | ---------------------------------------------------- |
| **Weighs rare terms higher**  | Technical skills get higher weight than common words |
| **Handles length variations** | Works well with different resume/job lengths         |
| **No GPU required**           | Unlike BERT embeddings                               |
| **Fast inference**            | <10ms per comparison                                 |

### Fallback

If TF-IDF fails, uses simple keyword overlap:

```python
job_words = set(job_text.lower().split())
resume_words = set(resume_text.lower().split())
overlap = len(job_words & resume_words)
match_ratio = overlap / len(job_words)
```

---

## Data Flow

### Request → Response

```
1. User submits job posting text
                ↓
2. STEP 1: Extract company name
                ↓
3. Company database lookup (SQLite + fuzzy match)
                ↓
4. STEP 2: TrueScoreAggregator.analyze()
   ├── authenticity_scorer.analyze()
   │   ├── ML predictor (TF-IDF + RandomForest)
   │   └── Rule-based patterns
   ├── bias_scorer.analyze()
   ├── resume_matcher (if resume provided)
   ├── job_activity_calculator
   └── reputation_calculator
                ↓
5. Weighted combination → TrueScore
                ↓
6. Generate insights & recommendations
                ↓
7. Return JSON response with:
   - true_score: 0-100
   - risk_level: safe/caution/danger
   - breakdown: {authenticity, hiring, resume, bias, reputation}
   - company: {name, status, risk_level}
   - insights: [{type, icon, message}]
   - recommendations: [{action, impact}]
```

---

## How to Retrain

### Prerequisites

```bash
cd packages/backend
pip install -r requirements.txt
```

### Train New Model

```bash
python -m app.ml.train_model
```

This will:

1. Load the Kaggle CSV (`fake_job_postings.csv`)
2. Preprocess and combine text features
3. Train TF-IDF + RandomForest pipeline
4. Evaluate and print metrics
5. Save model to `app/ml/models/fake_job_classifier.joblib`

### Verify Model

```python
from app.ml.predictor import get_model_info
print(get_model_info())
# {'version': '1.0.0', 'metrics': {...}, 'status': 'loaded'}
```

---

## Dependencies

```
scikit-learn    # ML models
pandas          # Data processing
joblib          # Model serialization
rapidfuzz       # Fuzzy string matching
```

---

## Future Improvements

- [ ] Fine-tune with Canadian job market data
- [ ] Add BERT embeddings for semantic understanding
- [ ] Implement XGBoost/LightGBM ensemble
- [ ] Add email domain verification
- [ ] Expand company database with Forbes Global 2000
- [ ] Real-time Glassdoor/LinkedIn API integration
- [ ] User feedback loop for model retraining

---

_Last updated: December 29, 2024_
