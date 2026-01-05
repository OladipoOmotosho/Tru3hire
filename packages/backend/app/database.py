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
        conn = psycopg2.connect(DATABASE_URL)
        return conn
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
            # Column likely exists
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
    Get top missing skills for a user by frequency.
    """
    conn = get_db_connection()
    cursor = get_cursor(conn)
    
    if USE_POSTGRES:
        cursor.execute("""
            SELECT skill, count, last_seen
            FROM user_skill_gaps
            WHERE user_id = %s
            ORDER BY count DESC, last_seen DESC
            LIMIT %s
        """, (user_id, limit))
    else:
        cursor.execute("""
            SELECT skill, count, last_seen
            FROM user_skill_gaps
            WHERE user_id = ?
            ORDER BY count DESC, last_seen DESC
            LIMIT ?
        """, (user_id, limit))
    
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return rows
