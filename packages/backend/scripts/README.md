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
| `migrate_db.py` | Ad-hoc PostgreSQL table migration (manual, pre-dates a real migration framework) | ⚠️ Superseded in Phase 1 — see note below |
| `fix_sequence.py` | Repairs Postgres `SERIAL`/identity sequences after manual data loads | ⚠️ Superseded in Phase 1 |
| `init_db_script.py` | Calls `app.database.init_database()` to create tables locally | Utility |
| `populate_companies.py` | Seeds the company verification database | Utility |
| `skills_gap_flow_demo.py` | Demo/exercise of the skills-gap flow | Demo |

## Phase 1 note (migrations)

`migrate_db.py` and `fix_sequence.py` are hand-rolled, irreversible, and not
version-tracked. The 90-day roadmap (Req 9, `.agent/90-day-roadmap`) replaces
them with a proper versioned migration runner under
`packages/backend/migrations/`. Once that lands, these two scripts should be
**converted into migrations or deleted** (Req 9.5). Do not build new workflows
on top of them.
