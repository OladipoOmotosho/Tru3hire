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

- [x] 10. Search precision & efficiency (Find Jobs) — **DONE (PR pending)**
      _Objective: explicit query qualifiers (esp. seniority) actually narrow results, and a search costs one LLM call not four. Full analysis: `documentation/internal/SEARCH_PRECISION_AUDIT.md`._
  - [x] 10.1 Fix the seniority scorer bug: `_calculate_seniority_score` (`job_ranker.py`) has no `contrary_levels` entry for `intern`/`mid`/`principal`, so an "intern" search scores senior roles 0.5 (neutral). Add all levels; penalize contrary levels hard (≈0.05).
  - [x] 10.2 Stop broadening away an explicit qualifier: in `_build_multi_queries` (`search_orchestrator.py`) keep seniority in the rewrites when the user stated it (don't emit the seniority-dropping rewrite for qualified queries).
  - [x] 10.3 Hard seniority filter: when seniority is explicit, drop results whose **title** shows a contrary level (mirror `apply_hard_exclusions`, title-based to avoid JD-body false negatives).
  - [x] 10.4 Eliminate double signal extraction: `_fetch_multi_query` → `search_jobs(query=str)` re-extracts per sub-query (~4 Gemini calls/search → free-tier 20/day exhaustion → dumb fallback). Pass a pre-parsed query / lower-level Adzuna fetch so extraction runs once.
  - [x] 10.5 **Tests:** `_calculate_seniority_score` unit tests (intern/mid/principal: contrary penalized, exact = 1.0); seniority hard-filter test; `_build_multi_queries` keeps seniority when explicit; `enhanced_search` integration test (mocked Adzuna) — an "intern" query does not surface senior-titled roles; ruff + CI green.
    - _Validates: SEARCH_PRECISION_AUDIT findings A–E_

- [x] 10b. Decompose oversized pages — **PR #12 (safe-sections approach)**
      _Objective: the two largest pages become maintainable without behavior change. (Req 10)_
  - [x] 10b.1 Added ProfilePage + OnboardingPage render smokes as pre-refactor guards
  - [x] 10b.2 Extracted `ProfilePage` 834→559 → `pages/profile/*` (5 sections, 59–111 lines each)
    - _Requirements: 10.1, 10.3_
  - [x] 10b.3 Extracted `OnboardingPage` 568→324 → `pages/onboarding/steps/*` (5 steps, 27–130 lines)
    - _Requirements: 10.1, 10.3_
  - [x] 10b.4 **Tests:** ✅ all 37 frontend tests + typecheck + build green post-refactor
    - _Validates: Req 10.2_
  - [ ] 10b.5 ⏳ **Optional follow-up:** lift page state/handlers into hooks so the orchestrators (559/324) also drop <300 (chose "safe sections" first to minimize regression risk)

- [ ] 11. ✅ CHECKPOINT 1 — Discipline (PARTIAL — pending Task 10 + user verification)
  - [x] CI red/green discipline proven (PRs #5–#7 gated by frontend+backend jobs)
  - [x] Dependencies pinned (`requirements.txt` + `react-router-dom`); model-load gate green under pins
  - [x] Migrations runner live in prod (001 baseline applied, pg-verified, data preserved)
  - [x] 35 frontend tests (≥15)
  - [ ] No component >300 lines in decomposed pages — **deferred with Task 10**
  - [ ] ⏳ **MANUAL (operator):** verify/test Tasks 7–9 before Phase 2; make CI jobs required (branch protection)

---

## Phase 2: Zero-to-One Value & Distribution — no users, no login (Weeks 2–8)

> **Strategy reset (cold-start reality).** Three constraints reshape this phase:
> (1) we have no user volume, so v1 value **cannot** depend on learned-from-users
> data; (2) we're undifferentiated from LinkedIn/Jobright/Wellfound/Hatch unless
> we're the **honest, seeker-side truth layer** (no employer conflict) for a
> specific population; (3) **no one signs up for an unproven job platform** — so
> the value moment must require **no account**. Therefore Phase 2 ships
> deterministic, publicly-sourced value, instruments everything, and acquires
> users in the wild. Learned scoring is deferred to Phase 4 (volume-gated).

- [ ] 12. Value without login (remove the signup wall from every value moment)
      _Objective: a first-time, anonymous visitor gets real, verifiable help — the only way to earn trust before signup. (answers obj 3 + trust differentiation)_
  - [ ] 12.1 Audit every value surface; ensure scam check, URL/JD analysis, ghost-job flags, and a basic eligibility check work fully **logged-out** (no Clerk gate on the value moment).
  - [ ] 12.2 "Show your work" transparency UX: every flag/score states **why** (the rule that fired, the signal, a cited source). The thing platforms with an employer conflict structurally won't do.
  - [ ] 12.3 Signup is offered **after** value is delivered (save history / personalize), never before.
  - [ ] 12.4 **Tests:** logged-out E2E — anonymous user completes a scam + ghost-job check and sees reasons; no auth redirect on value paths.

- [ ] 13. Instrument the funnel from day one (privacy-safe)
      _Objective: you cannot improve, prove, or decide anything without the numbers. (pulled forward — was Phase 3)_
  - [ ] 13.1 Migration: `analytics_events` (count-only, no PII; nullable anon bucket).
  - [ ] 13.2 Emit events across the funnel: `check_run → result_viewed → reasons_expanded → shared → signup → return`.
  - [ ] 13.3 `scripts/impact_report.py` — date-ranged funnel aggregates (activation, share rate, return rate).
  - [ ] 13.4 **Tests:** each instrumented path emits its event; report aggregates match seeded fixtures; k-anonymity floor (suppress n<5).

- [ ] 14. Ghost-job signals from public data (no user data needed)
      _Objective: deterministic value with zero users — the "truth" incumbents can't show on their own listings. (Req 13)_
  - [ ] 14.1 Migration: `posting_fingerprints` table (design §5.3).
  - [ ] 14.2 Upsert fingerprints during search ingestion; derive "Reposted" flag (city in fingerprint = multi-location guard).
  - [ ] 14.3 Exponential recency decay + ≤48h bonus band; repost penalty on hiring-activity (update TrueScore contract tests in same PR).
  - [ ] 14.4 Frontend: "Apply Early" (<48h) + "Reposted" flags on cards/results.
  - [ ] 14.5 **Tests:** fingerprint property tests (P8); recency monotonicity + 48h band (P9); badge render tests.

- [ ] 15. Modern scam RULES (public patterns, not learned)
      _Objective: cover post-2020 scam classes with deterministic rules — no training data or volume required. (Req 14.6)_
  - [ ] 15.1 Rule layer in `authenticity.py`: pay-to-activate, task ladders, crypto payout, off-platform (WhatsApp/Telegram) push.
  - [ ] 15.2 **Tests:** unit test per pattern, positive + negative (e.g. "crypto" in a blockchain JD must NOT flag).
  - _Note: model RETRAINING (labeled-data/volume dependent) moves to Phase 3 Task 19._

- [ ] 16. A distribution wedge (acquire users without proof-first)
      _Objective: meet users where they already are, with value that needs no account — the answer to the chicken-and-egg. Pick ONE and go deep._
  - [ ] 16.1 Decide the wedge (record rationale in `documentation/internal/distribution_decision.md`):
        **(a)** shareable scam/ghost-job **report card** (public URL, no login — viral, emotional), or
        **(b)** **browser extension** that scores jobs in-place on LinkedIn/Indeed (utility on others' traffic).
  - [ ] 16.2 Build the chosen wedge against the existing public analyze/ghost-job APIs; instrument shares/installs (Task 13).
  - [ ] 16.3 **Tests:** the wedge renders a real score+reasons for a sample posting with no auth; share/install event fires.

- [ ] 17. ✅ CHECKPOINT 2 — Useful with zero users
  - Anonymous visitor gets a scam + ghost-job verdict **with reasons**, logged-out; funnel instrumented (activation/share/return visible in impact_report); ONE distribution wedge live; modern scam rules + ghost-job flags deployed. **No dependency on user volume yet.**

---

## Phase 3: Retention, Moat & Revenue (Weeks 6–12)

- [ ] 18. Outcome feedback loop as PASSIVE data infrastructure
      _Objective: quietly COLLECT the data Phase 4 will need — but value must not depend on it yet. (Req 11, reframed)_
  - [ ] 18.1 Application + outcome tracking works end-to-end (API E2E vs temp SQLite, clock injection); remove ApplicationTrackerPage mock data; 409 dup handling.
  - [ ] 18.2 Operator pulse `GET /api/admin/flywheel` — weekly tracked-application/outcome counts (the volume gauge for Phase 4).
  - [ ] 18.3 **Tests:** E2E loop green; duplicate-409; pulse authz (non-operator → 403).

- [ ] 19. Scam-model retraining (gated on labeled data)
      _Objective: replace the 2012–2014 model once enough modern labeled examples exist. (Req 14.1–14.5)_
  - [ ] 19.1 `app/ml/training/` (datasets/train/evaluate/promote) + labeling workflow; frozen modern holdout `holdout_v1`.
  - [ ] 19.2 Promotion rule (modern-F1 up, EMSCAD-F1 within 2pts); artifacts to GCS + CURRENT pointer.
  - [ ] 19.3 **Tests:** metadata completeness; promotion-rule (P10); evaluate reproducibility.
  - _Gate: only run when ≥N labeled scam examples exist (from `/report-scam` + curation)._

- [ ] 20. Eligibility depth for ONE beachhead vertical (the retention moat)
      _Objective: the thing no incumbent does — tell a newcomer WHY they're not getting callbacks and what to do next. Narrow hard to prove it._
  - [ ] 20.1 Pick one vertical (e.g. intern/new-grad **software** in **Ontario**); hard-code credential/eligibility pathways from public regulatory sources.
  - [ ] 20.2 Surface an "Eligibility / next steps" panel on relevant jobs (logged-out where possible).
  - [ ] 20.3 **Tests:** eligibility rules unit-tested; panel renders for in-vertical jobs, hidden out-of-vertical.

- [ ] 21. Company response intelligence (volume-gated)
      _Objective: surface application black holes once outcome data accrues. (Req 12)_
  - [ ] 21.1 Company-name canonicalization (rapidfuzz ≥92); n≥3 display floor; ≥1h cache; read-only card + "not enough data yet" state.
  - [ ] 21.2 **Tests:** normalization (P7); floor (n=2 → nothing emitted); card both states.

- [ ] 22. Affiliate revenue + agency pilot readiness
      _Objective: first cashflow + a demonstrable pilot, disclosed and excluded from trust surfaces. (Req 15, 16)_
  - [ ] 22.1 Config-driven affiliate placements on credential-pathway surfaces only (disclosure copy; `affiliate_click` event). **Never on scam-analysis results (P11).**
  - [ ] 22.2 `scripts/seed_demo.py` (idempotent) + agency impact summary from real aggregates; `agency_pilot_checklist.md`.
  - [ ] 22.3 **Tests:** P11 (no placement in scam result tree); click event; seed idempotency.

- [ ] 23. "Job Scams in Canada" data note (earned distribution)
  - [ ] 23.1 k-anonymized aggregate export (suppress n<5) + draft note (FTC/CAFC anchors, sample-size caveats, privacy checklist).
  - [ ] 23.2 **Tests:** P12 — export never contains a bucket n<5; no PII fields.

- [ ] 24. ✅ CHECKPOINT 3 — Retention & moat
  - Outcome data accumulating (pulse trending up); eligibility panel live for the beachhead vertical; ≥1 revenue surface; ≥1 agency conversation using the impact summary.

---

## Phase 4: Learned scoring — VOLUME-GATED (only after the data exists)

> Do **not** start until the pulse (Task 18.2) shows enough tracked outcomes to
> be statistically meaningful (threshold set in the decision doc below). This is
> the original "data flywheel" — correct, but it cannot precede volume.

- [ ] 25. Decision scorecard + volume gate
  - [ ] 25.1 `documentation/internal/decision_scorecard.md` — pre-committed metrics + thresholds (activation, share, return, tracked-outcome count) **before** data accumulates.
  - [ ] 25.2 Weekly ≤10-min ceremony from `impact_report`; ≥4 weekly entries before any learned-scoring work.

- [ ] 26. Interview-probability / outcome-tuned scoring (gated)
  - [ ] 26.1 Once the gate is met: calibrate TrueScore weights against real outcomes; introduce an interview-probability estimate with honest confidence/sample-size disclosure.
  - [ ] 26.2 **Tests:** calibration reproducibility; never show a learned score below a minimum sample size.

---

## Task Dependency Notes

- Phases 0–1 are complete (Tasks 1–10b). Phase 2 onward reflects the **cold-start strategy reset** (see the note under Phase 2): value before users, value before signup, learned-scoring last.
- 9 (migrations) must land before any new table — Task 13 (`analytics_events`) and Task 14 (`posting_fingerprints`) both go through the migration runner.
- **Task 13 (instrumentation) lands first in Phase 2** — every later task's value/return/virality is measured through it; without it we're flying blind.
- **Task 12 (value without login) gates the distribution wedge (Task 16)** — the wedge is only worth shipping once the value moment needs no account.
- Task 15 (scam RULES) is independent of Task 19 (model retraining) — ship rules now; retrain only when labeled data exists.
- **Phase 4 (Tasks 25–26, learned scoring) is GATED** on Task 18.2's pulse showing enough tracked outcomes — do not start early; that gate is the whole point of the reset.
