#!/usr/bin/env python3
"""
Evaluate the trained pipeline and produce:
 - classification report (printed + saved)
 - confusion matrix heatmap saved as out/confusion_matrix.png
 - ROC curve saved as out/roc_curve.png

Usage:
  python scripts/evaluate_model.py
"""
import os
import argparse
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    RocCurveDisplay,
)

def ensure_out_dir(out_dir):
    os.makedirs(out_dir, exist_ok=True)

def load_data(path):
    df = pd.read_csv(path)
    X = df["text"].astype(str)
    y = df["fraudulent"].astype(int)
    return X, y

def main(
    data_path="../data/processed/clean_fake_jobs.csv",
    model_path="../models/fake_job_model.joblib",
    out_dir="out",
):
    ensure_out_dir(out_dir)

    print("Loading data from:", data_path)
    X, y = load_data(data_path)

    # Recreate same test split as training notebook
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Load model
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Train and save first.")
    print("Loading model from:", model_path)
    pipe = joblib.load(model_path)

    # Predictions
    print("Predicting...")
    pred = pipe.predict(Xte)
    report = classification_report(yte, pred, digits=4, output_dict=False)
    report_dict = classification_report(yte, pred, output_dict=True)

    print("\nCLASSIFICATION REPORT\n")
    print(report)

    # Save classification report to file
    report_txt = os.path.join(out_dir, "classification_report.txt")
    with open(report_txt, "w", encoding="utf-8") as f:
        f.write(report)
    print("Saved classification report to:", report_txt)

    # Confusion matrix
    cm = confusion_matrix(yte, pred)
    cm_fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=False,
        xticklabels=["not-fraud", "fraud"],
        yticklabels=["not-fraud", "fraud"],
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix")
    cm_path = os.path.join(out_dir, "confusion_matrix.png")
    cm_fig.tight_layout()
    cm_fig.savefig(cm_path, dpi=200)
    plt.close(cm_fig)
    print("Saved confusion matrix to:", cm_path)

    # ROC curve
    # Try predict_proba, fall back to decision_function
    if hasattr(pipe, "predict_proba"):
        try:
            probs = pipe.predict_proba(Xte)[:, 1]
        except Exception:
            # If pipeline (e.g., custom wrapper) exposes estimator at end
            probs = pipe.named_steps["clf"].predict_proba(pipe.named_steps["tfidf"].transform(Xte))[:, 1]
    elif hasattr(pipe, "decision_function"):
        probs = pipe.decision_function(Xte)
    else:
        raise RuntimeError("Model does not support predict_proba or decision_function required for ROC.")

    fpr, tpr, thresholds = roc_curve(yte, probs)
    roc_auc = auc(fpr, tpr)

    roc_fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, color="C0", lw=2, label=f"ROC curve (AUC = {roc_auc:.4f})")
    ax.plot([0, 1], [0, 1], color="gray", lw=1, linestyle="--", label="Random")
    ax.set_xlim([-0.01, 1.01])
    ax.set_ylim([-0.01, 1.01])
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("Receiver Operating Characteristic (ROC)")
    ax.legend(loc="lower right")
    roc_path = os.path.join(out_dir, "roc_curve.png")
    roc_fig.tight_layout()
    roc_fig.savefig(roc_path, dpi=200)
    plt.close(roc_fig)
    print("Saved ROC curve to:", roc_path)

    # Print summary metrics
    print("\nSUMMARY METRICS")
    precision_pos = report_dict["1"]["precision"]
    recall_pos = report_dict["1"]["recall"]
    f1_pos = report_dict["1"]["f1-score"]
    support_pos = report_dict["1"]["support"]
    print(f"Fraud (class=1) — precision: {precision_pos:.4f}, recall: {recall_pos:.4f}, f1: {f1_pos:.4f}, support: {support_pos}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="../data/processed/clean_fake_jobs.csv", help="Path to CSV with processed data")
    parser.add_argument("--model", default="../models/fake_job_model.joblib", help="Path to saved joblib pipeline")
    parser.add_argument("--out", default="out", help="Output directory for plots and reports")
    args = parser.parse_args()
    main(data_path=args.data, model_path=args.model, out_dir=args.out)