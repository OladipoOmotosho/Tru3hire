# Backend Scripts

One-off and maintenance scripts. **Run them as modules from the backend root**
(`packages/backend/`) so that `from app...` imports resolve:

```bash
cd packages/backend
python -m scripts.<name>
```

## Scripts

| Script | Purpose | Status |
| --- | --- | --- |
| `fix_sequence.py` | Repairs Postgres `SERIAL`/identity sequences after manual data loads | Operational (not a schema migration) |
| `init_db_script.py` | Calls `app.database.init_database()` to apply migrations locally | Utility |
| `populate_companies.py` | Seeds the company verification database | Utility |
| `skills_gap_flow_demo.py` | Demo/exercise of the skills-gap flow | Demo |

## Schema changes use migrations (not scripts)

Schema is now managed by the versioned migration runner
([`app/migrations_runner.py`](../app/migrations_runner.py)) with SQL files under
[`packages/backend/migrations/`](../migrations/). `init_database()` (run on
startup) applies any pending migrations.

`migrate_db.py` was removed in Phase 1 — its table-creation logic is captured in
`migrations/001_baseline.*.sql`. `fix_sequence.py` is retained as an
*operational* repair tool (fixing sequence counters after bulk data loads is not
a versioned schema change); it is not part of the migration flow.
