"""
Database Setup - PostgreSQL for production, SQLite for local development

This module provides database connectivity for storing:
- Scam reports submitted by users
- Analysis history for logged-in users
- User skill gaps

Uses PostgreSQL when DATABASE_URL is set (production/Render.com),
falls back to SQLite for local development.
"""

import os
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional
import json

# =============================================================================
# Database Configuration
# =============================================================================

# Check for PostgreSQL connection string (production)
DATABASE_URL = os.environ.get("DATABASE_URL")

# SQLite fallback path (for local development)
DB_PATH = Path(__file__).parent / "data" / "truehire.db"

# Flag to track which database we're using
USE_POSTGRES = DATABASE_URL is not None

if USE_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    print(f"✅ Using PostgreSQL database")
else:
    print(f"ℹ️ No DATABASE_URL found, using SQLite at: {DB_PATH}")


def get_db_connection():
    """Get a database connection with row factory for dict-like access."""
    if USE_POSTGRES:
        # Parse the connection string and connect to PostgreSQL
        # Add timeout to prevent hanging during startup
        try:
            conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
            return conn
        except Exception as e:
            print(f"❌ Failed to connect to PostgreSQL: {e}")
            raise
    else:
        # SQLite fallback for local development
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row  # Access columns by name
        return conn


def get_cursor(conn):
    """Get a cursor that returns dict-like rows."""
    if USE_POSTGRES:
        return conn.cursor(cursor_factory=RealDictCursor)
    else:
        return conn.cursor()


def init_database():
    """
    Initialize the database schema.
    Called on application startup.
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        # PostgreSQL schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scam_reports (
                id SERIAL PRIMARY KEY,
                job_url TEXT,
                job_text TEXT NOT NULL,
                reason TEXT NOT NULL,
                email TEXT,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending'
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id SERIAL PRIMARY KEY,
                job_text TEXT NOT NULL,
                job_url TEXT,
                true_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                breakdown_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_skill_gaps (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                skill TEXT NOT NULL,
                count INTEGER DEFAULT 1,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, skill)
            )
        """)
        
        # Create index for faster user_id lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis_history(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_skill_gaps_user_id ON user_skill_gaps(user_id)
        """)
        
        # =====================================================================
        # Phase 2: Application Feedback Loop Tables
        # =====================================================================
        
        # Track job applications
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_applications (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_id TEXT,
                job_title TEXT NOT NULL,
                company_name TEXT NOT NULL,
                job_url TEXT,
                true_score_at_apply INTEGER,
                job_age_days INTEGER,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Track outcomes (feedback from users)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS application_outcomes (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES user_applications(id) ON DELETE CASCADE,
                outcome TEXT NOT NULL CHECK (outcome IN ('no_response', 'rejected', 'interview', 'offer')),
                days_to_response INTEGER,
                notes TEXT,
                reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Aggregated company stats (auto-updated)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS company_response_stats (
                company_name TEXT PRIMARY KEY,
                total_applications INTEGER DEFAULT 0,
                total_responses INTEGER DEFAULT 0,
                total_interviews INTEGER DEFAULT 0,
                total_offers INTEGER DEFAULT 0,
                avg_response_days FLOAT,
                response_rate FLOAT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Indexes for Phase 2 tables
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_applications_user_id ON user_applications(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_applications_company ON user_applications(company_name)
        """)

        # MIGRATION: Ensure is_ignored column exists (for existing Postgres databases)
        try:
            cursor.execute("""
                ALTER TABLE user_skill_gaps 
                ADD COLUMN IF NOT EXISTS is_ignored BOOLEAN DEFAULT FALSE
            """)
            print("✅ Postgres Migration: Verified is_ignored column in user_skill_gaps")
        except Exception as e:
            conn.rollback()
            # Only ignore if the column actually exists which "IF NOT EXISTS" handles,
            # but if something else failed, we must know.
            # If the user insists on ignoring "column already exists", we check the message.
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                 print(f"ℹ️ Postgres Migration: Column already exists")
            else:
                 print(f"❌ Postgres Migration Failed: {e}")
                 raise e
        
    else:
        # SQLite schema (original)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scam_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_url TEXT,
                job_text TEXT NOT NULL,
                reason TEXT NOT NULL,
                email TEXT,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending'
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_text TEXT NOT NULL,
                job_url TEXT,
                true_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                breakdown_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_skill_gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                skill TEXT NOT NULL,
                count INTEGER DEFAULT 1,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, skill)
            )
        """)

        # MIGRATION: Ensure user_id column exists (for existing databases)
        try:
            cursor.execute("ALTER TABLE analysis_history ADD COLUMN user_id TEXT")
            print("✅ Migrated: Added user_id column to analysis_history")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE user_skill_gaps ADD COLUMN is_ignored BOOLEAN DEFAULT 0")
            print("✅ Migrated: Added is_ignored column to user_skill_gaps")
        except sqlite3.OperationalError:
            pass
    
    conn.commit()
    conn.close()
    db_type = "PostgreSQL" if USE_POSTGRES else f"SQLite at {DB_PATH}"
    print(f"✅ Database initialized: {db_type}")


# =============================================================================
# Scam Reports CRUD
# =============================================================================

def create_scam_report(
    job_text: str,
    reason: str,
    job_url: Optional[str] = None,
    email: Optional[str] = None,
    ip_address: Optional[str] = None
) -> int:
    """
    Create a new scam report.
    
    Returns:
        The ID of the created report
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            INSERT INTO scam_reports (job_url, job_text, reason, email, ip_address)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (job_url, job_text, reason, email, ip_address))
        report_id = cursor.fetchone()['id']
    else:
        cursor.execute("""
            INSERT INTO scam_reports (job_url, job_text, reason, email, ip_address)
            VALUES (?, ?, ?, ?, ?)
        """, (job_url, job_text, reason, email, ip_address))
        report_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return report_id


