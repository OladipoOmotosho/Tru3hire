import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# List of tables to migrate in order (parents first, children second)
TABLES = [
    "scam_reports",
    "analysis_history",
    "user_skill_gaps",
    "company_response_stats",
    "user_applications",     # Depends on nothing (company_name is loose text, but ideally comes after company_stats if FK existed)
    "application_outcomes"   # Depends on user_applications
]

def get_connection(url):
    try:
        conn = psycopg2.connect(url)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

def fetch_data(conn, table):
    """Fetch all data from a table."""
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        cur.close()
        return rows
    except Exception as e:
        logger.error(f"Error fetching data from {table}: {e}")
        return []

def insert_data(conn, table, rows):
    """Insert data into the destination table."""
    if not rows:
        return
    
    try:
        cur = conn.cursor()
        
        # Get columns from the first row
        columns = rows[0].keys()
        cols_str = ', '.join(columns)
        vals_str = ', '.join(['%s'] * len(columns))
        
        query = f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING"
        
        # Helper to convert dict values to tuple for execute_many
        data_tuples = [tuple(row[col] for col in columns) for row in rows]
        
        # Execute batch insert
        # Note: explicit loop for better error handling on individual rows if needed, 
        # but executemany is faster. ON CONFLICT DO NOTHING handles duplicates.
        cur.executemany(query, data_tuples)
        
        conn.commit()
        logger.info(f"✅ Migrated {len(rows)} rows to {table}")
        cur.close()
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting data into {table}: {e}")

def migrate(source_url, dest_url):
    logger.info("Connecting to source database...")
    source_conn = get_connection(source_url)
    if not source_conn:
        return

    logger.info("Connecting to destination database...")
    dest_conn = get_connection(dest_url)
    if not dest_conn:
        source_conn.close()
        return

    try:
        for table in TABLES:
            logger.info(f"Fetching data from {table}...")
            rows = fetch_data(source_conn, table)
            
            if rows:
                logger.info(f"Found {len(rows)} rows in {table}. Inserting into destination...")
                insert_data(dest_conn, table, rows)
            else:
                logger.info(f"No data found in {table}. Skipping.")
                
    except Exception as e:
        logger.error(f"Migration failed: {e}")
    finally:
        source_conn.close()
        dest_conn.close()
        logger.info("Migration connection closed.")

if __name__ == "__main__":
    print("--- Database Migration Script ---")
    print("Migrating data from SOURCE to DESTINATION")
    
    # You can pass URLs as args or set them here interactively
    if len(sys.argv) == 3:
        source = sys.argv[1]
        dest = sys.argv[2]
    else:
        source = input("Enter SOURCE Database URL (Render): ").strip()
        dest = input("Enter DESTINATION Database URL (Supabase): ").strip()
    
    if not source or not dest:
        print("❌ Error: Both URLs are required.")
    else:
        migrate(source, dest)
