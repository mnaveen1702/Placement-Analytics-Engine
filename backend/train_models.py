"""Train and persist PlacePath AI models.

Saves:
  ml/saved_models/placement_model.joblib
  ml/saved_models/salary_model.joblib
  ml/saved_models/career_model.joblib
  ml/saved_models/scaler.joblib

Also writes compatibility copies used by earlier phases.
Run from the project root:  python backend/train_models.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
ML_DIR = ROOT / "ml"
sys.path.insert(0, str(ML_DIR))

from generate_dataset import generate_placement_dataset  # noqa: E402

MODELS_DIR = ML_DIR / "saved_models"
DATA_PATH = ML_DIR / "data" / "placement_data.csv"

NUMERIC_FEATURES = [
    "cgpa",
    "tenth_percentage",
    "twelfth_percentage",
    "backlogs",
    "attendance_percentage",
    "aptitude_score",
    "coding_score",
    "communication_score",
    "technical_score",
    "dsa_score",
    "number_of_projects",
    "number_of_internships",
    "number_of_certifications",
    "leetcode_problems",
]
CATEGORICAL_FEATURES = ["gender", "department"]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

CAREER_LABELS = [
    "Software Engineer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Engineer",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
]


def _career_label(row: pd.Series) -> str:
    coding = row["coding_score"]
    dsa = row["dsa_score"]
    tech = row["technical_score"]
    apt = row["aptitude_score"]
    comm = row["communication_score"]
    dept = row["department"]
    leet = min(row["leetcode_problems"] / 250, 1.0) * 100
    scores = {
        "Software Engineer": 0.35 * coding + 0.35 * dsa + 0.20 * leet + 0.10 * tech,
        "Backend Developer": 0.30 * coding + 0.25 * tech + 0.25 * dsa + 0.20 * apt,
        "Full Stack Developer": 0.30 * coding + 0.25 * comm + 0.25 * tech + 0.20 * row["number_of_projects"] * 12,
        "Data Engineer": 0.30 * apt + 0.30 * tech + 0.20 * coding + 0.20 * (100 if dept in {"AIML", "CSE", "IT"} else 60),
        "Machine Learning Engineer": 0.30 * tech + 0.25 * coding + 0.20 * apt + 0.25 * (100 if dept == "AIML" else 55),
        "DevOps Engineer": 0.35 * tech + 0.25 * coding + 0.20 * row["number_of_certifications"] * 12 + 0.20 * apt,
        "Cloud Engineer": 0.30 * tech + 0.25 * row["number_of_certifications"] * 12 + 0.25 * coding + 0.20 * apt,
    }
    return max(scores, key=scores.get)


def build_scaler() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def _load_or_create_dataset() -> pd.DataFrame:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DATA_PATH.exists():
        return pd.read_csv(DATA_PATH)
    df = generate_placement_dataset(n_samples=1500, seed=42)
    df.to_csv(DATA_PATH, index=False)
    return df


def train_and_save() -> dict:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    df = _load_or_create_dataset()
    X = df[FEATURE_COLUMNS]
    y_place = df["placement_status"].astype(int)
    df = df.copy()
    df["career_label"] = df.apply(_career_label, axis=1)

    scaler = build_scaler()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_place, test_size=0.2, random_state=42, stratify=y_place
    )
    scaler.fit(X_train)
    X_train_t = scaler.transform(X_train)
    X_test_t = scaler.transform(X_test)

    try:
        from xgboost import XGBClassifier

        n_neg = int((y_train == 0).sum())
        n_pos = max(int((y_train == 1).sum()), 1)
        placement = XGBClassifier(
            n_estimators=250,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            min_child_weight=4,
            scale_pos_weight=n_neg / n_pos,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        )
    except Exception:
        placement = RandomForestClassifier(
            n_estimators=220,
            max_depth=10,
            min_samples_leaf=4,
            class_weight="balanced",
            n_jobs=-1,
            random_state=42,
        )
    placement.fit(X_train_t, y_train)
    y_prob = placement.predict_proba(X_test_t)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    placed = df["placement_status"] == 1
    X_sal = scaler.transform(df.loc[placed, FEATURE_COLUMNS])
    y_sal = df.loc[placed, "package_lpa"].to_numpy()
    salary = GradientBoostingRegressor(random_state=42, max_depth=3, n_estimators=180)
    salary.fit(X_sal, y_sal)

    y_career = df["career_label"]
    Xc_train, Xc_test, yc_train, yc_test = train_test_split(
        X, y_career, test_size=0.2, random_state=42, stratify=y_career
    )
    career_pipe = Pipeline(
        [
            ("scaler", build_scaler()),
            (
                "clf",
                RandomForestClassifier(
                    n_estimators=180,
                    max_depth=8,
                    min_samples_leaf=5,
                    n_jobs=-1,
                    random_state=42,
                ),
            ),
        ]
    )
    career_pipe.fit(Xc_train, yc_train)

    metrics = {
        "placement_accuracy": float(accuracy_score(y_test, y_pred)),
        "placement_f1": float(f1_score(y_test, y_pred)),
        "placement_roc_auc": float(roc_auc_score(y_test, y_prob)),
        "salary_mae": float(mean_absolute_error(y_sal, salary.predict(X_sal))),
        "career_accuracy": float(career_pipe.score(Xc_test, yc_test)),
        "n_rows": int(len(df)),
    }

    joblib.dump(placement, MODELS_DIR / "placement_model.joblib")
    joblib.dump(salary, MODELS_DIR / "salary_model.joblib")
    joblib.dump(career_pipe, MODELS_DIR / "career_model.joblib")
    joblib.dump(scaler, MODELS_DIR / "scaler.joblib")
    joblib.dump(placement, MODELS_DIR / "best_placement_model.joblib")
    joblib.dump(salary, MODELS_DIR / "package_model.joblib")
    joblib.dump(scaler, MODELS_DIR / "preprocessor.joblib")
    (MODELS_DIR / "training_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print("Saved models to", MODELS_DIR)
    print(json.dumps(metrics, indent=2))
    return metrics


def models_ready(models_dir: Path = MODELS_DIR) -> bool:
    required = [
        "placement_model.joblib",
        "salary_model.joblib",
        "scaler.joblib",
        "career_model.joblib",
    ]
    return all((models_dir / name).exists() for name in required)


def ensure_models() -> None:
    if not models_ready():
        print("Model artifacts missing — training now...")
        train_and_save()


if __name__ == "__main__":
    train_and_save()
