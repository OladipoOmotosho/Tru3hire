# Design Document: 90-Day Hardening & Growth Plan

## 1. Overview

This design covers the technical changes behind `requirements.md`. The guiding principle: **the architecture is sound; the gaps are in operational truth (prod config, health, limits), reproducibility (pins, migrations, CI), and the data flywheel (outcomes → retraining).** We change as little structure as possible and add discipline around what exists.

### Design Principles

1. **Fix truth before features** — the deployed product must match the believed product before anything new ships.
2. **Tests close every loop** — each task group ends in an executable check; "works on my machine" is not a completion state.
3. **Smallest tool that holds** — lightweight migration runner over Alembic; Vitest smoke tests over E2E browser farms; config tables over admin UIs.
4. **Observable fallbacks** — every degradation path logs and surfaces in `/health`.
5. **Revenue surfaces never contaminate trust surfaces** — affiliate content is structurally excluded from scam-analysis results.

### Phase 2+ design principles (cold-start reset)

Post-Phase-1, the product strategy was re-sequenced (see `requirements.md`
"Strategy reset" and `tasks.md` Phase 2). The design consequences:

1. **Value before users.** Every Phase 2 feature must be useful with zero
   user-outcome data — driven by deterministic rules + public data (repost
   fingerprints, modern scam patterns, provincial credential rules), not by
   models trained on our own users.
2. **Value before signup.** The value moment (scam/ghost-job/eligibility check)
   runs **logged-out**; auth gates only personalization/history, never the core
   verdict. "Show your work" (cited reasons) is part of the value, and is the
   trust edge incumbents with an employer conflict can't copy.
3. **Instrument before optimizing.** Funnel events (`analytics_events`) ship in
   Phase 2 before any feature whose value we'd want to measure.
4. **Learned scoring is volume-gated.** Outcome-tuned weights / interview
   probability live in Phase 4 and must not run until the tracked-outcome pulse
   crosses a pre-committed threshold. The feedback loop is built earlier only as
   passive data collection.

---

## 2. Technology Stack Decision Record (addresses "should we move to Java/Go?")

### Decision: Keep Python/FastAPI + React/TypeScript. Do not rewrite.

### Context

The question was raised whether a "more battle-tested" language (Java, Go) is warranted given the project's depth.

### Analysis

| Factor | Assessment |
|---|---|
| **Workload shape** | The backend is I/O-bound: LLM calls, Adzuna HTTP, DB queries. FastAPI's async model handles this well. CPU-bound work (RandomForest inference, TF-IDF) runs in optimized C via scikit-learn/numpy — rewriting the *service* language doesn't speed up the *math*, which is already C. |
| **ML coupling** | The core IP (classifier, embeddings, resume matching) lives in the Python ML ecosystem (scikit-learn, joblib, sentence-transformers, google-genai). A Java/Go service would either re-implement this (months, high risk) or call a Python sidecar (now you run two stacks). |
| **Battle-testedness** | FastAPI/uvicorn serve production traffic at Uber, Netflix, and Microsoft-scale deployments. "Python isn't production-grade" was a 2010s argument; the 2026 failure mode is undisciplined Python, not Python. |
| **Actual current bottleneck** | None observed. Cloud Run horizontal scaling (concurrency 80/instance) is configured and untested by real load. We have a load *ceiling* problem only in imagination; we have a *correctness/config* problem in reality (audit B.1). |
| **Team shape** | Solo founder. A rewrite trades 3–6 months of zero user-visible progress for a hypothetical scale benefit years away. This is the classic pre-PMF rewrite trap. |
| **What Java/Go actually buy** | Static typing end-to-end, lower memory/instance, lower tail latency. We capture most of the typing benefit cheaper: TypeScript already covers the frontend; Python type hints + `pyright` (config already present: `pyrightconfig.json`) + pydantic cover the backend. |

### Reopening triggers (write these down so the decision is revisitable, not religious)

Reconsider extracting **a single Go service** (never a big-bang rewrite) if and only if:
1. A specific endpoint sustains >100 RPS with p95 latency SLO violations *after* caching and instance tuning, **or**
2. Cloud Run cost from instance-hours exceeds ~$500/month attributable to Python memory footprint, **or**
3. A B2B API product (audit Prospect 4) signs a customer with contractual latency SLOs the Python service measurably cannot meet.

Until a trigger fires: the "more refined" investment is discipline (pins, CI, types, migrations — Phase 1), not language. **Discipline is what makes a stack battle-tested; Go won't fix an unpinned dependency or an unenforced rate limit.**

### Consequences

- Phase 1 includes `ruff` + pyright strictening instead of a language migration.
- `pyrightconfig.json` graduates to `strict` on new modules incrementally (existing modules grandfathered at current level).

---

