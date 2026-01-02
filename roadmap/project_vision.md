# TrueHire - Project Vision & Scope

> **AI-Powered Job Safety Platform for Newcomers to Canada**  
> Competition: Build a Bridge (Canada) | Timeline: 5 Days

---

## 🎯 Problem Statement

Every year, thousands of newcomers to Canada fall victim to:

- **Fraudulent job postings** (scams, identity theft)
- **Wasted applications** on jobs that aren't actively hiring
- **Mismatched opportunities** that don't fit their skills
- **Lack of insider knowledge** about companies/recruiters

**TrueHire solves this** by using AI/ML to analyze and rank job postings, giving users a **TrueScore™** that predicts their likelihood of getting an interview.

---

## 🏗️ Core Features

### 1. 🔍 Job Discovery (Phase 2)

- Scrape/aggregate jobs from public APIs (Adzuna, RemoteOK, Indeed RSS)
- Filter by location, role, experience level, remote/onsite
- For MVP: "Paste job posting" analysis (already built)

### 2. 🤖 AI-Powered Fake Job Detection (PRIORITY)

| Current        | Needed                                   |
| -------------- | ---------------------------------------- |
| Regex patterns | **ML Classifier (scikit-learn/PyTorch)** |
| Rule-based     | **Trained on Kaggle fake job dataset**   |

**Kaggle Dataset**: [Real or Fake Job Posting Prediction](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction)

### 3. 📊 TrueScore™ Metrics (5 Dimensions)

| Metric                 | Weight | How We Calculate                               |
| ---------------------- | ------ | ---------------------------------------------- |
| **Authenticity**       | 30%    | ML classifier + scam pattern detection         |
| **Hiring Likelihood**  | 25%    | Job quality signals (detail, recency, clarity) |
| **Resume Match**       | 20%    | NLP similarity between resume & job            |
| **Company Reputation** | 15%    | Reddit/Glassdoor sentiment analysis            |
| **Recency**            | 10%    | Days since posted, fresher = better            |

**Final Score = Weighted sum → Probability of Interview**

### 4. 📝 Resume Analysis

- Upload PDF resume (already built with pdfplumber)
- Extract skills automatically
- Calculate match % against job requirements
- Suggest missing skills to upskill

### 5. 🏢 Company Reputation Lookup

- Search Reddit for discussions about the company
- Scrape Glassdoor ratings (if accessible)
- Show positive/negative sentiment summary
- Flag: "No reviews found" as a warning sign

### 6. 📚 Skill Gap & Upskilling (Phase 2)

- Identify skills frequently required in target jobs
- Highlight skills user is missing
- Suggest learning resources (Coursera, Udemy, freeCodeCamp)

### 7. 💬 Community Insights

- Link to relevant Reddit/Blind discussions
- Show what others say about:
  - The company culture
  - Interview process
  - Salary expectations

---

## 🏆 Competition Angle: Build a Bridge

**Why TrueHire fits:**

- Protects newcomers from employment scams
- Reduces friction in job search
- Helps build confidence through transparency
- Uses AI for genuine social impact

**Unique differentiators:**

1. **TrueScore™** - Single metric combining 5 analysis dimensions
2. **Local ML** - No external API costs, runs on-device
3. **Community-powered** - Integrates real discussions from Reddit

---

## ⏱️ 5-Day Sprint Plan

### Day 1: ML Model Training

- [ ] Download Kaggle fake job dataset
- [ ] Preprocess text (clean, tokenize)
- [ ] Train classifier (TF-IDF + RandomForest or LogisticRegression)
- [ ] Evaluate accuracy (target: 90%+)
- [ ] Export model for inference

### Day 2: Backend Integration

- [ ] Replace regex-based authenticity scorer with ML model
- [ ] Create `/api/predict-fake` endpoint
- [ ] Integrate ML prediction into TrueScore calculation
- [ ] Add confidence score to response

### Day 3: Reputation & Recency

- [ ] Add Reddit API integration (search by company name)
- [ ] Create sentiment analysis (simple positive/negative)
- [ ] Add recency scoring to TrueScore
- [ ] Update frontend to display reputation data

### Day 4: Resume Matching Improvements

- [ ] Use TF-IDF or BERT embeddings for resume-job similarity
- [ ] Extract skills from resume using NLP
- [ ] Show skill match breakdown in UI
- [ ] Add "missing skills" suggestions

### Day 5: Polish & Deploy

- [ ] UI/UX refinements
- [ ] Error handling & edge cases
- [ ] Deploy updated backend to Render
- [ ] Deploy frontend to Netlify
- [ ] Record demo video
- [ ] Write competition submission

---

## 🛠️ Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| **Frontend**    | React + TypeScript + Tailwind         |
| **Backend**     | FastAPI + Python                      |
| **ML Model**    | scikit-learn (TF-IDF + Classifier)    |
| **Database**    | SQLite (MVP)                          |
| **PDF Parsing** | pdfplumber                            |
| **Deployment**  | Render (backend) + Netlify (frontend) |
| **Auth**        | Clerk                                 |

---

## 📊 ML Model Details

**Dataset**: Kaggle Fake Job Posting (17,880 samples)

- ~800 fake jobs, ~17,000 real jobs (imbalanced)
- Features: title, location, department, company_profile, description, requirements

**Approach**:

```
Text → TF-IDF Vectorizer → RandomForest/XGBoost → Fake/Real + Confidence
```

**Target Metrics**:

- Accuracy: 95%+
- Precision (Fake): 85%+ (avoid false positives)
- Recall (Fake): 90%+ (catch most fakes)

---

## 🚀 MVP vs Full Vision

| Feature            | MVP (5 days)     | Full Vision         |
| ------------------ | ---------------- | ------------------- |
| Fake Job ML        | ✅               | ✅ Enhanced         |
| Resume Match       | ✅ Basic         | Semantic similarity |
| Company Reputation | ✅ Reddit search | + Glassdoor API     |
| Job Scraping       | ❌ Paste only    | ✅ Aggregated feeds |
| Skill Gap          | ❌ Coming Soon   | ✅ Full analysis    |
| Learning Resources | ❌               | ✅ Curated links    |
| Browser Extension  | ❌               | ✅ Future           |

---

## 📝 Success Criteria

1. ✅ ML model with 90%+ accuracy on fake job detection
2. ✅ TrueScore calculation using real ML predictions
3. ✅ Resume upload and skill extraction working
4. ✅ Company reputation shown from Reddit
5. ✅ Clean, accessible UI for newcomers
6. ✅ Deployed and demo-ready

---

## 📂 Repository Structure

```
├── packages/
│   ├── frontend/          # React + TypeScript
│   └── backend/           # FastAPI + Python
│       ├── app/
│       │   ├── ml/        # ML models & training
│       │   ├── services/  # Business logic
│       │   └── routes/    # API endpoints
│       └── models/        # Trained model files
├── data/                  # Kaggle dataset
├── notebooks/             # Jupyter notebooks for ML experiments
└── roadmap/               # Project documentation
```

---

_Last Updated: December 27, 2024_
