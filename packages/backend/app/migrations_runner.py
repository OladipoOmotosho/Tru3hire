"""
Lightweight, dialect-aware SQL migration runner.

Applies numbered SQL files from ``migrations/`` in order and records applied
versions in a ``schema_migrations`` table. Design reference:
.agent/90-day-roadmap/design.md §4.4.

Properties (see design.md P4):
- Idempotent: already-applied migrations are skipped; running twice == once.
- Ordered + contiguous: versions must be 1, 2, 3, ... with no gaps or dupes.
- Dialect-aware: files are named ``NNN_name.pg.sql`` / ``NNN_name.sqlite.sql``;
  only the active dialect's files run.
- Safe under concurrency: Postgres runs hold a session advisory lock so two
  Cloud Run instances starting at once don't apply the same migration twice.

Why not Alembic: ``database.py`` uses raw psycopg2/sqlite3 with hand-written
dual-dialect SQL, not SQLAlchemy metadata. This ~150-line runner removes the
immediate risk (unversioned schema drift) without that larger refactor.
"""

import logging
import re
from pathlib import Path
from typing import Callable, List, Optional, Tuple

logger = logging.getLogger("uvicorn.error")

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

# A fixed key for Postgres advisory locking (well within int64).
_ADVISORY_LOCK_KEY = 7274696865

# NNN_name.{pg|sqlite}.sql
_FILENAME_RE = re.compile(r"^(\d+)_([a-z0-9_]+)\.(pg|sqlite)\.sql$")


def discover_migrations(
    migrations_dir: Path, dialect: str
) -> List[Tuple[int, str, Path]]:
    """
    Return ``[(version, name, path)]`` for the given dialect, sorted by version.

    Raises if numbering is duplicated or non-contiguous (must be 1..N), which
    keeps migration order unambiguous.
    """
    found: dict[int, Tuple[int, str, Path]] = {}
    for path in sorted(migrations_dir.glob("*.sql")):
        m = _FILENAME_RE.match(path.name)
        if not m:
            continue
        version, name, file_dialect = int(m.group(1)), m.group(2), m.group(3)
        if file_dialect != dialect:
            continue
        if version in found:
            raise RuntimeError(
                f"Duplicate migration version {version} for dialect {dialect}: "
                f"{found[version][2].name} and {path.name}"
            )
        found[version] = (version, name, path)

    ordered = [found[v] for v in sorted(found)]
    for expected, (version, _name, path) in enumerate(ordered, start=1):
        if version != expected:
            raise RuntimeError(
                f"Non-contiguous migration numbering for dialect {dialect}: "
                f"expected {expected:03d}, found {version:03d} ({path.name})"
            )
    return ordered


def _applied_versions(cursor) -> set:
    cursor.execute("SELECT version FROM schema_migrations")
    # Plain cursors yield index-accessible rows for both psycopg2 (tuple) and
    # sqlite3 (Row), so row[0] is portable.
    return {row[0] for row in cursor.fetchall()}


def run_migrations(
    get_conn: Optional[Callable] = None,
    use_postgres: Optional[bool] = None,
    migrations_dir: Optional[Path] = None,
) -> List[int]:
    """
    Apply all pending migrations. Returns the list of versions newly applied.

    Args are injectable for testing; by default they bind to the live database
    configured in ``app.database``.
    """
    if get_conn is None or use_postgres is None:
        from app.database import get_db_connection, USE_POSTGRES

        get_conn = get_conn or get_db_connection
        use_postgres = USE_POSTGRES if use_postgres is None else use_postgres
    migrations_dir = migrations_dir or MIGRATIONS_DIR
    dialect = "pg" if use_postgres else "sqlite"

    migrations = discover_migrations(migrations_dir, dialect)
    newly_applied: List[int] = []

    conn = get_conn()
    try:
        cursor = conn.cursor()

        if use_postgres:
            cursor.execute("SELECT pg_advisory_lock(%s)", (_ADVISORY_LOCK_KEY,))

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()

        applied = _applied_versions(cursor)

        for version, name, path in migrations:
            if version in applied:
                continue

            sql = path.read_text(encoding="utf-8")
            if use_postgres:
                # psycopg2 executes multiple ';'-separated statements in one call.
                cursor.execute(sql)
                cursor.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (%s, %s)",
                    (version, name),
                )
            else:
                # sqlite3.execute() runs only one statement; executescript handles
                # the multi-statement migration file (it commits first).
                conn.executescript(sql)
                cursor.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                    (version, name),
                )
            conn.commit()
            newly_applied.append(version)
            logger.info("Applied migration %03d_%s (%s)", version, name, dialect)

        if use_postgres:
            cursor.execute("SELECT pg_advisory_unlock(%s)", (_ADVISORY_LOCK_KEY,))
            conn.commit()

        return newly_applied
    finally:
        conn.close()
