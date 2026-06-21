-- 002 analytics_events (SQLite)
-- Mirror of the PostgreSQL analytics_events table. Count-only, no PII.

CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    anon_bucket TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_time
    ON analytics_events(event_type, occurred_at);
