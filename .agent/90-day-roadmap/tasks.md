# Implementation Plan: 90-Day Hardening & Growth

## Overview

Execution plan for `requirements.md`, designed per `design.md`. Four phases; tasks ordered by dependency. **Every task group ends with a test task and no group is complete until its tests pass** (NFR-1). Checkpoints are hard gates — do not start the next phase's coding tasks until the checkpoint is green.

**Objective summaries** (the "why" of each group) are italicized under each top-level task.

---

## Phase 0: Production Integrity (Week 1)

- [ ] 1. Restore Gemini in production
  _Objective: the deployed product's AI features actually run; degraded mode becomes visible instead of silent. (Req 1)_
  - [ ] 1.1 ⏳ **MANUAL (operator):** Create `GEMINI_API_KEY` secret in GCP Secret Manager; grant Cloud Run service account access (runbook documented in TechnicalReadMe — task 4.1)
  - [x] 1.2 Update `cloudbuild.yaml` `--set-secrets`: add `GEMINI_API_KEY`, remove `OPENAI_API_KEY`
    - _Requirements: 1.1, 1.4_
  - [x] 1.3 Add provider-status accessor (`health.get_embeddings_status()` wrapping `embeddings.get_embedding_status()`); log active provider at startup in `main.py` lifespan
    - _Requirements: 1.2_
  - [x] 1.4 Expose embeddings provider + degraded flag in `/health` response
    - _Requirements: 1.3, 1.5_
  - [x] 1.5 **Tests:** ✅ automated tests pass (provider selection with/without key; `/health` reports provider; service starts with no key). ⏳ Post-deploy `/health` shows `gemini` — pending 1.1 + deploy
    - _Validates: Req 1 all ACs; Property P3_

- [x] 2. Enforce rate limits
  _Objective: anonymous traffic can no longer exhaust LLM/Adzuna quotas or flood the reports table. (Req 2)_
  - [x] 2.1 Create `app/config/rate_limits.py` with env-tunable limits and key funcs (XFF-aware IP key; bearer-token-hash key for authed routes)
    - _Requirements: 2.5, 2.6_
  - [x] 2.2 Apply `@limiter.limit` to `/api/analyze`, `/api/analyze-url` (per-IP)
    - _Requirements: 2.1_
  - [x] 2.3 Apply limits to `/api/discover`, `/api/discover/signals` (per-user)
    - _Requirements: 2.2_
  - [x] 2.4 Apply limit to `/report-scam` (per-IP)
    - _Requirements: 2.3_
  - [x] 2.5 **Tests:** ✅ 7 tests pass — N under limit OK, N+1 → 429 with `Retry-After`; bucket isolation by forwarded IP; per-user key prefers bearer token; limits read from env
    - _Validates: Req 2 all ACs; Property P2_

- [x] 3. Honest health & readiness
  _Objective: deploy gates and monitors catch real failures; liveness/readiness split per Cloud Run best practice. (Req 3)_
  - [x] 3.1 Implement real DB check (`SELECT 1`, 2s timeout, threadpool) and model-loaded check in `app/services/health.py`
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 3.2 Add `GET /health/ready` (503 on failure, names failing component); keep `/health` as liveness with `degraded` status field
    - _Requirements: 3.3_
  - [x] 3.3 Point Cloud Run probe at `/health/ready` (documented `gcloud run services update` command in `cloudbuild.yaml`)
  - [x] 3.4 **Tests:** ✅ 7 tests pass — ready 200 when deps ok; 503 naming component when DB mocked down / model missing; health never trains
    - _Validates: Req 3 all ACs; Property P1_