## 3. Phase 0 Design: Production Integrity

### 3.1 Secret wiring (Req 1)

```yaml
# cloudbuild.yaml — deploy step delta
- "--set-secrets"
- "DATABASE_URL=DATABASE_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,CLERK_ISSUER_URL=CLERK_ISSUER_URL:latest,ADZUNA_APP_ID=ADZUNA_APP_ID:latest,ADZUNA_APP_KEY=ADZUNA_APP_KEY:latest"
```

- `OPENAI_API_KEY` removed. Secret `GEMINI_API_KEY` created once in Secret Manager (operator runbook step, documented in TechnicalReadMe).
- `embeddings.py` startup logs: `Embeddings provider: gemini` / `local` / `keyword-fallback` at INFO. Provider choice exposed via a `get_provider_status()` accessor consumed by `/health`.

### 3.2 Rate limiting (Req 2)

slowapi is already installed and the limiter instantiated; we apply decorators and centralize config:

```python
# app/config/rate_limits.py
ANALYZE_LIMIT  = os.getenv("RL_ANALYZE",  "10/minute")   # per-IP
DISCOVER_LIMIT = os.getenv("RL_DISCOVER", "20/minute")   # per-user (keyed on Clerk sub)
REPORT_LIMIT   = os.getenv("RL_REPORT",   "5/minute")    # per-IP
```

- Anonymous endpoints key on remote address (existing `get_remote_address`; honor `X-Forwarded-For` first hop since Cloud Run terminates TLS at the LB — use a custom key func that prefers the first XFF entry).
- Authenticated endpoints use a key func that prefers the verified Clerk `sub` over IP (fairer behind shared NATs).
- 429 responses include `Retry-After`; slowapi's default handler already does this — verify in tests rather than re-implement.

### 3.3 Health and readiness (Req 3)

```
GET /health        → liveness. Always 200 if process is up.
                     body: { status: healthy|degraded, components: {db, model, embeddings, caches} }
GET /health/ready  → readiness. 200 only if db SELECT 1 ok AND model loadable.
                     503 with failing component named otherwise.
```

- DB check: `SELECT 1` with 2s timeout, executed in threadpool (sync driver).
- Model check: `MODEL_PATH.exists()` plus a cached one-time `joblib.load` validity flag (never retrain from a health check).
- Cloud Run health probe points at `/health/ready` (deploy flag update).

### 3.4 Frontend API resolution (Req 4)

```ts
// api-url.ts — design change
if (!import.meta.env.DEV) {
  // production: synchronous, no probe
  return ENV_URL ?? LIVE_URL;
}
// dev: keep the localhost probe behavior
```

Removes up to 2s first-call latency for production visitors; dev convenience unchanged.

### 3.5 Hygiene (Req 5)

Pure `git rm --cached` + `.gitignore` additions + file deletions. The model `.joblib` stays (see Req 5 AC4); `app/ml/models/README.md` records: source dataset (EMSCAD, 17,880 rows, 2012–2014), training sklearn version, stored metrics, and the staleness caveat from the audit.

---

## 4. Phase 1 Design: Engineering Discipline

### 4.1 CI topology (Req 6)

```yaml
jobs:
  frontend:   # existing build job, renamed
    - typecheck, build, vitest run
  backend:
    - setup-python 3.11 (pip cache keyed on requirements.txt)
    - pip install -r packages/backend/requirements.txt -r requirements-dev.txt
    - ruff check packages/backend/app
    - pytest packages/backend/tests -q -m "not external"
    - python -c "import joblib; joblib.load('packages/backend/app/ml/models/fake_job_classifier.joblib')"
```

- New pytest marker `external` for tests touching Gemini/Adzuna; CI excludes them. A nightly optional workflow MAY run them with secrets later (out of scope for the 90 days).
- Working directory for pytest is `packages/backend` (matches the existing `ModuleNotFoundError: app` behavior found during the audit — document this in `requirements-dev.txt` header or a `pytest.ini` with `rootdir`).

### 4.2 Dependency pinning (Req 7)

- `requirements.in` = current direct deps. `pip-compile` (or `uv pip compile`) → fully pinned `requirements.txt`.
- **Constraint discovery step:** load the committed model under candidate pins *before* committing them; if the model was trained on an older sklearn, either pin to that version or retrain immediately under the new pin (feeds Req 14). This ordering is deliberate: pinning blind could brick deserialization.
- Frontend: `react-router-dom` pinned to its current installed major (read from `yarn.lock`, pin `^` to that).

### 4.3 Frontend test foundation (Req 8)

