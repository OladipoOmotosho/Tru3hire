# TrueHire (Now SafeHire) Full App: High Level Roadmap

## 1. Overview

Post-MVP, SafeHire (formerly TrueHire) transforms from a tool into a platform. The focus shifts to **retention**, **personalization**, and **community**, with a specific focus on protecting newcomers to Canada from employment scams.

## 2. SafeHire Frontend Revamp (Current Focus)

Refactoring the UI/UX to match the new "SafeHire" identity and newcomer-centric mission.

### A. Core Pages & Navigation

- [ ] **Home Page**: verified updated with Hero, HowItWorks, Testimonials, EducationalResources.
- [ ] **Analyze Page**: verified uses `JobInputForm`.
- [ ] **Results Page**: verified displays Trust Score and Red Flags.
- [ ] **About Page**: verified aligned with SafeHire mission.
- [ ] **Navigation**:
  - [ ] Add "Safety Tips" route.
  - [ ] Add "Report a Scam" route/modal.
  - [ ] Implement Dark Mode toggle in Navbar.

### B. Component Cleanup & Refactoring

- [ ] **Logic Extraction**: Extract `analyzeJobPosting` logic (regex patterns) from `ResultsPage.tsx` and `JobAnalyzer.tsx` into a shared utility (e.g., `src/lib/scamDetection.ts`).
- [ ] **Deprecation**: Remove or refactor `JobAnalyzer.tsx`. It is currently duplicating logic found in `ResultsPage.tsx` and is likely unused in the main flow.
- [ ] **UI Consistency**:
  - [ ] Standardize `Card` styles (borders, shadows, gradients) across all pages.
  - [ ] Ensure "Glassmorphism" effect is used consistently in Hero sections.

### C. New Features (Frontend)

- [ ] **"Report a Scam" Flow**: Create a form for users to submit suspicious job postings for manual review/training data.
- [ ] **Safety Tips Page**: accessible via Footer/Education section, expanding on the quick tips.

## 3. Key Features (Future)

### A. User Accounts & Profiles

- **Authentication**: Login/Signup (Google Auth).
- **Profile**: Store resume, verified skills, and job preferences.
- **History**: Track all analyzed jobs and their scores over time.

### B. "The TrueList" (Community)

- **Crowdsourcing**: Users can flag jobs as "Fake" or "Good".
- **Leaderboard**: "Top Authenticated Employers" vs "Hall of Shame".

### C. Advanced Intelligence

- **Real Data Pipes**: Replace scrapers with official APIs (LinkedIn/Glassdoor Enterprise).
- **Fine-tuned Models**: Train custom BERT models on the gathered dataset of fake vs real jobs.
- **Interview Prep**: Generative AI chat bot to roleplay interviews based on the specific job description.

## 4. Technology Upgrades

- **Database**: PostgreSQL (Supabase) for user data.
- **Caching**: Redis for expensive ML scores.
- **Deployment**: Vercel (Frontend) + Render/Railway (Backend Docker).
