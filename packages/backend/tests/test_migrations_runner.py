"""
Tests for the migration runner (Req 9, Property P4).

All tests run against throwaway temp SQLite databases via the injectable
get_conn, so they never touch the configured (prod) database.
"""

import sqlite3

import pytest

from app.migrations_runner import (
    MIGRATIONS_DIR,
    discover_migrations,
    run_migrations,
)

BASELINE_TABLES = {
    "scam_reports",
    "analysis_history",
    "user_skill_gaps",
    "user_applications",
    "application_outcomes",
    "company_response_stats",
}


def _sqlite_factory(path):
    def factory():
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return conn

    return factory


def _tables(path):
    conn = sqlite3.connect(path)
    try:
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
        return {r[0] for r in rows}
    finally:
        conn.close()


def test_discover_filters_by_dialect_and_orders():
    sqlite_migs = discover_migrations(MIGRATIONS_DIR, "sqlite")
    pg_migs = discover_migrations(MIGRATIONS_DIR, "pg")
    assert [v for v, _, _ in sqlite_migs] == [1]
    assert [v for v, _, _ in pg_migs] == [1]
    # Each dialect only sees its own files.
    assert sqlite_migs[0][2].name.endswith(".sqlite.sql")
    assert pg_migs[0][2].name.endswith(".pg.sql")


def test_fresh_db_applies_baseline(tmp_path):
    db = str(tmp_path / "fresh.db")
    applied = run_migrations(get_conn=_sqlite_factory(db), use_postgres=False)

    assert applied == [1]
    tables = _tables(db)
    assert BASELINE_TABLES <= tables
    assert "schema_migrations" in tables
    # The is_ignored column from the baseline is present.
    conn = sqlite3.connect(db)
    cols = {r[1] for r in conn.execute("PRAGMA table_info(user_skill_gaps)")}
    conn.close()
    assert "is_ignored" in cols


def test_running_twice_is_a_no_op(tmp_path):
    db = str(tmp_path / "twice.db")
    factory = _sqlite_factory(db)

    first = run_migrations(get_conn=factory, use_postgres=False)
    second = run_migrations(get_conn=factory, use_postgres=False)

    assert first == [1]
    assert second == []  # nothing new applied

    conn = sqlite3.connect(db)
    count = conn.execute("SELECT COUNT(*) FROM schema_migrations").fetchone()[0]
    conn.close()
    assert count == 1  # recorded exactly once


def test_existing_db_with_baseline_tables_adopts_cleanly(tmp_path):
    """Simulates production: tables already exist, no schema_migrations yet."""
    db = str(tmp_path / "existing.db")

    # Pre-create the schema out-of-band and add a data row.
    conn = sqlite3.connect(db)
    conn.executescript(
        (MIGRATIONS_DIR / "001_baseline.sqlite.sql").read_text(encoding="utf-8")
    )
    conn.execute(
        "INSERT INTO scam_reports (job_text, reason) VALUES ('existing', 'data')"
    )
    conn.commit()
    conn.close()

    # Running migrations must not error or destroy data; it records the baseline.
    applied = run_migrations(get_conn=_sqlite_factory(db), use_postgres=False)
    assert applied == [1]

    conn = sqlite3.connect(db)
    rows = conn.execute("SELECT COUNT(*) FROM scam_reports").fetchone()[0]
    recorded = conn.execute("SELECT version FROM schema_migrations").fetchall()
    conn.close()
    assert rows == 1  # existing data preserved
    assert [r[0] for r in recorded] == [1]


def test_non_contiguous_numbering_is_rejected(tmp_path):
    migs = tmp_path / "migs"
    migs.mkdir()
    # 002 with no 001 -> gap -> must raise.
    (migs / "002_orphan.sqlite.sql").write_text(
        "CREATE TABLE IF NOT EXISTS orphan (id INTEGER);", encoding="utf-8"
    )
    with pytest.raises(RuntimeError, match="contiguous"):
        run_migrations(
            get_conn=_sqlite_factory(str(tmp_path / "x.db")),
            use_postgres=False,
            migrations_dir=migs,
        )


def test_duplicate_version_is_rejected(tmp_path):
    migs = tmp_path / "migs"
    migs.mkdir()
    (migs / "001_a.sqlite.sql").write_text("CREATE TABLE IF NOT EXISTS a (id INT);", encoding="utf-8")
    (migs / "001_b.sqlite.sql").write_text("CREATE TABLE IF NOT EXISTS b (id INT);", encoding="utf-8")
    with pytest.raises(RuntimeError, match="[Dd]uplicate"):
        discover_migrations(migs, "sqlite")
