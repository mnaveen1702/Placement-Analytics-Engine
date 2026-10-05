"""
Phase 3: Fit and persist the feature preprocessing pipeline.

Continuous features are standardized. Gender and department are one-hot
encoded. The fitted ColumnTransformer is saved with joblib for reuse in
training and later FastAPI inference.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = Path(__file__).resolve().parent / "data" / "placement_data.csv"
SAVED_DIR = Path(__file__).resolve().parent / "saved_models"
PREPROCESSOR_PATH = SAVED_DIR / "preprocessor.joblib"

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
TARGET_COLUMN = "placement_status"
PACKAGE_COLUMN = "package_lpa"


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def load_feature_frame(csv_path: Path = DATA_PATH) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Run generate_dataset.py first."
        )
    df = pd.read_csv(csv_path)
    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    return df


def main() -> None:
    SAVED_DIR.mkdir(parents=True, exist_ok=True)
    df = load_feature_frame()
    X = df[FEATURE_COLUMNS]

    preprocessor = build_preprocessor()
    preprocessor.fit(X)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)

    transformed = preprocessor.transform(X)
    print(f"Fitted preprocessor on {len(X)} rows")
    print(f"Input features: {len(FEATURE_COLUMNS)}")
    print(f"Transformed shape: {transformed.shape}")
    print(f"Saved preprocessor to {PREPROCESSOR_PATH}")


if __name__ == "__main__":
    main()
