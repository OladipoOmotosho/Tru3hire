# SafeHire: AI-Powered Fake Job Detection for Newcomers

# doc still ongoing and subjected to changes

Short tagline: Help newcomers spot fake job postings quickly and confidently.

---

## Overview (Non-technical)

Every year many newcomers to Canada encounter fraudulent job postings that promise quick employment, unrealistic pay, or visa sponsorship. These scams cause financial loss, identity theft, and stress.

SafeHire is a simple, web-first tool that helps people quickly check whether a job posting looks legitimate. Users paste job text (or upload a screenshot/link) and receive an easy-to-understand Trust Score (Safe / Suspicious / High-Risk) along with plain-language explanations of the red flags found.

The product is deliberately non-technical on the front end, designed for judges, mentors, community workers, and users with limited technical background.

---

## Problem Statement

Newcomers face:

- Pressure to find work fast
- Little familiarity with local hiring norms
- Higher risk of falling for scams

Scammers exploit these vulnerabilities with fake posts that can extract money or personal data. SafeHire aims to reduce this harm by giving fast, reliable guidance on posting authenticity.

---

## Target Users

- International students and recent graduates
- Skilled newcomers searching for employment or sponsorship
- Community and settlement organizations assisting newcomers

---

## What the MVP Does (Simple)

1. Accepts job text, screenshot, or link.
2. Analyzes content for common scam signals (language patterns, contact info, payment requests).
3. Returns a Trust Score and friendly explanations.
4. Lets users report confirmed scams to help improve the system.

---

## How It Works (High-level, Non-technical)

SafeHire combines two approaches:

- AI pattern detection trained on examples of real and fake job posts.
- Rule-based checks for clear red flags (personal email domains, requests for payment, unrealistic salary claims).

Together they produce a Trust Score plus a short list of reasons the item was flagged. The system is advisory — it helps users make safer choices, not legally binding judgments.

Privacy-first: The MVP does not retain personal user submissions by default.

---

## MVP Goals

- Functional web prototype that analyzes pasted job text.
- A labeled dataset of legitimate and fake postings (small, curated).
- Clear, friendly UI for non-technical users.
- Basic accuracy reporting to show the model flags obvious scams reliably.

---

## Implementation Roadmap (4-week MVP)

Phase 1 — Research & Design (Week 1)

- Collect sample posts and define label rules.
- Design user flows and wireframes.

Phase 2 — Build Prototype (Weeks 2–3)

- Frontend: Simple submission UI and Trust Score display.
- Backend/AI: Lightweight analyzer (proof-of-concept model + rule engine).
- Integration: Connect frontend to the analyzer and show results.

Phase 3 — Test & Iterate (Week 4)

- Usability tests with newcomers and community workers.
- Evaluate model behavior and collect labeled edge cases.
- Final demo and metrics collection.

---

## Example User Scenario

Aisha, a new arrival, sees a suspicious “$5,000/month remote data entry — no experience needed” post on social media. She pastes it into SafeHire, receives a “High-Risk” score, and sees flagged phrases like “no experience” and “payment before training.” She avoids the scam and learns what to watch for.

---

## Expected Outcomes & Impact

Short-term:

- Fewer people fall for fake listings.
- Increased awareness of safe hiring practices.

Long-term:

- Integration with job boards or newcomer services.
- Browser extension for on-the-fly checks.
- Multilingual support and community reporting.

---

## Team Roles (Suggested)

- Project Lead / Product Designer — user research, design, documentation.
- Frontend Developer — React + TypeScript UI and accessibility.
- Backend / AI Developer — analysis engine, model training, data pipeline.

All members contribute to labeling, testing, and public presentations.

---

## Ethics & Privacy

- Do not store private user data by default in the MVP.
- Results are advisory; users should verify before sharing sensitive data.
- Code and models remain auditable and transparent.

---

## Quick Technical Appendix (for reviewers / devs)

How to run locally:

You can use either npm or Yarn; examples for both are shown below.

1. Install dependencies:
   - npm: `npm install`
   - yarn (classic): `yarn install`
2. Start the dev server:
   - npm: `npm run dev`
   - yarn: `yarn dev`
3. Build for production:
   - npm: `npm run build`
   - yarn: `yarn build`

Files to review:

- Project entry: [`index.html`](index.html)
- Dev / build config: [`vite.config.ts`](vite.config.ts)
- NPM scripts and deps: [`package.json`](package.json)
- App root component: [`App`](src/App.tsx)
- App bootstrap: [`main.tsx`](src/main.tsx)
- Styling: [`src/index.css`](src/index.css), [`styles/globals.css`](styles/globals.css)
- Key UI components:
  - [`src/components/JobAnalyzer.tsx`](src/components/JobAnalyzer.tsx)
  - [`src/components/TrustScoreDisplay.tsx`](src/components/TrustScoreDisplay.tsx)
  - [`src/components/RedFlagsList.tsx`](src/components/RedFlagsList.tsx)
  - [`src/components/Header.tsx`](src/components/Header.tsx)
  - [`src/components/Footer.tsx`](src/components/Footer.tsx)
  - [`src/components/Hero.tsx`](src/components/Hero.tsx)
  - [`src/components/HowItWorks.tsx`](src/components/HowItWorks.tsx)
  - [`src/components/EducationalResources.tsx`](src/components/EducationalResources.tsx)
  - [`src/components/Testimonials.tsx`](src/components/Testimonials.tsx)
  - Figma helper: [`src/components/figma/ImageWithFallback.tsx`](src/components/figma/ImageWithFallback.tsx)
