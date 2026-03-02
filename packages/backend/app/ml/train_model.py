"""
Fake Job Detection ML Model Training Script

This script trains a classifier to detect fraudulent job postings
using the pre-cleaned dataset produced by prepare_data.py.

Model: TF-IDF + RandomForest
Target: 95%+ accuracy, 85%+ F1 on fake class
"""

import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path

# ML imports
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    accuracy_score,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.pipeline import Pipeline

# =============================================================================
# Configuration
# =============================================================================

# Get the backend directory (packages/backend)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BACKEND_DIR / "data" / "processed" / "clean_fake_jobs.csv"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "fake_job_classifier.joblib"

# Ensure model directory exists
MODEL_DIR.mkdir(exist_ok=True)

# =============================================================================
# Data Loading
# =============================================================================

def load_and_preprocess_data():
    """Load the pre-cleaned dataset produced by prepare_data.py."""
    print("📂 Loading clean dataset...")
    df = pd.read_csv(DATA_PATH)
    
    # Validate required columns
    required_cols = {'text', 'fraudulent'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(
            f"Dataset missing required columns: {sorted(missing)}. "
            f"Expected columns: {sorted(required_cols)}. Found: {list(df.columns)}"
        )
    
    # Handle NaN values
    df['text'] = df['text'].fillna('')
    df = df.dropna(subset=['fraudulent']).reset_index(drop=True)
    df['fraudulent'] = df['fraudulent'].astype(int)
    
    print(f"   Shape: {df.shape}")
    print(f"   Fake jobs: {df['fraudulent'].sum()} ({df['fraudulent'].mean()*100:.1f}%)")
    
    return df

# =============================================================================
# Model Training
# =============================================================================

def train_model(df):
    """Train the fake job detection model."""
    print("\n🔧 Preparing data...")
    
    X = df['text']
    y = df['fraudulent']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    
    # Create pipeline
    print("\n🚀 Training model...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),  # Use unigrams and bigrams
            min_df=2,
            max_df=0.95,
            stop_words='english'
        )),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            class_weight='balanced',  # Handle class imbalance
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    # Fit model
    pipeline.fit(X_train, y_train)
    
    return pipeline, X_test, y_test

# =============================================================================
# Evaluation
# =============================================================================

def evaluate_model(pipeline, X_test, y_test):
    """Evaluate the trained model."""
    print("\n📊 Evaluating model...")
    
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1_fake = f1_score(y_test, y_pred, pos_label=1)
    precision_fake = precision_score(y_test, y_pred, pos_label=1)
    recall_fake = recall_score(y_test, y_pred, pos_label=1)
    
    print(f"\n   Accuracy: {accuracy*100:.2f}%")
    print(f"   F1 Score (Fake): {f1_fake*100:.2f}%")
    print(f"   Precision (Fake): {precision_fake*100:.2f}%")
    print(f"   Recall (Fake): {recall_fake*100:.2f}%")
    
    print("\n   Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Real', 'Fake']))
    
    print("\n   Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"   Real predicted Real: {cm[0,0]}")
    print(f"   Real predicted Fake: {cm[0,1]} (False Positives)")
    print(f"   Fake predicted Real: {cm[1,0]} (False Negatives)")
    print(f"   Fake predicted Fake: {cm[1,1]} (True Positives)")
    
    return {
        'accuracy': accuracy,
        'f1_fake': f1_fake,
        'precision_fake': precision_fake,
        'recall_fake': recall_fake
    }

# =============================================================================
# Save Model
# =============================================================================

def save_model(pipeline, metrics):
    """Save the trained model."""
    print(f"\n💾 Saving model to {MODEL_PATH}...")
    
    model_data = {
        'pipeline': pipeline,
        'metrics': metrics,
        'version': '1.0.0'
    }
    
    joblib.dump(model_data, MODEL_PATH)
    
    # Check file size
    file_size = MODEL_PATH.stat().st_size / (1024 * 1024)
    print(f"   Model size: {file_size:.2f} MB")
    
    return MODEL_PATH

# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 60)
    print("🔍 Fake Job Detection Model Training")
    print("=" * 60)
    
    # Load data
    df = load_and_preprocess_data()
    
    # Train model
    pipeline, X_test, y_test = train_model(df)
    
    # Evaluate
    metrics = evaluate_model(pipeline, X_test, y_test)
    
    # Save
    model_path = save_model(pipeline, metrics)
    
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print(f"   Model saved to: {model_path}")
    print("=" * 60)
    
    return pipeline, metrics

if __name__ == "__main__":
    main()
