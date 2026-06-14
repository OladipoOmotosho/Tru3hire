# Requirements Document: 90-Day Hardening & Growth Plan

## Introduction

This specification operationalizes the findings of `documentation/internal/REPO_AUDIT_JUNE_2026.md` into a phased, trackable execution plan. It covers four phases:

**Phase 0 (Week 1):** Production integrity — fix defects that make the deployed product different from the product we believe we ship.
**Phase 1 (Weeks 2–4):** Engineering discipline — CI, dependency pinning, migrations, frontend tests, decomposition.
**Phase 2 (Weeks 2–8):** Data flywheel — verify/complete the outcome feedback loop, ghost-job signals, scam-model retraining.
**Phase 3 (Weeks 4–12):** Revenue & decision instrumentation — affiliate placements, agency pilot readiness, public data note, decision scorecard.

Every requirement has acceptance criteria. **Every task group in `tasks.md` ends with a test task — no task group is "done" until its tests pass.** This is a hard rule for this spec.

## Glossary

- **TrueScore**: Composite 0–100 job opportunity score (`app/services/scorer.py`)
- **Outcome Feedback Loop**: The application-tracking → outcome-reporting → company-stats pipeline specified in `P0_outcome_feedback_spec.md`
- **EMSCAD**: The Kaggle 17,880-posting dataset (2012–2014) the current scam classifier was trained on
- **Ghost Job**: A posting with no intent to hire (repost loops, compliance-only postings)
- **Agency**: An IRCC-funded settlement service provider organization (the B2G2C buyer)
- **Degraded Mode**: Backend running without Gemini access (keyword/TF-IDF fallbacks active)
- **Decision Scorecard**: The metric set used at Day 90 to choose the business lane
- **Migration**: A versioned, ordered, idempotent schema change script tracked in a `schema_migrations` table

---

## Phase 0: Production Integrity (Week 1)

### Requirement 1: Gemini API Key Reaches Production

**User Story:** As a user of the deployed product, I want the AI features (semantic matching, signal extraction) to actually run, so that the product I use matches the product that is advertised.

#### Acceptance Criteria

1. WHEN the Cloud Run service starts, THEN `GEMINI_API_KEY` SHALL be present in the environment (injected via Secret Manager in `cloudbuild.yaml`).
2. WHEN the embedding service initializes with a valid key, THEN it SHALL select the Gemini provider and log the active provider at startup.
3. WHEN `GET /health` is called, THEN the response SHALL include the active embeddings provider (`gemini` | `local` | `keyword-fallback`) so degraded mode is visible, not silent.
4. The stale `OPENAI_API_KEY` secret reference SHALL be removed from `cloudbuild.yaml`.
5. WHEN the key is missing or invalid, THEN the service SHALL still start (graceful degradation preserved) but `/health` SHALL report `degraded`.

### Requirement 2: Rate Limiting Is Enforced

**User Story:** As the operator, I want anonymous and authenticated endpoints rate-limited, so that a hostile loop cannot exhaust LLM/Adzuna quotas or flood the database.

#### Acceptance Criteria

1. `POST /api/analyze` and `POST /api/analyze-url` SHALL enforce a per-IP limit (default: 10/minute) for anonymous callers.
2. `POST /api/discover` and `POST /api/discover/signals` SHALL enforce a per-user limit (default: 20/minute).
3. `POST /report-scam` SHALL enforce a per-IP limit (default: 5/minute).
4. WHEN a limit is exceeded, THEN the API SHALL return HTTP 429 with a `Retry-After` header and a JSON error body.
5. Limits SHALL be configurable via environment variables with sane defaults (no redeploy needed to tune).
6. Rate limit configuration SHALL be documented in one place (`design.md` §4 and code constants module).

### Requirement 3: Health Check Tells the Truth

**User Story:** As the operator, I want `/health` to verify real dependencies, so that deploy gates and uptime monitors catch genuine failures.

#### Acceptance Criteria

1. WHEN `/health` is called, THEN it SHALL execute a real database round-trip (`SELECT 1`) with a short timeout (≤2s).
2. WHEN `/health` is called, THEN it SHALL verify the scam classifier model is loaded (or loadable).
3. WHEN any dependency check fails, THEN the response status SHALL be `degraded` and the failing component named; HTTP status SHALL remain 200 for liveness but a separate `GET /health/ready` SHALL return 503 when not ready (readiness vs. liveness split).
4. Health checks SHALL NOT trigger model training or expensive warmups.

### Requirement 4: Single Deployment Target

**User Story:** As the maintainer, I want exactly one backend deployment path, so that configuration cannot drift between environments.

#### Acceptance Criteria