def get_scam_report_count() -> int:
    """Get total number of scam reports."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    cursor.execute("SELECT COUNT(*) as count FROM scam_reports")
    row = cursor.fetchone()
    count = row['count'] if USE_POSTGRES else row[0]
    
    conn.close()
    return count


def get_recent_reports(limit: int = 10) -> list:
    """Get recent scam reports (for admin review)."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT id, job_url, job_text, reason, email, created_at, status
            FROM scam_reports
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
    else:
        cursor.execute("""
            SELECT id, job_url, job_text, reason, email, created_at, status
            FROM scam_reports
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
    
    reports = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return reports


# =============================================================================
# Analysis History CRUD
# =============================================================================

def save_analysis(
    job_text: str,
    true_score: int,
    risk_level: str,
    breakdown: dict,
    job_url: Optional[str] = None,
    user_id: Optional[str] = None
) -> int:
    """Save an analysis to history."""
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)
        
        breakdown_json = json.dumps(breakdown)
        
        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO analysis_history (job_text, job_url, true_score, risk_level, breakdown_json, user_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (job_text, job_url, true_score, risk_level, breakdown_json, user_id))
            analysis_id = cursor.fetchone()['id']
        else:
            cursor.execute("""
                INSERT INTO analysis_history (job_text, job_url, true_score, risk_level, breakdown_json, user_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (job_text, job_url, true_score, risk_level, breakdown_json, user_id))
            analysis_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        print(f"✅ Saved analysis {analysis_id} for user {user_id}")
        return analysis_id
    except Exception as e:
        print(f"❌ Database Save Error: {e}")
        raise e


def get_user_history(user_id: Optional[str] = None, limit: int = 20) -> list:
    """
    Get analysis history for a user.
    If no user_id provided, returns all anonymous analyses.
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        if user_id:
            cursor.execute("""
                SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at
                FROM analysis_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, limit))
        else:
            cursor.execute("""
                SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at
                FROM analysis_history
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
    else:
        if user_id:
            cursor.execute("""
                SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at
                FROM analysis_history
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit))
        else:
            cursor.execute("""
                SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at
                FROM analysis_history
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to list of dicts with parsed breakdown
    history = []
    for row in rows:
        item = dict(row)
        if item.get('breakdown_json'):
            try:
                item['breakdown'] = json.loads(item['breakdown_json'])
            except json.JSONDecodeError:
                item['breakdown'] = {}
        if 'breakdown_json' in item:
            del item['breakdown_json']
        history.append(item)
    
    return history


def get_user_stats(user_id: Optional[str] = None) -> dict:
    """
    Get aggregated stats for a user's analysis history.
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        if user_id:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_analyses,
                    COALESCE(AVG(true_score), 0) as avg_score,
                    COALESCE(SUM(CASE WHEN risk_level = 'danger' THEN 1 ELSE 0 END), 0) as danger_count,
                    COALESCE(SUM(CASE WHEN risk_level = 'safe' THEN 1 ELSE 0 END), 0) as safe_count
                FROM analysis_history
                WHERE user_id = %s
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_analyses,
                    COALESCE(AVG(true_score), 0) as avg_score,
                    COALESCE(SUM(CASE WHEN risk_level = 'danger' THEN 1 ELSE 0 END), 0) as danger_count,
                    COALESCE(SUM(CASE WHEN risk_level = 'safe' THEN 1 ELSE 0 END), 0) as safe_count
                FROM analysis_history
            """)
    else:
        if user_id:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_analyses,
                    COALESCE(AVG(true_score), 0) as avg_score,
                    COALESCE(SUM(CASE WHEN risk_level = 'danger' THEN 1 ELSE 0 END), 0) as danger_count,
                    COALESCE(SUM(CASE WHEN risk_level = 'safe' THEN 1 ELSE 0 END), 0) as safe_count
                FROM analysis_history
                WHERE user_id = ?
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_analyses,
                    COALESCE(AVG(true_score), 0) as avg_score,
                    COALESCE(SUM(CASE WHEN risk_level = 'danger' THEN 1 ELSE 0 END), 0) as danger_count,
                    COALESCE(SUM(CASE WHEN risk_level = 'safe' THEN 1 ELSE 0 END), 0) as safe_count
                FROM analysis_history
            """)
    
    row = cursor.fetchone()
    conn.close()
    
    if USE_POSTGRES:
        return {
            "total_analyses": row["total_analyses"] or 0,
            "avg_score": round(float(row["avg_score"]) if row["avg_score"] else 0),
            "danger_count": row["danger_count"] or 0,
            "safe_count": row["safe_count"] or 0,
        }
    else:
        return {
            "total_analyses": row["total_analyses"] or 0,
            "avg_score": round(row["avg_score"] or 0),
            "danger_count": row["danger_count"] or 0,
            "safe_count": row["safe_count"] or 0,
        }