- Attribution and guidelines:
  - [`src/Attributions.md`](src/Attributions.md)
  - [`guidelines/Guidelines.md`](guidelines/Guidelines.md)

Notes:

- See [`package.json`](package.json) for scripts (`dev`, `build`) and dependencies.
- The frontend is a React + TypeScript app; the base template files are [`src/main.tsx`](src/main.tsx) and [`App`](src/App.tsx).
- For adding model/backend work, create a lightweight API (e.g., FastAPI or Node) and connect it to the JobAnalyzer component.

---

## DEV: Developer setup & troubleshooting

This section is for engineers who want to run, develop, or troubleshoot the project locally. It's intentionally concrete — copy/paste commands and quick fixes are included.

### Dev sections

#### Prerequisites

- Node.js (recommended LTS). Tested with Node 18+. Use nvm (Node Version Manager) if you need to switch versions.
- npm (bundled with Node) or Yarn (classic/v1 or Berry/v2). This repo uses standard npm scripts; either package manager is fine. If using Yarn v1, be aware of differences in lockfile handling.
- Git and a code editor (VS Code recommended).

#### Install (one-time)

Open a terminal in the project root and run one of the following:

```powershell
# using npm
npm install

# or using yarn (classic)
yarn install
```

If you see errors about the package name ("Name contains illegal characters") make sure `package.json` has a valid name (lowercase, no spaces). Example: `SafeHire-design-development`.

#### Run the app locally

```powershell
# start dev server (hot reload)
npm run dev

# build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) (default Vite port) in your browser unless the terminal shows a different URL.

#### Common environment variables

This frontend is designed to call a backend/analyzer in a later phase. Use a `.env` or `.env.local` file for local overrides. Example env variables the app may read (prefix with `VITE_` for Vite):

- VITE_API_URL=[http://localhost:8000/api](http://localhost:8000/api)
- VITE_ANALYTICS_DISABLED=true

Create a `.env.local` in the project root with any values you need. Do NOT commit secrets.

#### Suggested VS Code settings (optional)

Add a `.vscode/settings.json` with recommended editor settings such as format on save, TypeScript version, and eslint integration.

### Troubleshooting — possible bugs and quick fixes

1. "Name contains illegal characters" during `yarn install` or `npm install`

   - Cause: `package.json` name includes spaces or uppercase. Fix: open `package.json` and set a valid name, e.g. `"name": "SafeHire-design-development"`.

2. Dependency install fails or strange resolution errors
   - Fixes to try:
     - Delete `node_modules` and the lockfile (`package-lock.json` or `yarn.lock`), then reinstall:

```powershell
rm -r node_modules; rm package-lock.json; npm install
```

     - If using Yarn classic, run `yarn install --check-files` or remove `node_modules` then `yarn install`.

3. Vite dev server starts but page shows blank or React errors

- Check the browser console for the runtime error.
- Common cause: mismatched React/ReactDOM versions or incorrect import paths. Ensure `react` and `react-dom` versions in `package.json` are compatible.

4. TypeScript type errors preventing the build
   - Run a local typecheck to see errors:

```powershell
npx tsc --noEmit
```

- Fix or narrow the offending types; sometimes adding small `any` casts for 3rd-party libs is an acceptable short-term workaround.

5. CSS/Tailwind styles not applied - Ensure global CSS files are imported in `main.tsx` and that Tailwind is configured (postcss/tailwind config) if used. - Restart the dev server after changing PostCSS/Tailwind config.

6. HMR (hot module reload) not updating - Try restarting the dev server. - Clear browser cache or open the app in an incognito window.

7. CORS or API 401/403 when calling a local backend - Ensure the backend allows requests from the dev origin ([http://localhost:5173](http://localhost:5173)) or proxy requests via Vite config during development.

8. Fast refresh / React error about hooks - Ensure you are not conditionally calling hooks and that React is a single instance (no duplicate copies in `node_modules`). `npm ls react` can help detect duplicates.

If a problem persists, capture the terminal output and browser console logs and open an issue with that information.

### Developer workflow & recommended scripts

- `npm run dev` — start Vite dev server with hot reload
- `npm run build` — produce a production build in `dist/`

Branching & PRs:

- Create feature branches from `main`, include a short description in the PR, and reference issues.
- Keep commits focused and write concise PR descriptions so non-dev reviewers (judges/mentors) can follow.

### Tests and CI

This repository currently does not include automated tests. Recommended next steps:

- Add unit tests for critical UI components (React Testing Library + Vitest/Jest).
- Add a simple CI workflow (GitHub Actions) that runs `npm ci`, `npm run build`, and optional tests.

### Quick checklist for a healthy dev environment

- Node LTS installed (match project requirements)
- Dependencies installed (`npm install` or `yarn install`)
- Dev server runs: `npm run dev` and app loads in browser
- Lint/typecheck pass (if added)

---

If you'd like, I can also:

- Add an example `.env.example` to the repo that lists common VITE\_\* variables.
- Create a `CONTRIBUTING.md` with PR and branch rules.
- Add a basic GitHub Actions workflow to run build and tests on PRs.

## Contribution & Contact

If you'd like to contribute:

- File issues for bugs or UX concerns.
- Add labeled examples (legit / fake) to improve the model.
- Propose UX copy improvements for newcomer clarity.

License: Open for the competition — include licensing notes here as needed.

---

## One-line Summary

SafeHire: a privacy-conscious, easy-to-use web tool that gives newcomers a quick, plain-language assessment of whether a job posting is likely safe or potentially fraudulent.