1. `render.yaml` SHALL be deleted; Cloud Run (via `cloudbuild.yaml`) is the sole backend target.
2. The deployment decision and rollback procedure SHALL be documented in `documentation/public/TechnicalReadMe.md`.
3. `packages/frontend/src/lib/api-url.ts` SHALL only probe `localhost` when `import.meta.env.DEV` is true; production builds SHALL resolve the API URL synchronously with zero probe latency.
4. The production API URL SHALL come from `VITE_API_URL` at build time, with the hardcoded Cloud Run URL as documented fallback only.

### Requirement 5: Repository Hygiene

**User Story:** As a maintainer (and as a future diligence subject), I want the repo free of tracked artifacts and editor junk, so that clones are clean and history stops growing binary blobs.

#### Acceptance Criteria

1. The following SHALL be removed from git tracking and ignored: `.vs/`, `packages/backend/companies.db`, `packages/backend/app/data/*.db`, `packages/backend/debug_search.json`, `packages/backend/test_search.json`, `packages/backend/backend_debug.log`, `build/` (root).
2. Typo files `_init_.py` SHALL be deleted wherever a correct `__init__.py` exists.
3. One-off scripts (`migrate_db.py`, `fix_sequence.py`, `init_db_script.py`) SHALL be moved under `packages/backend/scripts/` with a README note, or deleted if superseded by Requirement 9 migrations.
4. The committed model `fake_job_classifier.joblib` MAY remain tracked for now (deploy simplicity) BUT its provenance (dataset, sklearn version, metrics) SHALL be documented in `app/ml/models/README.md`. Migration to GCS artifact storage is deferred to Requirement 14.

---

## Phase 1: Engineering Discipline (Weeks 2–4)

### Requirement 6: CI Runs the Backend

**User Story:** As a maintainer, I want CI to execute backend tests and lint, so that scoring regressions cannot merge silently.

#### Acceptance Criteria

1. The GitHub Actions workflow SHALL gain a `backend` job: Python 3.11 (matching the Dockerfile), install pinned requirements, run `pytest packages/backend/tests -q`.
2. The backend job SHALL run `ruff check` (lint) and `ruff format --check` (or equivalent) on `packages/backend/app`.
3. CI SHALL fail (red) when any test or lint check fails; both `build` (frontend) and `backend` jobs SHALL be required.
4. CI runtime for the backend job SHALL stay under 5 minutes (use pip caching).
5. Tests requiring live external services (Gemini, Adzuna) SHALL be skipped or mocked in CI via markers — CI SHALL NOT depend on external API keys.

### Requirement 7: Dependencies Are Pinned and Reproducible

**User Story:** As a maintainer, I want builds reproducible across machines and time, so that a transitive upgrade cannot break model deserialization or the frontend silently.

#### Acceptance Criteria

1. Backend SHALL adopt a two-file scheme: `requirements.in` (direct deps, loose) compiled to `requirements.txt` (fully pinned with hashes) via `pip-tools` or `uv`.
2. The sklearn/joblib/numpy/pandas pins SHALL match the versions the committed model was trained with (verified by loading the model in CI).
3. `react-router-dom: "*"` SHALL be replaced with a caret-pinned major version; `yarn.lock` regenerated and committed.
4. The Dockerfile SHALL install from the pinned `requirements.txt` unchanged.
5. A CI step SHALL verify `joblib.load` succeeds on the committed model with the pinned environment (guards against the known sklearn cross-version deserialization failure).

### Requirement 8: Frontend Has a Test Foundation

**User Story:** As a maintainer, I want a frontend test runner with smoke coverage of the money paths, so that refactors (Requirement 10) are safe.

#### Acceptance Criteria

1. Vitest + React Testing Library SHALL be configured in `packages/frontend` with a `test` script wired into CI.
2. Smoke tests SHALL cover: (a) `api-url` resolution logic (DEV probe vs. prod synchronous), (b) `AnalyzePage` renders and validates empty submission, (c) `ResultsPage` renders a mocked analysis response including TrueScore breakdown, (d) `scamDetection.ts` client-side rules.
3. Test suite SHALL run headless in CI in under 3 minutes.
4. A minimum of 15 passing frontend tests SHALL exist at phase exit (quality floor, not a coverage % target).

### Requirement 9: Versioned Database Migrations

**User Story:** As the operator, I want schema changes versioned, ordered, and recorded, so that production schema state is knowable and reversible.

#### Acceptance Criteria

1. A lightweight migration runner SHALL exist: numbered SQL-pair files (`NNN_name.up.sql` / `NNN_name.down.sql`) under `packages/backend/migrations/`, applied in order, recorded in a `schema_migrations` table.
2. The runner SHALL support both PostgreSQL and SQLite dialects (matching the existing dual-path `database.py`) — dialect-specific files allowed (`NNN_name.pg.up.sql`) where syntax diverges.
3. Startup SHALL apply pending migrations (current `init_database` behavior preserved) with advisory locking on Postgres to prevent concurrent-instance races.
4. Migration 001 SHALL capture the *current* production schema as the baseline (no destructive changes).
5. `migrate_db.py` and `fix_sequence.py` logic SHALL be converted into proper migrations or deleted.
6. Rationale note: full Alembic/SQLAlchemy adoption was considered and deferred — see `design.md` §6.

