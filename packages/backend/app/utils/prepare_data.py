"""
Data Preparation Script for Fake Job Detection

Reads the raw Kaggle dataset, applies thorough cleaning, and saves
a ready-to-train processed CSV to data/processed/clean_fake_jobs.csv.

Run from repo root:
    python -m packages.backend.app.utils.prepare_data

Or directly:
    python packages/backend/app/utils/prepare_data.py
"""

import re
import html
from pathlib import Path

import pandas as pd

# =========================================================================
# Paths
# =========================================================================

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
RAW_PATH = BACKEND_DIR / "data" / "raw" / "fake_job_postings.csv"
PROCESSED_PATH = BACKEND_DIR / "data" / "processed" / "clean_fake_jobs.csv"

# =========================================================================
# Text cleaning helpers
# =========================================================================

# Kaggle dataset replaces URLs/emails with hashed placeholders
_URL_HASH_RE = re.compile(r"#URL_[a-f0-9]+#", re.IGNORECASE)
_EMAIL_HASH_RE = re.compile(r"#EMAIL_[a-f0-9]+#", re.IGNORECASE)
_PHONE_HASH_RE = re.compile(r"#PHONE_[a-f0-9]+#", re.IGNORECASE)
_WHITESPACE_RE = re.compile(r"\s+")
_NON_WORD_RE = re.compile(r"[^\w\s]")


def clean_text(text: str) -> str:
    """Apply all text-level cleaning to a single string."""
    if not isinstance(text, str):
        return ""

    # Decode HTML entities (e.g. &amp; -> &)
    text = html.unescape(text)

    # Remove hashed URL / email / phone placeholders
    text = _URL_HASH_RE.sub(" ", text)
    text = _EMAIL_HASH_RE.sub(" ", text)
    text = _PHONE_HASH_RE.sub(" ", text)

    # Lowercase
    text = text.lower()

    # Strip non-word characters (keep letters, digits, spaces)
    text = _NON_WORD_RE.sub(" ", text)

    # Collapse whitespace
    text = _WHITESPACE_RE.sub(" ", text).strip()

    return text


# =========================================================================
# Main pipeline
# =========================================================================

# Text columns to merge into a single feature
TEXT_COLUMNS = [
    "title",
    "location",
    "department",
    "company_profile",
    "description",
    "requirements",
    "benefits",
    "industry",
    "function",
]


def prepare() -> pd.DataFrame:
    """Load raw data, clean it, and return the processed DataFrame."""
    print(f"📂 Loading raw data from {RAW_PATH} ...")
    df = pd.read_csv(RAW_PATH)
    print(f"   Raw shape: {df.shape}")
    print(f"   Fraudulent: {df['fraudulent'].sum()} / {len(df)}"
          f"  ({df['fraudulent'].mean() * 100:.1f}%)")

    # ------------------------------------------------------------------
    # Combine text columns into one feature, then clean
    # ------------------------------------------------------------------
    df["text"] = (
        df[TEXT_COLUMNS]
        .fillna("")
        .agg(" ".join, axis=1)
    )
    df["text"] = df["text"].apply(clean_text)

    # Drop rows where the combined text is empty after cleaning
    before = len(df)
    df = df[df["text"].str.len() > 0].reset_index(drop=True)
    dropped = before - len(df)
    if dropped:
        print(f"   ⚠ Dropped {dropped} rows with empty text after cleaning")

    # ------------------------------------------------------------------
    # Keep only the columns needed for training
    # ------------------------------------------------------------------
    clean_df = df[["text", "fraudulent"]].copy()

    print(f"\n✅ Clean shape: {clean_df.shape}")
    print(f"   Label distribution:\n{clean_df['fraudulent'].value_counts().to_string()}")

    return clean_df


def main() -> None:
    clean_df = prepare()

    # Save
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    clean_df.to_csv(PROCESSED_PATH, index=False)
    size_mb = PROCESSED_PATH.stat().st_size / (1024 * 1024)
    print(f"\n💾 Saved to {PROCESSED_PATH}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
