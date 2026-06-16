"""
Script to populate the company database with additional companies.

This script can be used to:
1. Import companies from a text file (one per line)
2. Import companies from CSV
3. Add companies programmatically

Usage:
    python -m scripts.populate_companies
    python -m scripts.populate_companies --file companies.txt
    python -m scripts.populate_companies --csv companies.csv
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.company_db import get_company_db, CompanyStatus


def main():
    parser = argparse.ArgumentParser(description="Populate company database")
    parser.add_argument(
        "--file",
        type=str,
        help="Path to text file with company names (one per line)"
    )
    parser.add_argument(
        "--csv",
        type=str,
        help="Path to CSV file (first column should be company names)"
    )
    parser.add_argument(
        "--status",
        type=str,
        default="verified_legit",
        choices=["verified_legit", "likely_legit", "unknown", "suspicious", "known_scam"],
        help="Status to assign to imported companies"
    )
    parser.add_argument(
        "--source",
        type=str,
        default="script_import",
        help="Source identifier for the import"
    )
    
    args = parser.parse_args()
    
    db = get_company_db()
    
    # Convert status string to enum
    status_map = {
        "verified_legit": CompanyStatus.VERIFIED_LEGIT,
        "likely_legit": CompanyStatus.LIKELY_LEGIT,
        "unknown": CompanyStatus.UNKNOWN,
        "suspicious": CompanyStatus.SUSPICIOUS,
        "known_scam": CompanyStatus.KNOWN_SCAM,
    }
    status = status_map[args.status]
    
    companies = []
    
    if args.file:
        # Read from text file
        with open(args.file, 'r', encoding='utf-8') as f:
            companies = [line.strip() for line in f if line.strip()]
        print(f"📄 Loaded {len(companies)} companies from {args.file}")
    
    elif args.csv:
        # Read from CSV
        import csv
        with open(args.csv, 'r', encoding='utf-8') as f:
            csv_reader = csv.reader(f)
            companies = [row[0].strip() for row in csv_reader if row and row[0].strip()]
        print(f"📊 Loaded {len(companies)} companies from {args.csv}")
    
    else:
        # Show current stats
        stats = db.get_stats()
        print("📊 Current Company Database Statistics:")
        print(f"   Total companies: {stats['total_companies']}")
        print(f"   By status: {stats['by_status']}")
        print(f"   Fuzzy matching: {'Enabled' if stats['fuzzy_matching_enabled'] else 'Disabled'}")
        print("\n💡 To import companies, use:")
        print("   python -m scripts.populate_companies --file companies.txt")
        print("   python -m scripts.populate_companies --csv companies.csv")
        return
    
    if not companies:
        print("❌ No companies found to import")
        return
    
    # Import companies
    print(f"\n🔄 Importing {len(companies)} companies...")
    result = db.bulk_import_companies(
        companies=companies,
        status=status,
        source=args.source,
        notes="Imported via populate_companies script"
    )
    
    print("\n✅ Import complete!")
    print(f"   ✅ Imported: {result['imported']} new companies")
    print(f"   ⏭️  Skipped: {result['skipped']} duplicates")
    print(f"   📊 Total processed: {result['total_processed']}")
    
    # Show updated stats
    stats = db.get_stats()
    print("\n📊 Updated Database Statistics:")
    print(f"   Total companies: {stats['total_companies']}")
    print(f"   By status: {stats['by_status']}")


if __name__ == "__main__":
    main()

