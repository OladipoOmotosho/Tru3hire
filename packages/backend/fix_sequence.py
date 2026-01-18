"""
Fix database sequence for analysis_history table.
Run this if you see "duplicate key value violates unique constraint" errors.
"""

from app.database import get_db_connection, USE_POSTGRES

def fix_sequence():
    if not USE_POSTGRES:
        print("SQLite doesn't use sequences - no fix needed")
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Reset the sequence to the max ID + 1
        cursor.execute("""
            SELECT setval(
                pg_get_serial_sequence('analysis_history', 'id'),
                COALESCE((SELECT MAX(id) FROM analysis_history), 0) + 1,
                false
            )
        """)
        conn.commit()
        print("✅ Sequence reset successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_sequence()