def get_analysis_by_id(analysis_id: int) -> Optional[dict]:
    """Get a single analysis by ID."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at, user_id
            FROM analysis_history
            WHERE id = %s
        """, (analysis_id,))
    else:
        cursor.execute("""
            SELECT id, job_text, job_url, true_score, risk_level, breakdown_json, created_at, user_id
            FROM analysis_history
            WHERE id = ?
        """, (analysis_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    item = dict(row)
    if item.get('breakdown_json'):
        try:
            item['breakdown'] = json.loads(item['breakdown_json'])
        except json.JSONDecodeError:
            item['breakdown'] = {}
    if 'breakdown_json' in item:
        del item['breakdown_json']
    
    return item


# =============================================================================
# Skills Gap CRUD
# =============================================================================

def save_user_skill_gaps(user_id: str, skills: list) -> None:
    """
    Update skill gaps for a user.
    Increments count if skill already exists.
    
    Args:
        user_id: The user ID
        skills: List of skill names (strings)
        
    Raises:
        ValueError: If user_id is empty or skills list is invalid
    """
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    if not skills:
        return  # No skills to save, exit gracefully
        
    if not isinstance(skills, (list, tuple)):
        raise ValueError(f"skills must be a list, got {type(skills)}")
        
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    saved_count = 0
    try:
        for skill in skills:
            if not skill:
                continue
                
            # Normalize skill: strip whitespace and convert to lowercase
            skill_normalized = str(skill).strip().lower()
            
            # Skip empty or invalid skills
            if not skill_normalized or len(skill_normalized) < 2:
                continue
            
            # Limit skill length to prevent database issues
            if len(skill_normalized) > 100:
                skill_normalized = skill_normalized[:100]
                
            try:
                if USE_POSTGRES:
                    cursor.execute("""
                        INSERT INTO user_skill_gaps (user_id, skill, count, last_seen)
                        VALUES (%s, %s, 1, CURRENT_TIMESTAMP)
                        ON CONFLICT(user_id, skill) 
                        DO UPDATE SET 
                            count = user_skill_gaps.count + 1,
                            last_seen = CURRENT_TIMESTAMP
                    """, (user_id, skill_normalized))
                else:
                    cursor.execute("""
                        INSERT INTO user_skill_gaps (user_id, skill, count, last_seen)
                        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
                        ON CONFLICT(user_id, skill) 
                        DO UPDATE SET 
                            count = count + 1,
                            last_seen = CURRENT_TIMESTAMP
                    """, (user_id, skill_normalized))
                saved_count += 1
            except (sqlite3.IntegrityError, Exception) as e:
                # Skip individual skill errors, log and continue
                print(f"⚠️ Skipped skill '{skill_normalized}': {e}")
                continue
            
        conn.commit()
        if saved_count > 0:
            print(f"✅ Updated {saved_count} skill gaps for user {user_id}")
    except Exception as e:
        conn.rollback()
        error_msg = f"Database error saving skill gaps for user {user_id}: {e}"
        print(f"❌ {error_msg}")
        raise RuntimeError(error_msg) from e
    finally:
        conn.close()



def get_user_skill_gaps(user_id: str, limit: int = 5) -> list:
    """
    Get top missing skills for a user by frequency, excluding ignored skills.
    """
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn)
    except Exception as e:
        # print(f"❌ Database Connection Error: {e}")
        raise

    query = """
        SELECT skill, count, last_seen
        FROM user_skill_gaps
        WHERE user_id = %s AND (is_ignored IS NULL OR is_ignored = FALSE)
        ORDER BY count DESC, last_seen DESC
        LIMIT %s
    """ if USE_POSTGRES else """
        SELECT skill, count, last_seen
        FROM user_skill_gaps
        WHERE user_id = ? AND (is_ignored IS NULL OR is_ignored = 0)
        ORDER BY count DESC, last_seen DESC
        LIMIT ?
    """
    
    
    # Fallback query without is_ignored column (for backward compatibility)
    fallback_query = """
        SELECT skill, count, last_seen
        FROM user_skill_gaps
        WHERE user_id = %s
        ORDER BY count DESC, last_seen DESC
        LIMIT %s
    """ if USE_POSTGRES else """
        SELECT skill, count, last_seen
        FROM user_skill_gaps
        WHERE user_id = ?
        ORDER BY count DESC, last_seen DESC
        LIMIT ?
    """

    try:
        # Check if is_ignored column exists before querying (migration safety)
        try:
            cursor.execute(query, (user_id, limit))
        except (sqlite3.OperationalError, Exception):
            # Query failed (likely schema mismatch), try fallback
            conn.rollback() # Important for Postgres transaction state
            cursor.execute(fallback_query, (user_id, limit))
            
        rows = [dict(row) for row in cursor.fetchall()]
        return rows
            
    except Exception as e:
        # Propagate unexpected errors
        raise e
    finally:
        conn.close()


def ignore_user_skill_gap(user_id: str, skill: str) -> bool:
    """
    Mark a skill gap as ignored for a user.
    """
    if not user_id or not user_id.strip():
        return False

    if not skill:
        return False
        
    skill_normalized = skill.strip().lower()
    
    if not skill_normalized:
        return False

    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    try:
        if USE_POSTGRES:
            cursor.execute("""
                UPDATE user_skill_gaps 
                SET is_ignored = TRUE 
                WHERE user_id = %s AND skill = %s
            """, (user_id, skill_normalized))
        else:
            cursor.execute("""
                UPDATE user_skill_gaps 
                SET is_ignored = 1
                WHERE user_id = ? AND skill = ?
            """, (user_id, skill_normalized))
        
        if cursor.rowcount == 0:
            # Maybe it doesn't exist yet, insert it as ignored
            if USE_POSTGRES:
                cursor.execute("""
                    INSERT INTO user_skill_gaps (user_id, skill, count, last_seen, is_ignored)
                    VALUES (%s, %s, 1, CURRENT_TIMESTAMP, TRUE)
                    ON CONFLICT(user_id, skill) DO UPDATE SET is_ignored = TRUE
                """, (user_id, skill_normalized))
            else:
                cursor.execute("""
                    INSERT INTO user_skill_gaps (user_id, skill, count, last_seen, is_ignored)
                    VALUES (?, ?, 1, CURRENT_TIMESTAMP, 1)
                    ON CONFLICT(user_id, skill) DO UPDATE SET is_ignored = 1
                """, (user_id, skill_normalized))
        
        conn.commit()
        return True
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        try:
            cursor.close()
        except Exception:
            pass
        print(f"❌ Failed to ignore skill: {e}")
        return False
    finally:
        conn.close()


# =============================================================================
# Phase 2: Application Tracking CRUD
# =============================================================================

def check_duplicate_application(user_id: str, job_id: Optional[str] = None, job_url: Optional[str] = None) -> bool:
    """
    Check if user already has an application for this job.
    Matches on (user_id, job_id) if job_id provided, else (user_id, job_url) if job_url provided.
    """
    if not job_id and not job_url:
        return False

    conn = get_db_connection()
    cursor = get_cursor(conn)

    if USE_POSTGRES:
        if job_id:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = %s AND job_id = %s LIMIT 1",
                (user_id, job_id),
            )
        elif job_url is None:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = %s AND job_url IS NULL LIMIT 1",
                (user_id,),
            )
        else:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = %s AND job_url = %s LIMIT 1",
                (user_id, job_url),
            )
    else:
        if job_id:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = ? AND job_id = ? LIMIT 1",
                (user_id, job_id),
            )
        elif job_url is None:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = ? AND job_url IS NULL LIMIT 1",
                (user_id,),
            )
        else:
            cursor.execute(
                "SELECT 1 FROM user_applications WHERE user_id = ? AND job_url = ? LIMIT 1",
                (user_id, job_url),
            )

    row = cursor.fetchone()
    conn.close()
    return row is not None