- Vitest (shares the Vite config/transform pipeline — zero extra build config) + RTL + `@testing-library/jest-dom` (already in root node_modules).
- Test targets are pure-logic-first (cheapest, most stable): `api-url.ts`, `scamDetection.ts`, `job-utils.ts`, then two render smokes (`AnalyzePage`, `ResultsPage` with mocked fetch).
- MSW deliberately not introduced yet — plain `vi.fn()` fetch mocks suffice at this scale (smallest tool that holds).

### 4.4 Migration runner (Req 9)

**Why not Alembic:** Alembic assumes SQLAlchemy metadata; `database.py` is raw psycopg2/sqlite3 with hand-written dual-dialect SQL. Adopting SQLAlchemy is a (worthy) larger refactor — deferred, not rejected. The runner below is ~100 lines and removes the immediate risk (unversioned schema drift).

```
packages/backend/migrations/
  001_baseline.pg.up.sql      001_baseline.sqlite.up.sql
  002_posting_fingerprints.up.sql            # shared-dialect when possible
  ...
app/migrations_runner.py:
  - ensure schema_migrations(version, name, applied_at)
  - list files, filter by dialect, sort by number
  - apply unapplied in a transaction each; record row
  - Postgres: pg_advisory_lock(0x7472756568697265) around the run (concurrent Cloud Run instances)
  - down files exist for documentation/manual rollback; runner only goes up (solo-op simplicity)
```

`init_database()` becomes: connect → run migrations → done. Existing `CREATE TABLE IF NOT EXISTS` logic is frozen into `001_baseline`.

### 4.5 Page decomposition (Req 10)

Mechanical extraction, no logic changes:

```
pages/profile/ProfilePage.tsx        (orchestrator, <150 lines)
pages/profile/ProfileHeader.tsx
pages/profile/SkillsSection.tsx
pages/profile/WorkExperienceSection.tsx
pages/profile/ResumeSection.tsx
pages/onboarding/OnboardingPage.tsx  (stepper orchestrator)
pages/onboarding/steps/*.tsx         (one file per step)
```

Guard: Req 8 smoke tests green before refactor begins and after it ends; `tsc --noEmit` clean.

---

## 5. Phase 2 Design: Data Flywheel

### 5.1 Outcome loop verification (Req 11)

The P0 spec marks its ACs complete; we trust but verify with an API-level E2E (TestClient + temp SQLite):

```
test_outcome_loop_e2e.py
  1. POST /api/applications            → 201, id
  2. POST same job again               → 409
  3. (clock injection) GET /api/applications/pending?days_threshold=0 → contains id
  4. POST /api/applications/{id}/outcome {interview}                  → 200
  5. GET /api/applications/stats       → interviews == 1
  6. GET /api/applications/companies/{name}/stats → aggregates updated
```

Clock injection: pending-threshold logic must accept a reference time or read `applied_at` arithmetic from SQL — whichever the code does today, the test must not `sleep(7 days)`. If the current code can't be tested without sleeping, that's a Req 11 gap to fix (testability is a feature).

Operator pulse (Req 11 AC5): `GET /api/admin/flywheel` (auth: operator allowlist by Clerk user ID) returning weekly counts — one SQL query, no UI.

### 5.2 Company response card (Req 12)

