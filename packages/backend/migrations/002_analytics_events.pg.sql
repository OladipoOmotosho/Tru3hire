-- 002 analytics_events (PostgreSQL)
-- Privacy-safe funnel instrumentation: count-only, no PII, no email/job content.
-- `anon_bucket` is an optional opaque token (e.g. a hashed client id) for rough
-- unique-ish counting; it carries no identity and may be null.

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    anon_bucket TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_time
    ON analytics_events(event_type, occurred_at);
