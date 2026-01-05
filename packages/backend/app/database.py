"""
Database Setup - SQLite for MVP

This module provides a simple SQLite database for storing:
- Scam reports submitted by users
- (Future) Analysis history for logged-in users

SQLite is file-based, so no external database setup is needed!
"""

import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional
import json

# =============================================================================
# Database Configuration
# =============================================================================

# Database file location (in the app directory)
DB_PATH = Path(__file__).parent / "data" / "truehire.db"


def get_db_connection():
    """Get a database connection with row factory for dict-like access."""
    # Ensure data directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn


def init_database():
    """
    Initialize the database schema.
    Called on application startup.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create scam_reports table
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
    
    # Create analysis_history table (for future use with user accounts)
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
    
    # Create user_skill_gaps table
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
    print(f"✅ Database initialized at: {DB_PATH}")


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
    cursor = conn.cursor()
    
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
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM scam_reports")
    count = cursor.fetchone()[0]
    
    conn.close()
    return count


def get_recent_reports(limit: int = 10) -> list:
    """Get recent scam reports (for admin review)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
# Analysis History CRUD (Future use)
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
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO analysis_history (job_text, job_url, true_score, risk_level, breakdown_json, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (job_text, job_url, true_score, risk_level, json.dumps(breakdown), user_id))
        
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
    cursor = conn.cursor()
    
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
        del item['breakdown_json']
        history.append(item)
    
    return history


def get_user_stats(user_id: Optional[str] = None) -> dict:
    """
    Get aggregated stats for a user's analysis history.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
    
    return {
        "total_analyses": row["total_analyses"] or 0,
        "avg_score": round(row["avg_score"] or 0),
        "danger_count": row["danger_count"] or 0,
        "safe_count": row["safe_count"] or 0,
    }


def get_analysis_by_id(analysis_id: int) -> Optional[dict]:
    """Get a single analysis by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
        sqlite3.Error: If database operation fails
    """
    if not user_id or not user_id.strip():
        raise ValueError("user_id cannot be empty")
    
    if not skills:
        return  # No skills to save, exit gracefully
        
    if not isinstance(skills, (list, tuple)):
        raise ValueError(f"skills must be a list, got {type(skills)}")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
                cursor.execute("""
                    INSERT INTO user_skill_gaps (user_id, skill, count, last_seen)
                    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, skill) 
                    DO UPDATE SET 
                        count = count + 1,
                        last_seen = CURRENT_TIMESTAMP
                """, (user_id, skill_normalized))
                saved_count += 1
            except sqlite3.IntegrityError as e:
                # Skip individual skill errors, log and continue
                print(f"⚠️ Skipped skill '{skill_normalized}': {e}")
                continue
            except Exception as e:
                # Skip individual skill errors, log and continue
                print(f"⚠️ Error saving skill '{skill_normalized}': {e}")
                continue
            
        conn.commit()
        if saved_count > 0:
            print(f"✅ Updated {saved_count} skill gaps for user {user_id}")
    except sqlite3.Error as e:
        conn.rollback()
        error_msg = f"Database error saving skill gaps for user {user_id}: {e}"
        print(f"❌ {error_msg}")
        raise sqlite3.Error(error_msg) from e
    except Exception as e:
        conn.rollback()
        error_msg = f"Unexpected error saving skill gaps for user {user_id}: {e}"
        print(f"❌ {error_msg}")
        raise RuntimeError(error_msg) from e
    finally:
        conn.close()


def get_user_skill_gaps(user_id: str, limit: int = 5) -> list:
    """
    Get top missing skills for a user by frequency.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
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
