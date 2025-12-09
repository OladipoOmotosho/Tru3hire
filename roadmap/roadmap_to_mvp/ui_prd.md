# TrueHire MVP: Frontend UI PRD

## 1. Overview

The goal is to transition from a simple "Fake Job Detector" text input to a rich "Job Fit & Credibility" dashboard. The UI must verify trust _and_ personal compatibility.

## 2. Page Requirements

### A. Home Page (`/`)

- **Changes**:
  - Update Hero Text: Focus on "TrueScore" (Credibility + Fit).
  - CTA: "Analyze a Job" (Points to `/analyze`).
- **Acceptance Criteria**:
  - Hero clearly explains the 5-metric scoring.
  - Navigation links are correct.

### B. Analyze Page (`/analyze`) - **MAJOR OVERHAUL**

- **Current State**: Simple text input for Job Description.
- **New State**: Split view or multi-step form.
  - **Section 1: The Job**: Input URL (preferred) or Paste Description.
  - **Section 2: The You**: Resume Upload (PDF/DOCX) or "Continue without Resume" (disables Fit scores).
- **Acceptance Criteria**:
  - User can upload a PDF resume.
  - User can paste a Job URL or Text.
  - "Analyze" button is disabled until valid inputs are present.

### C. Results Page (`/results`) - **MAJOR OVERHAUL**

- **Current State**: Simple "Real/Fake" label.
- **New State**: **The TrueScore Dashboard**.
  - **Main Header**: The global "TrueScore" (0-100) with a color-coded gauge (Red/Yellow/Green).
  - **Breakdown Grid**:
    1.  **Authenticity** (Score + Icon)
    2.  **Hiring Likelihood** (Score + Icon)
    3.  **Resume Match** (Score + Icon)
    4.  **Bias & Fairness** (Score + Icon)
    5.  **Reputation** (Score + Icon)
  - **Insights Section**: "Insight Cards" (e.g., "⚠️ Frequent re-posting detected", "✅ Skills match 85%").
  - **Action Plan**: Links to improving score (e.g., "Add 'Python' to resume").
- **Acceptance Criteria**:
  - Displays overall score graphically.
  - Displays all 5 sub-scores clearly.
  - Responsive design (mobile friendly).

## 3. Daily Task List (Frontend)

### Step 1: Layout & Core Components

- [ ] Create `ScoreGauge` component (Visual circle for 0-100).
- [ ] Create `MetricCard` component (Icon, Label, Score, Tooltip).
- [ ] Update Global Layout (Header/Footer branding to TrueHire).
- _Acceptance_: Components render correctly in Storybook or Test Page.

### Step 2: Resume Upload & Input Form

- [ ] Install `react-dropzone` or similar.
- [ ] Build `ResumeUploader` component with file type validation.
- [ ] Build `JobInput` form (URL tab vs Text tab).
- _Acceptance_: User can select a file, state updates with file object.

### Step 3: Results Dashboard (Static)

- [ ] Build the Grid Layout for `/results` using mock data.
- [ ] Implement `InsightCard` list.
- _Acceptance_: Page looks like the design even with fake data.

### Step 4: Integration

- [ ] Connect `/analyze` form submission to Backend API.
- [ ] Handle Loading State (Analyzing animation).
- [ ] Parse API response and populate Results Dashboard.
- _Acceptance_: End-to-end flow works with local backend.
