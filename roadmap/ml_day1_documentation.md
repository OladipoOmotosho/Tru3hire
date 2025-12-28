# ML Fake Job Detection - Day 1 Documentation

> **Date**: December 27, 2024  
> **Status**: ✅ Complete

---

## Overview

Trained and integrated a machine learning classifier to detect fraudulent job postings using the Kaggle Fake Job Posting dataset.

---

## Dataset

| Property      | Value                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Source        | [Kaggle - Real or Fake Job Posting](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction) |
| Total Samples | 17,880                                                                                                               |
| Real Jobs     | 17,014 (95%)                                                                                                         |
| Fake Jobs     | 866 (5%)                                                                                                             |
| Features      | 18 columns (text + metadata)                                                                                         |

---

## ML Approach

### Model Architecture

```
Job Text (title + description + requirements + company_profile)
    ↓
Text Preprocessing (lowercase, remove special chars)
    ↓
TF-IDF Vectorizer (5000 features, bigrams)
    ↓
RandomForest Classifier (100 trees, balanced class weights)
    ↓
Fake/Real Prediction + Confidence Score
```

### Key Decisions

1. **TF-IDF over embeddings**: Faster training, no GPU needed, small model size
2. **RandomForest over neural networks**: Interpretable, robust, good for tabular+text
3. **Class weight balancing**: Handles 5% fake vs 95% real imbalance
4. **Hybrid scoring**: 70% ML + 30% rules for explainability

---

## Results

### Test Performance

| Metric        | Value      |
| ------------- | ---------- |
| Model Size    | 3.5 MB     |
| Training Time | ~2 minutes |

### Sample Predictions

| Job Posting                                           | Score  | Risk Level  |
| ----------------------------------------------------- | ------ | ----------- |
| Scam: "Earn $5000/week, no experience, pay $100 fee"  | 32/100 | CRITICAL ❌ |
| Legit: "Google Software Engineer, 5+ years, benefits" | 60/100 | MEDIUM ✅   |

---

## Files Created

```
packages/backend/app/ml/
├── __init__.py          # Module exports
├── train_model.py       # Training script
├── predictor.py         # Inference service
└── models/
    └── fake_job_classifier.joblib  # Saved model (3.5MB)
```

### Key Functions

**`train_model.py`**

```python
python -m app.ml.train_model  # Run to train model
```

**`predictor.py`**

```python
from app.ml.predictor import predict_fake_job

result = predict_fake_job("Job description text...")
# Returns: {
#   "is_fake": bool,
#   "confidence": float,
#   "fake_probability": float,
#   "authenticity_score": float (0-100),
#   "risk_level": "low" | "medium" | "high" | "critical"
# }
```

---

## Integration

### Updated Files

1. **`app/services/authenticity.py`**

   - Added ML model integration
   - Hybrid scoring: `score = 0.7 * ml_score + 0.3 * rule_score`
   - Graceful fallback if ML unavailable

2. **API Response**
   - Now includes `ml_prediction` and `ml_available` in response
   - Transparent about whether ML was used

---

## How to Retrain

```bash
cd packages/backend
python -m app.ml.train_model
```

This will:

1. Load the Kaggle CSV
2. Preprocess and combine text features
3. Train TF-IDF + RandomForest pipeline
4. Evaluate and print metrics
5. Save model to `app/ml/models/`

---

## Future Improvements

- [ ] Experiment with XGBoost or LightGBM
- [ ] Add more text features (grammar quality, sentence structure)
- [ ] Fine-tune on Canadian job market data
- [ ] Add BERT embeddings for better semantic understanding
- [ ] Expand training data with user-reported scams

---

## Dependencies

```
scikit-learn
pandas
joblib
```

Added to `requirements.txt` ✅