### Requirement 10: Oversized Pages Are Decomposed

**User Story:** As a maintainer, I want the largest pages split into focused components, so that future feature work doesn't compound risk in 800-line files.

#### Acceptance Criteria

1. `ProfilePage.tsx` (834 lines) and `OnboardingPage.tsx` (568 lines) SHALL each be decomposed so no single component file exceeds 300 lines.
2. Decomposition SHALL be behavior-preserving: no route, prop contract, or visual change (verified by smoke tests from Requirement 8 passing before and after).
3. Extracted components SHALL live beside their page (e.g., `pages/profile/` subfolder) following existing folder conventions.

---

## Phase 2: Data Flywheel (Weeks 2–8)

### Requirement 11: Outcome Feedback Loop Verified End-to-End

**User Story:** As the product owner, I want proof the feedback loop (per `P0_outcome_feedback_spec.md`) works in production conditions, so that TrueScore can start learning from reality.

> Note: the P0 spec's acceptance boxes are checked, but the audit found `ApplicationTrackerPage` references and no E2E verification. This requirement is *verification + gap closure*, not a rebuild.

#### Acceptance Criteria

1. An automated API-level E2E test SHALL exercise the full loop against a test database: log application → pending feedback appears after threshold → report outcome → stats reflect it → company stats upserted.
2. Any gap discovered between the P0 spec's checked criteria and actual behavior SHALL be logged as a subtask and fixed.
3. `ApplicationTrackerPage` SHALL contain zero mock/hardcoded application data (grep-verifiable).
4. Duplicate application tracking SHALL be rejected (409) and handled gracefully in the UI.
5. A weekly count of logged applications and reported outcomes SHALL be visible to the operator (simple query or admin endpoint) — this is the flywheel's pulse metric.

### Requirement 12: Company Response Intelligence Surfaced

**User Story:** As a job seeker, I want to see a company's historical response behavior, so that I can avoid application black holes.

#### Acceptance Criteria

1. WHEN viewing job details for a company with ≥3 recorded outcomes, THEN a read-only "Company Response" card SHALL show response rate, interview rate, and average days-to-response.
2. WHEN fewer than 3 outcomes exist, THEN the card SHALL show "Not enough data yet" (no misleading stats from n=1).
3. Company stats SHALL be queryable via the existing `GET /api/applications/companies/{name}/stats` endpoint, cached ≥1 hour.
4. Company name matching SHALL be fuzzy-normalized (reuse `rapidfuzz` normalization already in the codebase) so "Shopify Inc." and "Shopify" aggregate together.

### Requirement 13: Ghost-Job Signals v1

**User Story:** As a job seeker, I want stale and reposted listings flagged, so that I stop wasting applications on jobs that won't be filled.

#### Acceptance Criteria

1. WHEN a job is <48 hours old, THEN results SHALL display an "Apply Early" badge (the recency advantage is the single highest-leverage timing signal per `PRODUCT_AUDIT.md`).
2. WHEN the same normalized (title + company) pair reappears with a new posting date within 60 days, THEN the job SHALL carry a "Reposted" flag and a TrueScore hiring-activity penalty.
3. Repost detection SHALL be backed by a posting-fingerprint table (hash of normalized title+company+location) populated during search ingestion.
4. The TrueScore recency component SHALL use a decay curve (not linear) with the 48-hour cliff documented in `design.md` §8; existing TrueScore contract tests SHALL be updated alongside (weights change = contract change, done deliberately).
5. False-positive guard: legitimate multi-location postings (same title+company, different city) SHALL NOT be flagged as reposts.

### Requirement 14: Scam Model Retraining Pipeline

**User Story:** As the product owner, I want the classifier retrainable on modern scam data with versioned, comparable evaluations, so that detection covers post-2020 scam classes (task scams, crypto-payout scams).

#### Acceptance Criteria

