"""Load persisted ML artifacts and run placement prediction + SHAP."""

from __future__ import annotations

import logging
from threading import Lock

import joblib
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.schemas.schemas import (
    PlacementPredictionResponse,
    ShapFactor,
    StudentAssessmentInput,
)

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
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
    "gender",
    "department",
]

FRIENDLY_NAMES = {
    "cgpa": "CGPA",
    "tenth_percentage": "10th percentage",
    "twelfth_percentage": "12th percentage",
    "backlogs": "Backlogs",
    "attendance_percentage": "Attendance",
    "aptitude_score": "Aptitude score",
    "coding_score": "Coding score",
    "communication_score": "Communication score",
    "technical_score": "Technical score",
    "dsa_score": "DSA score",
    "number_of_projects": "Projects",
    "number_of_internships": "Internships",
    "number_of_certifications": "Certifications",
    "leetcode_problems": "LeetCode problems",
    "gender": "Gender",
    "department": "Department",
}


class ModelRegistry:
    def __init__(self) -> None:
        self.preprocessor = None
        self.placement_model = None
        self.package_model = None
        self._lock = Lock()
        self._loaded = False

    @property
    def ready(self) -> bool:
        return self.preprocessor is not None and self.placement_model is not None

    def load(self) -> None:
        with self._lock:
            models_dir = settings.models_dir
            pre_path = models_dir / "preprocessor.joblib"
            place_path = models_dir / "best_placement_model.joblib"
            pkg_path = models_dir / "package_model.joblib"

            if not pre_path.exists() or not place_path.exists():
                logger.warning(
                    "ML artifacts missing in %s. Run ml/generate_dataset.py, "
                    "ml/preprocessing.py, then ml/train.py.",
                    models_dir,
                )
                self._loaded = True
                return

            self.preprocessor = joblib.load(pre_path)
            self.placement_model = joblib.load(place_path)
            if pkg_path.exists():
                self.package_model = joblib.load(pkg_path)
            self._loaded = True
            logger.info("Loaded placement model from %s", place_path)

    def ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()


registry = ModelRegistry()


def assessment_to_frame(payload: StudentAssessmentInput) -> pd.DataFrame:
    row = {column: getattr(payload, column) for column in FEATURE_COLUMNS}
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def _readiness(probability: float) -> str:
    if probability >= 0.70:
        return "High"
    if probability >= 0.40:
        return "Medium"
    return "Low"


def _package_range(value: float | None, probability: float) -> str | None:
    if value is None:
        if probability < 0.40:
            return "Below typical campus offers until readiness improves"
        return None
    low = max(2.5, round(value - 1.2, 1))
    high = round(value + 1.5, 1)
    return f"{low}–{high} LPA"


def _aggregate_shap(feature_names: np.ndarray, shap_row: np.ndarray) -> list[ShapFactor]:
    grouped: dict[str, float] = {}
    for name, value in zip(feature_names, shap_row):
        raw = str(name)
        base = raw.split("_", 1)[-1] if raw.startswith(("gender", "department")) else raw
        for key in FRIENDLY_NAMES:
            if raw == key or raw.startswith(key) or key in raw:
                base = key
                break
        grouped[base] = grouped.get(base, 0.0) + float(value)

    total = sum(abs(v) for v in grouped.values()) or 1.0
    factors = []
    for key, value in grouped.items():
        factors.append(
            ShapFactor(
                feature=FRIENDLY_NAMES.get(key, key.replace("_", " ").title()),
                contribution=round(100.0 * value / total, 1),
                direction="positive" if value >= 0 else "negative",
            )
        )
    factors.sort(key=lambda item: abs(item.contribution), reverse=True)
    return factors


def _shap_values(model, X: np.ndarray, feature_names: np.ndarray) -> np.ndarray | None:
    try:
        import shap
    except ImportError:
        logger.warning("shap is not installed; skipping explainability.")
        return None

    try:
        model_name = type(model).__name__.lower()
        if "xgb" in model_name or "forest" in model_name or "tree" in model_name:
            explainer = shap.TreeExplainer(model)
            values = explainer.shap_values(X)
        elif "logistic" in model_name or "linear" in model_name:
            explainer = shap.LinearExplainer(model, X)
            values = explainer.shap_values(X)
        else:
            explainer = shap.Explainer(model.predict_proba, X)
            explanation = explainer(X)
            values = explanation.values

        if isinstance(values, list):
            values = values[1]
        values = np.array(values)
        if values.ndim == 3:
            values = values[:, :, 1]
        if values.ndim == 2:
            return values[0]
        return values
    except Exception as exc:  # noqa: BLE001
        logger.warning("SHAP explanation failed (%s). Using coefficient fallback.", exc)
        return None


def _coefficient_fallback(model, feature_names: np.ndarray) -> list[ShapFactor] | None:
    coef = None
    if hasattr(model, "coef_"):
        coef = np.ravel(model.coef_)
    elif hasattr(model, "feature_importances_"):
        coef = np.array(model.feature_importances_, dtype=float)
    if coef is None or len(coef) != len(feature_names):
        return None
    return _aggregate_shap(feature_names, coef)


def predict_placement(payload: StudentAssessmentInput) -> PlacementPredictionResponse:
    registry.ensure_loaded()
    if not registry.ready:
        raise RuntimeError(
            "Placement model artifacts are not available. Train the model first."
        )

    frame = assessment_to_frame(payload)
    transformed = registry.preprocessor.transform(frame)
    model = registry.placement_model
    probability = float(model.predict_proba(transformed)[0, 1])
    confidence = round(abs(probability - 0.5) * 2, 3)

    predicted_package = None
    if registry.package_model is not None and probability >= 0.35:
        predicted_package = float(
            np.clip(registry.package_model.predict(transformed)[0], 2.4, 22.0)
        )
        predicted_package = round(predicted_package, 2)

    feature_names = np.array(registry.preprocessor.get_feature_names_out())
    shap_row = _shap_values(model, transformed, feature_names)
    if shap_row is None:
        factors = _coefficient_fallback(model, feature_names) or []
    else:
        factors = _aggregate_shap(feature_names, shap_row)

    strengths = [
        f"{item.feature} (+{item.contribution:.1f}%)"
        for item in factors
        if item.direction == "positive"
    ][:5]
    weaknesses = [
        f"{item.feature} ({item.contribution:.1f}%)"
        for item in factors
        if item.direction == "negative"
    ][:5]

    return PlacementPredictionResponse(
        placement_probability=round(probability * 100, 1),
        placement_status=_readiness(probability),
        confidence=confidence,
        predicted_package_lpa=predicted_package,
        package_range=_package_range(predicted_package, probability),
        key_strengths=strengths,
        areas_to_improve=weaknesses,
        shap_factors=factors[:10],
        model_loaded=True,
    )