def save_application(
    user_id: str,
    job_title: str,
    company_name: str,
    job_id: Optional[str] = None,
    job_url: Optional[str] = None,
    true_score_at_apply: Optional[int] = None,
    job_age_days: Optional[int] = None,
) -> int:
    """
    Save a new job application for tracking.
    
    Returns:
        The ID of the created application
        
    Raises:
        Exception: If database operation fails (connection is still closed)
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    app_id = None
    
    try:
        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO user_applications 
                (user_id, job_id, job_title, company_name, job_url, true_score_at_apply, job_age_days)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, job_id, job_title, company_name, job_url, true_score_at_apply, job_age_days))
            app_id = cursor.fetchone()['id']
        else:
            cursor.execute("""
                INSERT INTO user_applications 
                (user_id, job_id, job_title, company_name, job_url, true_score_at_apply, job_age_days)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, job_id, job_title, company_name, job_url, true_score_at_apply, job_age_days))
            app_id = cursor.lastrowid
        
        # Update company stats
        _update_company_stats_on_apply(cursor, company_name)
        
        conn.commit()
        print(f"✅ Saved application {app_id} for user {user_id} at {company_name}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Failed to save application: {e}")
        raise
    finally:
        conn.close()
    
    return app_id


def get_user_applications(user_id: str, limit: int = 50) -> list:
    """Get all applications for a user."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT ua.*, ao.outcome, ao.days_to_response, ao.reported_at as outcome_reported_at
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            AND ao.id = (
                SELECT MAX(id) FROM application_outcomes WHERE application_id = ua.id
            )
            WHERE ua.user_id = %s
            ORDER BY ua.applied_at DESC
            LIMIT %s
        """, (user_id, limit))
    else:
        cursor.execute("""
            SELECT ua.*, ao.outcome, ao.days_to_response, ao.reported_at as outcome_reported_at
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            AND ao.id = (
                SELECT MAX(id) FROM application_outcomes WHERE application_id = ua.id
            )
            WHERE ua.user_id = ?
            ORDER BY ua.applied_at DESC
            LIMIT ?
        """, (user_id, limit))
    
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return rows