- [x] 4. Single deploy target + frontend URL resolution
  _Objective: one source of deployment truth; production visitors stop paying a 2s localhost-probe tax. (Req 4)_
  - [x] 4.1 Delete `render.yaml`; document Cloud Run as sole target + GEMINI_API_KEY secret setup + rollback procedure in TechnicalReadMe ("Deployment" section)
    - _Requirements: 4.1, 4.2_
  - [x] 4.2 Rework `api-url.ts`: probe only when `import.meta.env.DEV`; prod resolves synchronously from `VITE_API_URL` with documented fallback
    - _Requirements: 4.3, 4.4_
  - [x] 4.3 **Tests:** ✅ Vitest configured (`vitest.config.ts`, `src/test/setup.ts`); 10 `api-url.test.ts` tests pass — DEV probe path, prod synchronous path (no fetch), env override precedence, caching, reset
    - _Validates: Req 4.3, 4.4_

- [x] 5. Repository hygiene
  _Objective: clean clones, no binary growth in history, model provenance documented. (Req 5)_
  - [x] 5.1 `git rm --cached` junk (`.vs/`, 3 `.db` files, 2 debug json); extended `.gitignore` (`.vs/`, `*.db`/`*.sqlite*`, debug dumps). `build/` + `*.log` already ignored. Verified `companies.db`/`truehire.db` regenerate from runtime seed code before untracking.
    - _Requirements: 5.1_
  - [x] 5.2 Delete `_init_.py` typo files (app/, tests/) — confirmed empty; `app/__init__.py` already present; tests/ runs rootless so no behavior change
    - _Requirements: 5.2_
  - [x] 5.3 Relocate `migrate_db.py`, `fix_sequence.py`, `init_db_script.py` → `scripts/` with `scripts/README.md` (documents `python -m scripts.<name>` + Phase 1 migration supersession)
    - _Requirements: 5.3_
  - [x] 5.4 Write `app/ml/models/README.md` — EMSCAD 2012–2014, RF pipeline v1.0.0, **real metrics (96.8% acc / 68.5% fake-F1, below 85% target)**, loads under sklearn 1.8.0, staleness caveat → Phase 2 retrain
    - _Requirements: 5.4_
  - [x] 5.5 **Verification:** ✅ `git ls-files` shows zero `.db`/`.sqlite`/`.log`/`.vs`/`_init_` artifacts; scripts relocated; backend suite re-run after moves (Checkpoint 0)
    - _Validates: Req 5 all ACs_

- [ ] 6. ✅ CHECKPOINT 0 — Production truth
  - [x] All Phase 0 tests green locally: backend **116 passed, 5 skipped** (skips = Task 12 DB-isolation, documented); frontend **10 vitest pass**; `tsc` typecheck clean; production build clean
  - [x] Clean-index test: `git ls-files` shows zero `.db`/`.sqlite`/`.log`/`.vs`/`_init_` artifacts
  - [x] 429 enforcement verified locally (7 rate-limit tests); `/health` real-check + `/health/ready` verified locally (7 tests)
  - [ ] ⏳ **Pending deploy (needs operator task 1.1):** deployed `/health` shows `gemini` provider + `database: ok`; 429s observable in prod logs under synthetic burst
  - ⚠️ **Flagged to operator:** local `.env` `DATABASE_URL` points to a dead Supabase instance (`tenant/user ... not found`) — see summary

---

## Phase 1: Engineering Discipline (Weeks 2–4)

- [x] 7. Backend CI + dependency pinning — **PR #5 MERGED**
  _Objective: regressions cannot merge silently; builds are reproducible; the committed model provably loads under pinned deps. (Req 6, 7)_
  - [x] 7.1 Verified the committed model deserializes under scikit-learn 1.8.0 (load-tested); pinned to that
    - _Requirements: 7.2_
  - [x] 7.2 `requirements.in` (loose source) + pinned `requirements.txt` (direct deps `==`); Dockerfile unchanged. CI model-load gate verifies on 3.11.
    - _Requirements: 7.1, 7.4_
  - [x] 7.3 `react-router-dom` `*` → `^7.9.4`; lockfile regenerated (`--frozen-lockfile` parity confirmed)
    - _Requirements: 7.3_
  - [x] 7.4 `backend` CI job: ruff + pytest + model-load gate; `external` marker registered; pip caching. Fixed bare-`pytest` import via `pythonpath=.`
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  - [ ] 7.5 ⏳ **MANUAL (operator):** make `frontend` + `backend` jobs required in GitHub branch-protection settings
    - _Requirements: 6.3_
  - [x] 7.6 **Tests:** ✅ CI green on PR #5 (backend job ~37–46s, <5 min); model-load gate green under pins; the bare-pytest failure proved CI catches breakage
    - _Validates: Req 6, 7 all ACs; Property P5_

