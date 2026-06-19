-- 001 baseline (SQLite)
-- Mirror of the PostgreSQL baseline for local development. Idempotent.
-- Includes the Phase 2 application-tracking tables so local dev matches prod.

CREATE TABLE IF NOT EXISTS scam_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_url TEXT,
    job_text TEXT NOT NULL,
    reason TEXT NOT NULL,
    email TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS analysis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_text TEXT NOT NULL,
    job_url TEXT,
    true_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    breakdown_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

CREATE TABLE IF NOT EXISTS user_skill_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_ignored BOOLEAN DEFAULT 0,
    UNIQUE(user_id, skill)
);

CREATE TABLE IF NOT EXISTS user_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    job_id TEXT,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    job_url TEXT,
    true_score_at_apply INTEGER,
    job_age_days INTEGER,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER REFERENCES user_applications(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('no_response', 'rejected', 'interview', 'offer')),
    days_to_response INTEGER,
    notes TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_response_stats (
    company_name TEXT PRIMARY KEY,
    total_applications INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    total_interviews INTEGER DEFAULT 0,
    total_offers INTEGER DEFAULT 0,
    avg_response_days REAL,
    response_rate REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user_id ON user_skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON user_applications(company_name);