def get_pending_feedback(user_id: str, days_threshold: int = 7) -> list:
    """
    Get applications that are awaiting feedback (applied > X days ago, no outcome).
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT ua.*
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            WHERE ua.user_id = %s
              AND ao.id IS NULL
              AND ua.applied_at < NOW() - make_interval(days => %s)
            ORDER BY ua.applied_at ASC
        """, (user_id, days_threshold))
    else:
        cursor.execute("""
            SELECT ua.*
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            WHERE ua.user_id = ? 
              AND ao.id IS NULL
              AND ua.applied_at < datetime('now', '-' || ? || ' days')
            ORDER BY ua.applied_at ASC
        """, (user_id, days_threshold))
    
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return rows


def save_application_outcome(
    application_id: int,
    outcome: str,
    days_to_response: Optional[int] = None,
    notes: Optional[str] = None,
) -> int:
    """
    Record the outcome of an application.
    
    Args:
        outcome: One of 'no_response', 'rejected', 'interview', 'offer'
    """
    valid_outcomes = ['no_response', 'rejected', 'interview', 'offer']
    if outcome not in valid_outcomes:
        raise ValueError(f"Invalid outcome. Must be one of: {valid_outcomes}")
    
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            INSERT INTO application_outcomes (application_id, outcome, days_to_response, notes)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (application_id, outcome, days_to_response, notes))
        outcome_id = cursor.fetchone()['id']
        
        # Get company name for stats update
        cursor.execute("SELECT company_name FROM user_applications WHERE id = %s", (application_id,))
    else:
        cursor.execute("""
            INSERT INTO application_outcomes (application_id, outcome, days_to_response, notes)
            VALUES (?, ?, ?, ?)
        """, (application_id, outcome, days_to_response, notes))
        outcome_id = cursor.lastrowid
        
        cursor.execute("SELECT company_name FROM user_applications WHERE id = ?", (application_id,))
    
    row = cursor.fetchone()
    if row:
        company_name = row['company_name'] if USE_POSTGRES else row[0]
        _update_company_stats_on_outcome(cursor, company_name, outcome, days_to_response)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Recorded outcome '{outcome}' for application {application_id}")
    return outcome_id