- Data: existing `company_response_stats` table + endpoint.
- Normalization: `normalize_company(name)` = lowercase, strip legal suffixes (inc, ltd, corp, llc), collapse whitespace; rapidfuzz `token_sort_ratio ≥ 92` merges variants at *write* time (store canonical form alongside raw).
- Display floor n≥3 enforced server-side (the API refuses to return stats below floor — clients can't accidentally mislead).

### 5.3 Ghost-job signals (Req 13)

```
posting_fingerprints (migration 002)
  fingerprint   TEXT PK   -- sha256(normalized_title|company_canonical|city)
  first_seen    TIMESTAMP
  last_seen     TIMESTAMP
  seen_count    INT
  last_posted_date DATE   -- as reported by source
```

- During search ingestion: upsert fingerprint. `seen_count > 1` **and** `last_posted_date` newer than prior → "Reposted" flag.
- Multi-location guard: city is part of the fingerprint, so same role in another city is a *different* fingerprint (Req 13 AC5 by construction).
- Recency decay (replaces linear): `score = 100 * exp(-ln(2) * age_days / half_life)` with `half_life = 7 days`, plus a flat bonus band ≤48h (the "Apply Early" cliff). Constants in `search_constants.py`; TrueScore contract tests updated in the same PR (deliberate contract change, per Req 13 AC4).

### 5.4 Retraining pipeline (Req 14)

```
app/ml/training/
  datasets.py     -- loaders: emscad(), modern_reports(), frozen_holdout()
  train.py        -- fit pipeline, embed metadata dict (data versions, sklearn ver, date, metrics)
  evaluate.py     -- fixed report: acc/P/R/F1 per class on BOTH holdouts (emscad-holdout, modern-holdout)
  promote.py      -- applies the promotion rule; uploads to GCS; writes models/CURRENT pointer
```

- **Frozen holdout** is the integrity anchor: a versioned, never-trained-on file (`holdout_v1.parquet`) containing modern examples (labeled scam reports + hand-collected task-scam postings). Promotion rule (Req 14 AC3) evaluated only against frozen holdouts.
- Rule-layer task-scam patterns ship first (regex/heuristics in `authenticity.py`: pay-to-activate, per-task commission ladders, crypto payout, "message us on WhatsApp/Telegram") with unit tests per pattern — independent of model timeline.
- Labeling workflow v1: weekly export of `/report-scam` rows → founder labels in a CSV → `modern_reports()` loader ingests labeled CSVs from a `data/labeled/` directory. Unglamorous and honest.

---

## 6. Phase 3 Design: Revenue & Instrumentation

### 6.1 Affiliate placements (Req 15)

```
affiliate_placements (config table or JSON in app/config/)
  id, surface ("credential_pathway"), partner ("wes"), title, body, url, active
```

- Render rule: placement components mount **only** on allowed surfaces; the scam-analysis result tree imports no placement component (structural exclusion, lint-greppable).
- Tracking: `POST /api/events {type: "affiliate_click", placement_id}` → `analytics_events` table (count-only, no PII payload).

### 6.2 Analytics events (Req 16)

```
analytics_events (migration 00N)
  id, event_type, occurred_at, anon_bucket (nullable)
event_type ∈ {scam_check, job_search, application_tracked, outcome_reported, affiliate_click}
```

- Counts only; user linkage limited to what already exists (Clerk sub on authed actions). No third-party analytics SaaS (NFR-4); a 20-line insert beats a PostHog integration at this stage.
- Impact summary (Req 16 AC2): one script (`scripts/impact_report.py`) → markdown table of aggregates over a date range. Demo seed: `scripts/seed_demo.py` (idempotent, targets a `demo_` Clerk user).

### 6.3 Data note & scorecard (Req 17, 18)

- Export script enforces k-anonymity: any aggregate bucket with n<5 is suppressed.
- `decision_scorecard.md` template includes pre-committed thresholds; weekly numbers come from `impact_report.py` output pasted in (10-minute ceremony, NFR within Req 18 AC3).

---

## 7. Correctness Properties (test anchors)

These are the invariants the test suites must pin down:

| # | Property | Validated by |
|---|---|---|
| P1 | `/health/ready` is 503 ⟺ (DB unreachable ∨ model unloadable) | Req 3 tests |
| P2 | Exceeding any configured rate limit yields 429 + Retry-After; under-limit traffic is unaffected | Req 2 tests |
| P3 | Embeddings provider reported by `/health` equals the provider actually used for the next embedding call | Req 1 tests |
| P4 | Migration runner is idempotent: running twice ≡ running once (schema_migrations fixpoint) | Req 9 tests |
| P5 | Pinned environment loads the committed model without exception | Req 7 CI step |
| P6 | Outcome loop: stats are a pure function of recorded outcomes (no phantom counts; deleting nothing) | Req 11 E2E |
| P7 | Company stats below display floor are never emitted by the API | Req 12 tests |
| P8 | Fingerprint equality ⟺ (normalized title, canonical company, city) equality; different city ⇒ no repost flag | Req 13 tests |
| P9 | Recency score is monotonically non-increasing in age; ≤48h band strictly outranks >48h | Req 13 tests |
| P10 | Promotion rule: candidate promoted ⇒ modern-F1 improved ∧ emscad-F1 drop ≤ 2pts | Req 14 tests |
| P11 | No affiliate component renders within the scam-analysis result tree | Req 15 test (render + DOM assert) |
| P12 | Aggregate exports contain no bucket with n<5 | Req 17 tests |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Pinning reveals model/sklearn version mismatch | Req 7 ordering: verify-load *before* committing pins; retrain path ready in Req 14 |
| Rate limits break legitimate shared-IP users (libraries, campuses) | Per-user keys on authed routes; limits env-tunable without deploy (Req 2 AC5) |
| Repost detection false positives anger users | City in fingerprint (P8); flag is informational copy ("Reposted — may be a ghost job"), never auto-hides a job |
| Outcome data too sparse for company stats | Display floor n≥3 (P7); flywheel pulse metric (Req 11 AC5) tells us *when* density arrives instead of guessing |
| Solo-founder bandwidth: Phase 2 and 3 overlap | tasks.md orders by dependency; Phase 3 tasks 15–16 are deliberately small (config table + insert endpoint + 2 scripts) |
| Scope creep on agency features | Req 16 is *pilot readiness*, not multi-tenancy; anything beyond demo+report+checklist is out of scope for 90 days |