1. A reproducible training pipeline (`app/ml/train_model.py` evolution) SHALL accept multiple labeled sources: EMSCAD + a curated modern set (exported `/report-scam` submissions + manually labeled modern examples).
2. Every trained model SHALL embed metadata: dataset versions/counts, sklearn version, train date, and a fixed evaluation report (accuracy, precision/recall/F1 on fake class) on a **frozen holdout that includes modern scam examples**.
3. A new model SHALL only replace the committed one when it improves F1 on the modern holdout without degrading EMSCAD F1 by more than 2 points (documented promotion rule).
4. Model artifacts SHALL move to GCS (or equivalent) with the deployed version referenced by config; the repo keeps only the currently-promoted model (interim state) or a pointer (end state).
5. The labeling workflow for scam-report submissions SHALL be documented (even if it's "founder labels 50/week in a spreadsheet" — honesty over aspiration).
6. Rule-layer patterns for task scams (pay-to-work, gamified tasks, crypto payouts, off-platform messaging push) SHALL be added to `authenticity.py` regardless of model retrain timing — rules ship faster than models.

---

## Phase 3: Revenue & Decision Instrumentation (Weeks 4–12)

### Requirement 15: Credential-Pathway Affiliate Placements

**User Story:** As the operator, I want tasteful, disclosed referral placements at natural decision points, so that the product generates cashflow without degrading trust.

#### Acceptance Criteria

1. WHEN a credential pathway indicates an ECA is needed, THEN the UI SHALL present a "Get your credentials evaluated" card linking to the evaluation provider (WES et al.) with a tracked outbound link.
2. All affiliate/referral links SHALL carry a visible disclosure ("We may earn a referral fee") — non-negotiable for a trust product.
3. Outbound clicks SHALL be counted (event: `affiliate_click` with placement ID) — measurable revenue funnel from day one.
4. Placements SHALL be config-driven (JSON/DB table), so adding a partner requires no deploy.
5. NO affiliate content SHALL appear inside scam-analysis results (the safety surface stays commercially clean).

### Requirement 16: Agency Pilot Readiness

**User Story:** As the founder selling to settlement agencies, I want a demonstrable pilot package, so that discovery conversations can convert to pilots without custom engineering per agency.

#### Acceptance Criteria

1. A seeded demo environment (demo account + representative data: applications, outcomes, credential pathways) SHALL exist and be resettable with one script.
2. A one-page exportable "impact summary" (users served, scam checks run, applications tracked, response rates) SHALL be generatable from real aggregates — agencies report to funders; give them the numbers they need.
3. Anonymous-aggregate analytics events SHALL be recorded for: scam checks, job searches, applications tracked, outcomes reported (no PII beyond existing user records; counts only).
4. A pilot-readiness checklist (onboarding steps, support contact, data/privacy answers agencies will ask) SHALL exist in `documentation/internal/agency_pilot_checklist.md`.

### Requirement 17: "Job Scams in Canada" Data Note

**User Story:** As the founder, I want a small published data report from our scam-report corpus, so that the product earns distribution through media/policy attention instead of ad spend.

#### Acceptance Criteria

1. An aggregate-stats export (counts by scam type, red-flag frequency, time trends — k-anonymized, no reporter PII, no individual report excerpts) SHALL be producible by script.
2. The note SHALL cite external anchors (FTC, CAFC) alongside internal data and SHALL state sample-size limitations plainly.
3. Legal/privacy review checklist completed before publication (aggregates only; consent language in report-scam flow verified to permit aggregate publication).

### Requirement 18: Day-90 Decision Scorecard

**User Story:** As the founder, I want pre-committed metrics and thresholds, so that the Day-90 lane decision (B2G2C Employment OS vs. consumer ghost-job filter) is made on evidence, not mood.

#### Acceptance Criteria

1. The scorecard SHALL track, weekly: WAU, scam checks run, applications tracked, outcomes reported, affiliate clicks, agency conversations held / pilots agreed.
2. Decision thresholds SHALL be written down *before* the data arrives (e.g., "≥2 agencies agree to pilot → B2G2C lane"); thresholds live in `documentation/internal/decision_scorecard.md`.
3. The scorecard SHALL be reviewable in ≤10 minutes from a single query/script output — if measuring takes an hour, it won't happen weekly.

---

## Non-Functional Requirements (apply to all phases)

### NFR-1: Testing Discipline
Every task group ends with a test task. A task group without passing tests is not complete. New backend code: pytest. New frontend code: Vitest/RTL. Bug fixes: regression test reproducing the bug first.

### NFR-2: No Silent Degradation
Any fallback path (Gemini → local → keyword; Postgres → SQLite) must be observable via logs and `/health`. New fallbacks require the same.

### NFR-3: Privacy
Analytics are aggregate counts. Scam-report publication is k-anonymized. No new PII collection without explicit consent UI.

### NFR-4: Solo-Founder Budget
Recurring infrastructure additions must each be justified; default to free tiers and existing GCP services. No new SaaS subscriptions without a line-item decision.

### NFR-5: Tech Stack Stability
The stack (Python/FastAPI + React/TypeScript) is **confirmed, not provisional** — see `design.md` §2 for the decision record and the specific triggers that would reopen it. No rewrites within this 90-day window.
