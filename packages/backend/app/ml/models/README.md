# Scam Classifier Model — Provenance

`fake_job_classifier.joblib` is the trained model loaded at runtime by
[`app/ml/predictor.py`](../predictor.py). This file documents what it is, how it
performs, and why it needs to be retrained.

## What it is

| Field | Value |
| --- | --- |
| Artifact | `fake_job_classifier.joblib` (a dict: `pipeline`, `metrics`, `version`) |
| Model version | `1.0.0` |
| Pipeline | scikit-learn `Pipeline` (TF-IDF features → classifier) |
| Training code | [`app/ml/train_model.py`](../train_model.py) |
| Training dataset | **EMSCAD** — Kaggle "Real / Fake Job Posting Prediction", 17,880 labeled postings |
| Dataset vintage | **~2012–2014** (when EMSCAD was collected) |

## Measured performance (committed model)

Read directly from the artifact's embedded `metrics`:

| Metric | Value | `train_model.py` target |
| --- | --- | --- |
| Accuracy | **96.76%** | 95%+ ✅ |
| F1 (fake class) | **68.48%** | 85%+ ❌ |
| Precision (fake) | **64.62%** | — |
| Recall (fake) | **72.83%** | — |

**Interpretation:** high overall accuracy is flattered by class imbalance (most
postings are legitimate). On the class that actually matters — fakes — the model
catches ~73% of them (recall) and is right ~65% of the time when it flags one
(precision). The fake-class F1 (68.5%) is **well below** the project's own 85%
target. The rule-based layer in [`authenticity.py`](../../services/authenticity.py)
currently compensates for this gap.

## scikit-learn version

- **Loads successfully under scikit-learn 1.8.0** (verified June 2026).
- The artifact does **not** embed the sklearn version it was trained with.
- Phase 1 (Req 7, `.agent/90-day-roadmap`) pins the sklearn version and adds a
  CI step that fails if the committed model cannot be deserialized under the
  pinned environment — guarding against the known sklearn cross-version
  `joblib.load` failure mode.

## Staleness caveat (why this must be retrained)

The training data predates the scam classes that now dominate. Per FTC data,
**task scams went from ~0 reports in 2020 to ~20,000 in H1 2024** and made up
~40% of 2024 job-scam reports — a category that **did not exist** when EMSCAD
was collected. The model is effectively blind to:

- Task scams (pay-to-work, gamified task ladders)
- Crypto-payout scams
- Off-platform-messaging recruitment (WhatsApp/Telegram pivots)
- AI-generated postings and deepfake-recruiter flows

**Retraining is tracked as Phase 2, Req 14** (modern labeled data including
`/report-scam` submissions, a frozen modern holdout, and a documented promotion
rule). Until then, treat the ML score as one input and rely on the rule layer
for modern patterns.

## Regenerating

The model is regenerable from code (it is not irreplaceable data):

```bash
cd packages/backend
python -m app.ml.train_model
```

Phase 2 moves artifacts to GCS with a `CURRENT` pointer; until then the
`.joblib` is committed for deploy simplicity.
