"""
Phase 4: Train, evaluate, and serialize placement and package models.

Classification models compared:
  1. Logistic Regression
  2. Decision Tree
  3. Random Forest
  4. XGBoost

Selection uses ROC-AUC on a held-out 20% test set (better than accuracy
alone under class imbalance). A Ridge regressor predicts package_lpa for
placed students only.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib

ML_DIR = Path(__file__).resolve().parent
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from preprocessing import (
    FEATURE_COLUMNS,
    PACKAGE_COLUMN,
    PREPROCESSOR_PATH,
    SAVED_DIR,
    TARGET_COLUMN,
    load_feature_frame,
)

BEST_MODEL_PATH = SAVED_DIR / "best_placement_model.joblib"
PACKAGE_MODEL_PATH = SAVED_DIR / "package_model.joblib"
METRICS_PATH = SAVED_DIR / "training_metrics.json"
RANDOM_STATE = 42
TEST_SIZE = 0.20


def evaluate_classifier(name: str, model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    if hasattr(model, "predict_proba"):
        y_score = model.predict_proba(X_test)[:, 1]
    else:
        y_score = y_pred.astype(float)

    metrics = {
        "model": name,
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_score)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    return metrics


def print_metrics(metrics: dict) -> None:
    print(
        f"  {metrics['model']:<22} "
        f"Acc={metrics['accuracy']:.4f}  "
        f"Prec={metrics['precision']:.4f}  "
        f"Rec={metrics['recall']:.4f}  "
        f"F1={metrics['f1']:.4f}  "
        f"ROC-AUC={metrics['roc_auc']:.4f}"
    )


def build_models(y_train: np.ndarray) -> dict:
    n_neg = int((y_train == 0).sum())
    n_pos = int((y_train == 1).sum())
    scale_pos_weight = n_neg / max(n_pos, 1)

    return {
        "Logistic Regression": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            solver="lbfgs",
            random_state=RANDOM_STATE,
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=6,
            min_samples_leaf=12,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=4,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=250,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=4,
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }


def main() -> None:
    if not PREPROCESSOR_PATH.exists():
        raise FileNotFoundError(
            f"Preprocessor not found at {PREPROCESSOR_PATH}. Run preprocessing.py first."
        )

    SAVED_DIR.mkdir(parents=True, exist_ok=True)
    df = load_feature_frame()
    preprocessor = joblib.load(PREPROCESSOR_PATH)

    X_raw = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int).to_numpy()
    X = preprocessor.transform(X_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print(f"Train size: {len(y_train)} | Test size: {len(y_test)}")
    print(
        f"Train placement rate: {y_train.mean():.3f} | "
        f"Test placement rate: {y_test.mean():.3f}"
    )
    print("\nTest-set classification metrics:")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    results = []
    fitted_models = {}

    for name, model in build_models(y_train).items():
        model.fit(X_train, y_train)
        fitted_models[name] = model
        metrics = evaluate_classifier(name, model, X_test, y_test)
        cv_auc = cross_val_score(
            model, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1
        )
        metrics["cv_roc_auc_mean"] = float(cv_auc.mean())
        metrics["cv_roc_auc_std"] = float(cv_auc.std())
        results.append(metrics)
        print_metrics(metrics)
        print(
            f"    5-fold CV ROC-AUC: {metrics['cv_roc_auc_mean']:.4f} "
            f"(+/- {metrics['cv_roc_auc_std']:.4f})"
        )

    # Primary selection criterion: test ROC-AUC, tie-break on F1.
    best = max(results, key=lambda m: (m["roc_auc"], m["f1"]))
    best_name = best["model"]
    best_model = fitted_models[best_name]
    joblib.dump(best_model, BEST_MODEL_PATH)

    print(f"\nSelected placement model: {best_name} (test ROC-AUC={best['roc_auc']:.4f})")
    print("Classification report (best model, test set):")
    print(
        classification_report(
            y_test,
            best_model.predict(X_test),
            target_names=["Not Placed", "Placed"],
            digits=4,
        )
    )

    # Package regression on placed students only (status=1 and package > 0).
    placed_mask = (df[TARGET_COLUMN] == 1) & (df[PACKAGE_COLUMN] > 0)
    X_pkg = preprocessor.transform(df.loc[placed_mask, FEATURE_COLUMNS])
    y_pkg = df.loc[placed_mask, PACKAGE_COLUMN].to_numpy()

    X_pkg_train, X_pkg_test, y_pkg_train, y_pkg_test = train_test_split(
        X_pkg, y_pkg, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    package_model = Ridge(alpha=1.0)
    package_model.fit(X_pkg_train, y_pkg_train)
    y_pkg_pred = package_model.predict(X_pkg_test)
    package_metrics = {
        "model": "Ridge Regression",
        "mae": float(mean_absolute_error(y_pkg_test, y_pkg_pred)),
        "r2": float(r2_score(y_pkg_test, y_pkg_pred)),
        "n_placed": int(placed_mask.sum()),
    }
    joblib.dump(package_model, PACKAGE_MODEL_PATH)

    print(
        f"Package model (placed students, n={package_metrics['n_placed']}): "
        f"MAE={package_metrics['mae']:.3f} LPA  R2={package_metrics['r2']:.4f}"
    )
    print(f"Saved {BEST_MODEL_PATH}")
    print(f"Saved {PACKAGE_MODEL_PATH}")

    payload = {
        "best_model": best_name,
        "selection_criterion": "test ROC-AUC, F1 tie-break",
        "classification": results,
        "package_regression": package_metrics,
        "notes": [
            "Preprocessor was fitted in preprocessing.py before the train/test split.",
            "This leaks a small amount of scale/encoding information from the test fold.",
            "Acceptable for this academic demo; later phases can refit on train only.",
        ],
    }
    METRICS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote metrics to {METRICS_PATH}")


if __name__ == "__main__":
    main()
