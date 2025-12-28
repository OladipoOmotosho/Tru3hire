"""
Fake Job Detection Inference Service

This module provides the prediction API for the trained ML model.
"""

import joblib
from pathlib import Path
from typing import Optional


# =============================================================================
# Model Loading
# =============================================================================

MODEL_PATH = Path(__file__).resolve().parent / "models" / "fake_job_classifier.joblib"

# Load model on import (singleton pattern)
_model_data = None


def get_model():
    """Load the trained model (lazy loading)."""
    global _model_data
    
    if _model_data is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Run 'python -m app.ml.train_model' to train the model first."
            )
        
        print(f"📂 Loading ML model from {MODEL_PATH}...")
        _model_data = joblib.load(MODEL_PATH)
        print(f"   Model version: {_model_data.get('version', 'unknown')}")
        print(f"   Metrics: {_model_data.get('metrics', {})}")
    
    return _model_data


# =============================================================================
# Prediction API
# =============================================================================

def predict_fake_job(job_text: str) -> dict:
    """
    Predict if a job posting is fake or real.
    
    Args:
        job_text: The combined text from the job posting
                  (title + description + requirements + company info)
    
    Returns:
        dict with:
            - is_fake: bool - True if predicted as fake
            - confidence: float - Confidence score (0-1)
            - fake_probability: float - Probability of being fake
            - real_probability: float - Probability of being real
            - risk_level: str - 'low', 'medium', 'high', 'critical'
    """
    model_data = get_model()
    pipeline = model_data['pipeline']
    
    # Preprocess text (same as training)
    cleaned_text = job_text.lower()
    cleaned_text = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in cleaned_text)
    cleaned_text = ' '.join(cleaned_text.split())
    
    # Predict
    probabilities = pipeline.predict_proba([cleaned_text])[0]
    prediction = pipeline.predict([cleaned_text])[0]
    
    real_prob = probabilities[0]
    fake_prob = probabilities[1]
    
    # Determine confidence and risk level
    confidence = max(real_prob, fake_prob)
    
    if fake_prob >= 0.8:
        risk_level = "critical"
    elif fake_prob >= 0.6:
        risk_level = "high"
    elif fake_prob >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return {
        "is_fake": bool(prediction == 1),
        "confidence": round(confidence, 4),
        "fake_probability": round(fake_prob, 4),
        "real_probability": round(real_prob, 4),
        "risk_level": risk_level,
        "authenticity_score": round((1 - fake_prob) * 100, 1)  # 0-100 scale
    }


def get_model_info() -> dict:
    """Get information about the loaded model."""
    try:
        model_data = get_model()
        return {
            "version": model_data.get("version", "unknown"),
            "metrics": model_data.get("metrics", {}),
            "status": "loaded"
        }
    except FileNotFoundError:
        return {
            "status": "not_found",
            "error": "Model not trained yet"
        }