- [x] 8. Frontend test foundation — **PR #6 (CI green)**
  _Objective: a safety net exists before refactors; money-path logic is pinned by tests. (Req 8)_
  - [x] 8.1 Vitest + RTL + jest-dom configured (Phase 0); `test` script wired into the frontend CI job
    - _Requirements: 8.1, 8.3_
  - [x] 8.2 Unit tests: `scamDetection.ts` (14), `job-utils.ts` (8), `api-url.ts` (10). Found+fixed a stateful-regex bug in scamDetection while testing.
    - _Requirements: 8.2a, 8.2d_
  - [x] 8.3 Render smokes: `AnalyzePage` (2 — headline + textbox), `ResultsPage` (1 — renders TrueScore breakdown from navigation state)
    - _Requirements: 8.2b, 8.2c_
  - [x] 8.4 **Tests are the deliverable:** ✅ 35 tests (>15), green in CI ~39s (<3 min)
    - _Validates: Req 8 all ACs_

- [x] 9. Versioned migrations — **PR #7 MERGED, deployed, pg-verified**
  _Objective: schema state becomes knowable, ordered, and safe under concurrent instances. (Req 9)_
  - [x] 9.1 `app/migrations_runner.py` — schema_migrations ledger, ordered apply, dialect filtering, contiguity enforcement, pg advisory lock
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.2 `001_baseline.{pg,sqlite}.sql` (full 6-table schema, idempotent); `init_database()` delegates to runner (−160 lines)
    - _Requirements: 9.4_
  - [x] 9.3 Retired `migrate_db.py` (logic in baseline); kept `fix_sequence.py` as operational tool; added migrations/README
    - _Requirements: 9.5_
  - [x] 9.4 **Tests:** ✅ 6 runner tests (fresh apply, idempotency, existing-DB adoption w/ data preserved, contiguity + duplicate rejection). Postgres path verified against live DB (data preserved); deploy healthy.
    - _Validates: Req 9 ACs; Property P4_

