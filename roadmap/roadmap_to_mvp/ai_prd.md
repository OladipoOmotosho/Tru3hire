# TrueHire MVP: AI & ML PRD

## 1. Overview

The AI layer provides the raw intelligence for the TrueScore. We need 5 distinct signals. For the MVP, we will use a mix of Heuristics (Rule-based) and simple ML models to ensure speed and reliability.

## 2. Models & Logic

### A. Authenticity (Fake Job Model)

- **Type**: ML Classifier (Logistic Regression / Random Forest).
- **Status**: Existing (needs integration).
- **Logic**: Text -> TF-IDF -> Model -> Probability(Real).

### B. Hiring Likelihood (Recency/Activity)

- **Type**: Heuristic.
- **Logic**:
  - If URL provided: Check meta-data date.
  - If "Urgent" or "Immediate" in text: Score boost.
  - MVP: Random variations based on keyword triggers ("hiring now", "start today").

### C. Resume Match (Semantic Similarity)

- **Type**: NLP (Embeddings).
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (Fast & Light).
- **Logic**:
  - Embedding(Resume) • Embedding(Job) = Cosine Similarity (0-1).

### D. Bias & Fairness

- **Type**: Keyword/Dictionary Analysis.
- **Logic**: Count "Gendered Words" (e.g., "Ninja", "Dominant", "Nurturing").
- **Score**: 100 - (ViolationCount \* Penalty).

### E. Reputation

- **Type**: Sentiment Analysis (mocked for MVP).
- **Logic**: For MVP, if Company Name is detected, look up against a hardcoded "Bad List" or return Neutral.

## 3. Daily Task List (AI)

### Step 1: Resume Matcher (The new core)

- [ ] Install `sentence-transformers`.
- [ ] Create `SimilarityScorer` class.
- [ ] Implement `get_similarity(text1, text2)` -> float.
- _Acceptance_: "Software Engineer" resume matches "Software Developer" job > 0.8.

### Step 2: Bias & Fairness Detector

- [ ] Create a dictionary of gender-coded/biased terms (research based).
- [ ] Implement `BiasScorer` class.
- _Acceptance_: Job with "Rockstar Ninja" returns lower fairness score than "Software Developer".

### Step 3: Model Integration

- [ ] update `fake_job_model` to return a probability score (0-1), not just a label.
- [ ] Wrap all 3 models (Fake, Match, Bias) into the Backend Service.
- _Acceptance_: All models run within <3 seconds total inference time.