def get_company_stats(company_name: str) -> Optional[dict]:
    """Get response statistics for a company."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT * FROM company_response_stats WHERE company_name = %s
        """, (company_name,))
    else:
        cursor.execute("""
            SELECT * FROM company_response_stats WHERE company_name = ?
        """, (company_name,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None


def _update_company_stats_on_apply(cursor, company_name: str):
    """Increment application count for a company."""
    if USE_POSTGRES:
        cursor.execute("""
            INSERT INTO company_response_stats (company_name, total_applications)
            VALUES (%s, 1)
            ON CONFLICT(company_name) 
            DO UPDATE SET 
                total_applications = company_response_stats.total_applications + 1,
                last_updated = CURRENT_TIMESTAMP
        """, (company_name,))
    else:
        cursor.execute("""
            INSERT INTO company_response_stats (company_name, total_applications)
            VALUES (?, 1)
            ON CONFLICT(company_name) 
            DO UPDATE SET 
                total_applications = total_applications + 1,
                last_updated = CURRENT_TIMESTAMP
        """, (company_name,))


def _update_company_stats_on_outcome(cursor, company_name: str, outcome: str, days_to_response: Optional[int]):
    """Update company stats when an outcome is recorded."""
    # Determine which counters to increment
    response_increment = 1 if outcome != 'no_response' else 0
    interview_increment = 1 if outcome in ['interview', 'offer'] else 0
    offer_increment = 1 if outcome == 'offer' else 0
    
    if USE_POSTGRES:
        # Update response rate calculation
        cursor.execute("""
            UPDATE company_response_stats
            SET 
                total_responses = total_responses + %s,
                total_interviews = total_interviews + %s,
                total_offers = total_offers + %s,
                response_rate = CASE 
                    WHEN total_applications > 0 
                    THEN (total_responses + %s)::float / total_applications 
                    ELSE 0 
                END,
                avg_response_days = CASE
                    WHEN %s IS NOT NULL THEN
                        CASE
                            WHEN total_responses = 0 THEN %s
                            ELSE (COALESCE(avg_response_days, 0) * total_responses + %s) / (total_responses + 1)
                        END
                    ELSE avg_response_days
                END,
                last_updated = CURRENT_TIMESTAMP
            WHERE company_name = %s
        """, (response_increment, interview_increment, offer_increment, 
              response_increment, days_to_response, days_to_response, days_to_response, company_name))
    else:
        cursor.execute("""
            UPDATE company_response_stats
            SET 
                total_responses = total_responses + ?,
                total_interviews = total_interviews + ?,
                total_offers = total_offers + ?,
                response_rate = CASE 
                    WHEN total_applications > 0 
                    THEN CAST((total_responses + ?) AS FLOAT) / total_applications 
                    ELSE 0 
                END,
                avg_response_days = CASE
                    WHEN ? IS NOT NULL THEN
                        CASE
                            WHEN total_responses = 0 THEN ?
                            ELSE (COALESCE(avg_response_days, 0) * total_responses + ?) / (total_responses + 1)
                        END
                    ELSE avg_response_days
                END,
                last_updated = CURRENT_TIMESTAMP
            WHERE company_name = ?
        """, (response_increment, interview_increment, offer_increment, response_increment, days_to_response, days_to_response, days_to_response, company_name))


def get_user_application_stats(user_id: str) -> dict:
    """Get aggregated application stats for a user."""
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_applications,
                SUM(CASE WHEN ao.outcome IS NOT NULL THEN 1 ELSE 0 END) as tracked_outcomes,
                SUM(CASE WHEN ao.outcome = 'no_response' THEN 1 ELSE 0 END) as no_response,
                SUM(CASE WHEN ao.outcome = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN ao.outcome = 'interview' THEN 1 ELSE 0 END) as interviews,
                SUM(CASE WHEN ao.outcome = 'offer' THEN 1 ELSE 0 END) as offers,
                AVG(ao.days_to_response) as avg_days_to_response,
                AVG(ua.true_score_at_apply) as avg_truescore_applied
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            WHERE ua.user_id = %s
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_applications,
                SUM(CASE WHEN ao.outcome IS NOT NULL THEN 1 ELSE 0 END) as tracked_outcomes,
                SUM(CASE WHEN ao.outcome = 'no_response' THEN 1 ELSE 0 END) as no_response,
                SUM(CASE WHEN ao.outcome = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN ao.outcome = 'interview' THEN 1 ELSE 0 END) as interviews,
                SUM(CASE WHEN ao.outcome = 'offer' THEN 1 ELSE 0 END) as offers,
                AVG(ao.days_to_response) as avg_days_to_response,
                AVG(ua.true_score_at_apply) as avg_truescore_applied
            FROM user_applications ua
            LEFT JOIN application_outcomes ao ON ua.id = ao.application_id
            WHERE ua.user_id = ?
        """, (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return {}
