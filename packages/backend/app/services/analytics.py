"""
Privacy-safe funnel analytics.

Count-only: we record *that* an event happened and (optionally) an opaque
anonymous bucket — never PII, never email/job content. `record_event` is
best-effort and must never raise: instrumentation must not break a value path.
"""

import logging
from datetime import datetime
from typing import Optional

from app.database import USE_POSTGRES, get_cursor, get_db_connection

logger = logging.getLogger(__name__)

# The funnel. Anything outside this set is rejected at the API boundary so the
# table can't be filled with arbitrary strings.
ALLOWED_EVENTS = {
    "check_run",         # a job posting was analyzed
    "search_run",        # a job search was performed
    "scam_report",       # a scam was reported
    "result_viewed",     # a result / score was viewed
    "reasons_expanded",  # the "why" reasons were expanded
    "shared",            # a result/report was shared
    "signup",            # an account was created
    "return",            # a returning session
}


def record_event(event_type: str, anon_bucket: Optional[str] = None) -> bool:
    """Best-effort insert of one funnel event. Returns True if stored.

    Never raises — a failure here must not affect the user's request.
    """
    if event_type not in ALLOWED_EVENTS:
        logger.debug("Ignoring unknown analytics event_type: %s", event_type)
        return False
    try:
        conn = get_db_connection()
        try:
            cur = get_cursor(conn)
            if USE_POSTGRES:
                cur.execute(
                    "INSERT INTO analytics_events (event_type, anon_bucket) VALUES (%s, %s)",
                    (event_type, anon_bucket),
                )
            else:
                cur.execute(
                    "INSERT INTO analytics_events (event_type, anon_bucket) VALUES (?, ?)",
                    (event_type, anon_bucket),
                )
            conn.commit()
            return True
        finally:
            conn.close()
    except Exception as e:
        logger.warning("record_event(%s) failed: %s", event_type, e)
        return False


def aggregate_counts(
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    k_anon_floor: int = 1,
) -> dict:
    """Return ``{event_type: count}`` within [since, until].

    Buckets with ``count < k_anon_floor`` are suppressed. Default floor is 1
    (no suppression) for the operator's own internal report; the *public* data
    note must pass ``k_anon_floor=5`` (k-anonymity).
    """
    ph = "%s" if USE_POSTGRES else "?"
    clauses, params = [], []
    if since is not None:
        clauses.append(f"occurred_at >= {ph}")
        params.append(since)
    if until is not None:
        clauses.append(f"occurred_at <= {ph}")
        params.append(until)
    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""

    conn = get_db_connection()
    try:
        cur = get_cursor(conn)
        cur.execute(
            f"SELECT event_type, COUNT(*) AS c FROM analytics_events{where} "
            "GROUP BY event_type",
            tuple(params),
        )
        rows = cur.fetchall()
    finally:
        conn.close()

    out = {}
    for r in rows:
        out[r["event_type"]] = r["c"]
    return {et: c for et, c in out.items() if c >= k_anon_floor}