<<<<<<< HEAD
- [ ] 10. Search precision & efficiency (Find Jobs) — **PRIORITY (above decompose)**
  _Objective: explicit query qualifiers (esp. seniority) actually narrow results, and a search costs one LLM call not four. Full analysis: `documentation/internal/SEARCH_PRECISION_AUDIT.md`._
  - [ ] 10.1 Fix the seniority scorer bug: `_calculate_seniority_score` (`job_ranker.py`) has no `contrary_levels` entry for `intern`/`mid`/`principal`, so an "intern" search scores senior roles 0.5 (neutral). Add all levels; penalize contrary levels hard (≈0.05).
  - [ ] 10.2 Stop broadening away an explicit qualifier: in `_build_multi_queries` (`search_orchestrator.py`) keep seniority in the rewrites when the user stated it (don't emit the seniority-dropping rewrite for qualified queries).
  - [ ] 10.3 Hard seniority filter: when seniority is explicit, drop results whose **title** shows a contrary level (mirror `apply_hard_exclusions`, title-based to avoid JD-body false negatives).
  - [ ] 10.4 Eliminate double signal extraction: `_fetch_multi_query` → `search_jobs(query=str)` re-extracts per sub-query (~4 Gemini calls/search → free-tier 20/day exhaustion → dumb fallback). Pass a pre-parsed query / lower-level Adzuna fetch so extraction runs once.
  - [ ] 10.5 **Tests:** `_calculate_seniority_score` unit tests (intern/mid/principal: contrary penalized, exact = 1.0); seniority hard-filter test; `_build_multi_queries` keeps seniority when explicit; `enhanced_search` integration test (mocked Adzuna) — an "intern" query does not surface senior-titled roles; ruff + CI green.
    - _Validates: SEARCH_PRECISION_AUDIT findings A–E_

- [ ] 10b. Decompose oversized pages — **DEFERRED (after Task 10)**; pure maintainability, no behavior/prod impact.
  _Objective: the two largest pages become maintainable without behavior change. (Req 10)_
  - [ ] 10b.1 Verify task 8 smokes green; add ProfilePage/OnboardingPage smokes first (8.3 smokes cover Analyze/Results, not these)
  - [ ] 10b.2 Extract `ProfilePage` → `pages/profile/*` (no file >300 lines)
=======
- [ ] 10. Decompose oversized pages — **DEFERRED** (pure maintainability refactor; no behavior/prod impact). To be done as a focused next step before/at start of Phase 2. Plan: add ProfilePage/OnboardingPage render smokes as guards first, then extract.
  _Objective: the two largest pages become maintainable without behavior change. (Req 10)_
  - [ ] 10.1 Verify task 8 smokes green (pre-refactor guard) — note: add ProfilePage/OnboardingPage smokes (8.3 smokes cover Analyze/Results, not these)
  - [ ] 10.2 Extract `ProfilePage` → `pages/profile/*` (no file >300 lines)
>>>>>>> 359f36cb81417edaa935501b624f618b0225f0c9
    - _Requirements: 10.1, 10.3_
  - [ ] 10b.3 Extract `OnboardingPage` → `pages/onboarding/steps/*`
    - _Requirements: 10.1, 10.3_
  - [ ] 10b.4 **Tests:** all smokes + typecheck green post-refactor; line-count assertion in review
    - _Validates: Req 10.2_

- [ ] 11. ✅ CHECKPOINT 1 — Discipline (PARTIAL — pending Task 10 + user verification)
  - [x] CI red/green discipline proven (PRs #5–#7 gated by frontend+backend jobs)
  - [x] Dependencies pinned (`requirements.txt` + `react-router-dom`); model-load gate green under pins
  - [x] Migrations runner live in prod (001 baseline applied, pg-verified, data preserved)
  - [x] 35 frontend tests (≥15)
  - [ ] No component >300 lines in decomposed pages — **deferred with Task 10**
  - [ ] ⏳ **MANUAL (operator):** verify/test Tasks 7–9 before Phase 2; make CI jobs required (branch protection)

---

## Phase 2: Data Flywheel (Weeks 2–8, overlaps Phase 1)

- [ ] 12. Verify outcome feedback loop end-to-end
  _Objective: the moat-building loop is proven working, not assumed working; gaps between spec checkboxes and reality are closed. (Req 11)_
  - [ ] 12.1 Write API-level E2E (`test_outcome_loop_e2e.py`, design §5.1) against temp SQLite with clock injection
    - _Requirements: 11.1_
  - [ ] 12.2 Fix every gap the E2E exposes (each gap = its own commit referencing this task); refactor pending-threshold logic for testability if sleeping is currently required
    - _Requirements: 11.2_
  - [ ] 12.3 Grep-verify and remove any remaining mock data in `ApplicationTrackerPage`; confirm 409 duplicate handling in UI
    - _Requirements: 11.3, 11.4_
  - [ ] 12.4 Add operator pulse endpoint `GET /api/admin/flywheel` (Clerk-ID allowlist) — weekly application/outcome counts
    - _Requirements: 11.5_
  - [ ] 12.5 **Tests:** E2E green; duplicate-409 test; pulse endpoint authz test (non-operator → 403)
    - _Validates: Req 11 all ACs; Property P6_

- [ ] 13. Company response intelligence
  _Objective: users see which companies are application black holes — the first user-visible payoff of the flywheel. (Req 12)_
  - [ ] 13.1 Implement company-name canonicalization at write time (normalize + rapidfuzz merge ≥92, design §5.2)
    - _Requirements: 12.4_
  - [ ] 13.2 Enforce n≥3 display floor server-side in stats endpoint; add ≥1h cache
    - _Requirements: 12.2, 12.3_
  - [ ] 13.3 Add read-only "Company Response" card to job details page (and "Not enough data yet" state)
    - _Requirements: 12.1, 12.2_
  - [ ] 13.4 **Tests:** normalization property tests ("Shopify Inc." ≡ "shopify"); floor test (n=2 → no stats emitted); card render test both states
    - _Validates: Req 12 all ACs; Property P7_

- [ ] 14. Ghost-job signals v1
  _Objective: stale/reposted listings are flagged; recency gets a real decay curve — the core differentiation vs. job boards. (Req 13)_
  - [ ] 14.1 Migration: `posting_fingerprints` table (design §5.3)
    - _Requirements: 13.3_
  - [ ] 14.2 Upsert fingerprints during search ingestion; derive "Reposted" flag (city in fingerprint = multi-location guard by construction)
    - _Requirements: 13.2, 13.5_
  - [ ] 14.3 Replace linear recency with exponential decay + ≤48h bonus band in `search_constants.py` / scorer; apply repost penalty to hiring-activity component
    - _Requirements: 13.4_
  - [ ] 14.4 Frontend: "Apply Early" badge (<48h) and "Reposted" informational flag on job cards/results
    - _Requirements: 13.1, 13.2_
  - [ ] 14.5 **Tests:** fingerprint property tests (P8 — equality semantics, different city ⇒ different fingerprint); recency monotonicity + 48h band ordering (P9); **update TrueScore contract tests deliberately in same PR**; badge render tests
    - _Validates: Req 13 all ACs; Properties P8, P9_

- [ ] 15. Scam model modernization
  _Objective: detection covers post-2020 scam classes; retraining becomes a repeatable, honest, versioned pipeline. (Req 14)_
  - [ ] 15.1 Ship rule-layer task-scam patterns in `authenticity.py` (pay-to-activate, task ladders, crypto payout, off-platform push) — **independent of model timeline**
    - _Requirements: 14.6_
  - [ ] 15.2 **Tests for 15.1 immediately:** unit test per pattern, positive + negative cases (e.g., "crypto" in a blockchain-developer JD must NOT flag)
    - _Validates: Req 14.6_
  - [ ] 15.3 Build `app/ml/training/` package (datasets/train/evaluate/promote, design §5.4); document labeling workflow
    - _Requirements: 14.1, 14.5_
  - [ ] 15.4 Assemble frozen modern holdout `holdout_v1` (labeled scam reports + hand-collected task-scam postings); version it
    - _Requirements: 14.2_
  - [ ] 15.5 Train candidate; apply promotion rule; move artifacts to GCS with CURRENT pointer
    - _Requirements: 14.2, 14.3, 14.4_
  - [ ] 15.6 **Tests:** metadata completeness test (every artifact has dataset versions/metrics/sklearn ver); promotion-rule unit tests (P10 — improving candidate promotes, regressing candidate refuses); evaluate.py reproducibility (same inputs → same report)
    - _Validates: Req 14 all ACs; Property P10_

- [ ] 16. ✅ CHECKPOINT 2 — Flywheel live
  - E2E loop green; pulse endpoint shows real production counts trending; company cards live; repost flags visible in prod; task-scam rules deployed; retraining pipeline runs end-to-end at least once (even if first candidate isn't promoted)

---

## Phase 3: Revenue & Decision Instrumentation (Weeks 4–12)

- [ ] 17. Affiliate placements
  _Objective: first revenue funnel, config-driven and disclosed, structurally excluded from trust surfaces. (Req 15)_
  - [ ] 17.1 Placement config (table or JSON) + render component mounted only on credential-pathway surface
    - _Requirements: 15.1, 15.4_
  - [ ] 17.2 Disclosure copy on every placement; `affiliate_click` event endpoint + insert
    - _Requirements: 15.2, 15.3_
  - [ ] 17.3 **Tests:** render test — placement appears on credential pathway; **P11 test — scam-analysis result tree renders zero placement components** (DOM assertion); click event recorded test; config-driven test (toggle `active` flips rendering without code change)
    - _Validates: Req 15 all ACs; Property P11_

- [ ] 18. Analytics events + agency pilot readiness
  _Objective: the numbers agencies and the Day-90 decision both need, with zero new SaaS. (Req 16)_
  - [ ] 18.1 Migration: `analytics_events`; insert hooks at the five event sites (scam check, search, tracked, outcome, affiliate click)
    - _Requirements: 16.3_
  - [ ] 18.2 `scripts/impact_report.py` — date-ranged aggregate markdown; `scripts/seed_demo.py` — idempotent demo data
    - _Requirements: 16.1, 16.2_
  - [ ] 18.3 Write `documentation/internal/agency_pilot_checklist.md` (onboarding, support, privacy answers)
    - _Requirements: 16.4_
  - [ ] 18.4 **Tests:** event inserts fire from each instrumented path (unit); impact report aggregates match seeded fixtures exactly; seed script idempotency (run twice ≡ once)
    - _Validates: Req 16 ACs_

- [ ] 19. "Job Scams in Canada" data note
  _Objective: earned distribution — media/policy attention from our own corpus, privacy-safe. (Req 17)_
  - [ ] 19.1 Aggregate export script with k-anonymity floor (suppress buckets n<5)
    - _Requirements: 17.1_
  - [ ] 19.2 Draft note: internal aggregates + FTC/CAFC anchors + explicit sample-size limitations; complete privacy checklist before publishing
    - _Requirements: 17.2, 17.3_
  - [ ] 19.3 **Tests:** P12 property test — generated export never contains a bucket with n<5 (fuzz with random small datasets); no PII fields present in output schema
    - _Validates: Req 17 ACs; Property P12_

- [ ] 20. Day-90 decision scorecard
  _Objective: the lane decision (B2G2C vs. consumer) is pre-committed to evidence. (Req 18)_
  - [ ] 20.1 Write `documentation/internal/decision_scorecard.md` with metrics AND thresholds **before** Phase 3 data accumulates
    - _Requirements: 18.1, 18.2_
  - [ ] 20.2 Verify weekly ceremony ≤10 min: run impact_report, paste, compare to thresholds (dry-run it twice)
    - _Requirements: 18.3_
  - [ ] 20.3 **Verification:** four consecutive weekly entries exist by Day 90; decision documented with data attached
    - _Validates: Req 18 ACs_

- [ ] 21. ✅ CHECKPOINT 3 — Day 90
  - Affiliate clicks counting; impact report producible in minutes; pilot checklist used in ≥1 real agency conversation; scorecard has ≥4 weekly entries; **lane decision made and written down**

---

## Task Dependency Notes

- 4.3 seeds the Vitest setup that 8.1 completes — do not duplicate config.
- 7.1 (model/sklearn version discovery) **must precede** 7.2 (pinning) — see design §4.2.
- 9 (migrations) must land before 14.1 and 18.1 (both add tables via migrations).
- 10 (decomposition) must not start before 8 (smokes) is green.
- 15.1–15.2 (rules) are deliberately independent of 15.3–15.6 (model) — ship rules first.
- 20.1 (thresholds) must be written before 18's data starts accumulating — pre-commitment is the point.
