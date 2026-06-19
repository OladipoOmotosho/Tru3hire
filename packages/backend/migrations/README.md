# Database migrations

Versioned SQL migrations applied by
[`app/migrations_runner.py`](../app/migrations_runner.py). `init_database()` runs
them on startup; only pending migrations are applied (idempotent).

## File naming

```
NNN_short_name.<dialect>.sql
```

- `NNN` — zero-padded version, **contiguous from 001** (no gaps or duplicates;
  the runner rejects out-of-order numbering).
- `<dialect>` — `pg` (PostgreSQL, production) or `sqlite` (local dev). Provide
  **both** variants for every migration so local and prod stay in sync.

Example: `002_add_company_canonical_name.pg.sql` + `002_add_company_canonical_name.sqlite.sql`.

## Rules

- Make statements idempotent where practical (`CREATE TABLE IF NOT EXISTS`,
  `ADD COLUMN IF NOT EXISTS` on pg) so re-runs and existing databases are safe.
- A migration file may contain multiple `;`-separated statements.
- Never edit a migration that has already been applied in production — add a new
  one instead.
- The runner records applied versions in the `schema_migrations` table.

## Applying manually

```bash
cd packages/backend
python -m scripts.init_db_script   # applies pending migrations to the configured DB
```

Postgres runs hold a session advisory lock, so concurrent Cloud Run instances
won't double-apply.
