# TrueHire (Saf3Hire)

> **Turning Job Hunting from a Guessing Game into a Science.**

TrueHire is an AI-powered platform that rates job postings by **credibility**, **diversity**, and **personal fit**. Instead of just "finding jobs," TrueHire acts as your personal screener, evaluating real-time listings against your resume to give you a **TrueScore (0-100)**—telling you not just if a job is real, but if it's worth your time.

---

## 🚀 The Vision

Traditional job boards prioritize volume. TrueHire prioritizes **alignment**.

We evaluate jobs across 5 key dimensions:

1.  **Authenticity (25%)**: Is this job legitimate? (Fake job detection)
2.  **Hiring Likelihood (25%)**: Are they actually hiring right now? (Recency, engagement)
3.  **Resume Match (25%)**: Does your resume actually fit the description?
4.  **Bias & Fairness (15%)**: Is the workplace inclusive? (Language analysis)
5.  **Company Reputation (10%)**: What do employees actually say? (Sentiment analysis)

## ✨ Key Features

- **The TrueScore Engine**: A weighted scoring system normalized to 0-100.
- **Intelligence Layer**: "Insight Cards" summarizing company red flags or green flags from across the web.
- **Skill-Gap Engine**: Auto-suggests specific certifications (Coursera/LinkedIn) to close the gap between your resume and your dream job.
- **Trust Transparency**: Tags like "Verified Employer", "Fresh Posting", "Diversity Friendly".

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Backend**: Python, FastAPI.
- **AI/ML**:
  - Fake Job Detection (Scikit-learn/XGBoost)
  - Resume Matching (BERT/SentenceTransformers)
  - Sentiment Analysis (DistilBERT)

---

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js v18+ & Yarn
- Python 3.10+

### Installation & Run

1.  **Install Dependencies**

    ```bash
    yarn install
    ```

2.  **Setup Backend**

    ```bash
    cd packages/backend
    python -m venv .venv
    # Windows:
    .\.venv\Scripts\Activate
    # Mac/Linux:
    source .venv/bin/activate

    pip install -r requirements.txt
    ```

3.  **Run Development Servers**
    ```bash
    # From root
    yarn dev
    ```

---

## 🤝 Contribution

Please verify `.agent/coding_standards.md` before contributing.
