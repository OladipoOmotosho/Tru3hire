# TrueHire MVP - 5-Day Sprint Plan

**Start Date:** Dec 21, 2024  
**Target MVP:** Dec 26, 2024

---

## Day 1 (Dec 21): Backend Foundation

### Backend Setup

- [ ] Install dependencies: `python-multipart`, `pypdf`, `pydantic`
- [ ] Create folder structure: `services/`, `schemas/`, `routes/`
- [ ] Create `schemas/analysis.py` with Pydantic models:
  - `AnalysisRequest`, `AnalysisResponse`, `TrueScoreBreakdown`

### POST /analyze Endpoint

- [ ] Create `routes/analyze.py` with endpoint skeleton
- [ ] Accept: `job_text` (required), `resume_file` (optional), `job_url` (optional)
- [ ] Return: Mock response with all 5 scores
- [ ] Add CORS middleware for frontend

**✅ Acceptance:** `curl -X POST /analyze -d "job_text=test"` returns valid JSON

---

## Day 2 (Dec 22): AI/ML Integration

### Fake Job Model

- [ ] Locate existing model in `packages/ai/`
- [ ] Create `services/ml.py` with `FakeJobDetector` class
- [ ] Return probability (0-1), not just label

### Bias Detector

- [ ] Create `services/bias.py` with gendered word dictionary
- [ ] Implement `BiasScorer.analyze(text) -> score`
- [ ] Penalty system: 100 - (violations \* 10)

### Score Aggregator

- [ ] Create `services/scorer.py` with `TrueScoreAggregator`
- [ ] Implement weighted formula:
  - Authenticity: 25%, Hiring: 25%, Match: 25%, Bias: 15%, Reputation: 10%
- [ ] Wire into `/analyze` endpoint

**✅ Acceptance:** `/analyze` returns real authenticity + bias scores, mocked hiring/match/reputation

---

## Day 3 (Dec 23): Frontend - Analyze Page Overhaul

### Resume Upload Component

- [ ] Create `ResumeUploader.tsx` with drag-drop
- [ ] File validation: PDF, DOCX, max 5MB
- [ ] Display uploaded file name + remove button

### Job Input Tabs

- [ ] Create `JobInputForm.tsx` with URL/Text tabs
- [ ] URL tab: input field + "Fetch" button (mock for MVP)
- [ ] Text tab: existing textarea

### Update AnalyzePage

- [ ] Integrate new form components
- [ ] Add "Analyze" button with loading state
- [ ] Navigate to `/results` on success

**✅ Acceptance:** User can upload PDF + paste job text + click Analyze

---

## Day 4 (Dec 24): Frontend - Results Dashboard

### ScoreGauge Component

- [ ] Create `ScoreGauge.tsx` - circular progress for TrueScore
- [ ] Color gradient: red (0-40), yellow (40-70), green (70-100)
- [ ] Animated fill on load

### MetricCard Integration

- [ ] Use existing `MetricCard.tsx` on Results page
- [ ] Create grid layout for 5 metrics
- [ ] Add tooltips explaining each metric

### Insights Section

- [ ] Create `InsightCard.tsx` component
- [ ] Map API insights to card list
- [ ] Icons: ⚠️ warnings, ✅ positives, 💡 tips

### Update ResultsPage

- [ ] Replace current layout with TrueScore Dashboard
- [ ] Show breakdown grid, insights, recommendations
- [ ] Add "Analyze Another" button

**✅ Acceptance:** Results page displays all 5 scores + insights with mock data

---

## Day 5 (Dec 25-26): Integration & Polish

### Connect Frontend → Backend

- [ ] Create `lib/api.ts` with `analyzeJob()` function
- [ ] Update AnalyzePage to call real API
- [ ] Handle loading, success, and error states

### Error Handling

- [ ] Add try/catch in API calls
- [ ] Display user-friendly error messages
- [ ] Add input validation feedback

### Testing & Polish

- [ ] Test full flow: Upload resume + paste job → Results
- [ ] Fix any UI bugs or misalignments
- [ ] Ensure mobile responsiveness
- [ ] Run production build: `yarn build`

**✅ Acceptance:** Complete end-to-end flow works locally

---

## MVP Feature Scope

| Feature               | Status                       | Priority          |
| --------------------- | ---------------------------- | ----------------- |
| Fake job detection    | 🔴 Not started               | P0                |
| Bias detection        | 🔴 Not started               | P0                |
| TrueScore aggregation | 🔴 Not started               | P0                |
| Resume upload         | 🔴 Not started               | P0                |
| Results dashboard     | 🟡 Partial (MetricCard done) | P0                |
| Resume matching       | 🔴 Not started               | P1 (mock for MVP) |
| Company reputation    | 🔴 Not started               | P1 (mock for MVP) |
| Job URL scraping      | 🔴 Not started               | P2 (skip for MVP) |

---

## Quick Start Commands

```bash
# Backend
cd packages/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd packages/frontend
yarn dev
```
