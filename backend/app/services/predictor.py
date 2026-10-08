"""Load persisted ML artifacts and run placement prediction + explainability."""

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
from backend.app.services.insights import (
    compute_ats,
    four_week_roadmap,
    improvements_from_thresholds,
    strengths_from_thresholds,
)
from backend.app.services.recommendation import recommend_careers

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

PLAIN_ENGLISH = {
    "cgpa": "Campus shortlists still weight CGPA heavily.",
    "backlogs": "Open backlogs are a common hard filter in drives.",
    "coding_score": "Coding rounds decide most software offers.",
    "dsa_score": "DSA performance predicts interview conversion.",
    "leetcode_problems": "Problem volume is a proxy for interview stamina.",
    "number_of_internships": "Internships supply evidence for HR screens.",
    "number_of_projects": "Projects are the proof behind resume claims.",
    "communication_score": "HR and managerial rounds reward clear communication.",
    "aptitude_score": "Aptitude tests gate many service-company drives.",
    "technical_score": "Core CS / domain knowledge shows up in technical rounds.",
    "attendance_percentage": "Some colleges and recruiters still use attendance cutoffs.",
    "tenth_percentage": "10th marks still appear on many eligibility forms.",
    "twelfth_percentage": "12th marks still appear on many eligibility forms.",
    "number_of_certifications": "Certificates help only when they map to a target role.",
}


class ModelRegistry:
    def __init__(self) -> None:
        self.preprocessor = None
        self.placement_model = None
        self.package_model = None
        self.career_model = None
        self._lock = Lock()
        self._loaded = False

    @property
    def ready(self) -> bool:
        return self.preprocessor is not None and self.placement_model is not None

    def _first_existing(self, *names):
        for name in names:
            path = settings.models_dir / name
            if path.exists():
                return path
        return None

    def load(self, auto_train: bool = True) -> None:
        with self._lock:
            settings.models_dir.mkdir(parents=True, exist_ok=True)
            pre_path = self._first_existing("scaler.joblib", "preprocessor.joblib")
            place_path = self._first_existing("placement_model.joblib", "best_placement_model.joblib")
            pkg_path = self._first_existing("salary_model.joblib", "package_model.joblib")
            career_path = self._first_existing("career_model.joblib")

            if (pre_path is None or place_path is None) and auto_train:
                logger.info("ML artifacts missing — auto-training.")
                try:
                    from backend.train_models import train_and_save

                    train_and_save()
                    pre_path = self._first_existing("scaler.joblib", "preprocessor.joblib")
                    place_path = self._first_existing("placement_model.joblib", "best_placement_model.joblib")
                    pkg_path = self._first_existing("salary_model.joblib", "package_model.joblib")
                    career_path = self._first_existing("career_model.joblib")
                except Exception:
                    logger.exception("Auto-training failed")

            if pre_path is None or place_path is None:
                self._loaded = True
                return

            self.preprocessor = joblib.load(pre_path)
            self.placement_model = joblib.load(place_path)
            self.package_model = joblib.load(pkg_path) if pkg_path else None
            self.career_model = joblib.load(career_path) if career_path else None
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


def _blend_career_matches(payload: StudentAssessmentInput) -> tuple[list, list[str]]:
    rec = recommend_careers(payload, top_k=3)
    roles = list(rec.recommendations)
    if registry.career_model is not None:
        try:
            frame = assessment_to_frame(payload)
            proba = registry.career_model.predict_proba(frame)[0]
            classes = getattr(registry.career_model, "classes_", None)
            if classes is None and hasattr(registry.career_model, "named_steps"):
                classes = registry.career_model.named_steps["clf"].classes_
            labels = list(classes)
            ml_scores = {str(label): float(p) * 100 for label, p in zip(labels, proba)}
            merged = []
            for item in roles:
                ml = ml_scores.get(item.career)
                if ml is None:
                    merged.append(item)
                    continue
                blended = round(0.65 * item.match_percentage + 0.35 * ml, 1)
                merged.append(item.model_copy(update={"match_percentage": blended}))
            merged.sort(key=lambda x: x.match_percentage, reverse=True)
            roles = merged[:3]
        except Exception:
            logger.exception("Career model blend failed; using skill similarity only.")
    return roles, rec.student_skills


def _aggregate_shap(feature_names: np.ndarray, shap_row: np.ndarray) -> list[ShapFactor]:
    grouped: dict[str, float] = {}
    for name, value in zip(feature_names, shap_row):
        raw = str(name)
        base = raw
        for key in FRIENDLY_NAMES:
            if raw == key or raw.startswith(key) or key in raw:
                base = key
                break
        grouped[base] = grouped.get(base, 0.0) + float(value)

    total = sum(abs(v) for v in grouped.values()) or 1.0
    factors = []
    for key, value in grouped.items():
        direction = "positive" if value >= 0 else "negative"
        label = FRIENDLY_NAMES.get(key, key.replace("_", " ").title())
        why = PLAIN_ENGLISH.get(key, "This signal moved the placement probability.")
        verb = "lifted" if direction == "positive" else "reduced"
        factors.append(
            ShapFactor(
                feature=label,
                contribution=round(100.0 * value / total, 1),
                direction=direction,
                explanation=f"{label} {verb} estimated placement odds. {why}",
            )
        )
    factors.sort(key=lambda item: abs(item.contribution), reverse=True)
    return factors


def _shap_values(model, X: np.ndarray) -> np.ndarray | None:
    try:
        import shap
    except ImportError:
        return None
    try:
        model_name = type(model).__name__.lower()
        if "xgb" in model_name or "forest" in model_name or "tree" in model_name or "gradient" in model_name:
            explainer = shap.TreeExplainer(model)
            values = explainer.shap_values(X)
        elif "logistic" in model_name or "linear" in model_name:
            explainer = shap.LinearExplainer(model, X)
            values = explainer.shap_values(X)
        else:
            explainer = shap.Explainer(model.predict_proba, X)
            values = explainer(X).values
        if isinstance(values, list):
            values = values[1]
        values = np.array(values)
        if values.ndim == 3:
            values = values[:, :, 1]
        if values.ndim == 2:
            return values[0]
        return values
    except Exception as exc:  # noqa: BLE001
        logger.warning("SHAP failed (%s); using importances.", exc)
        return None


def _coefficient_fallback(model, feature_names: np.ndarray) -> list[ShapFactor]:
    coef = None
    if hasattr(model, "feature_importances_"):
        coef = np.array(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        coef = np.ravel(model.coef_)
    if coef is None or len(coef) != len(feature_names):
        return []
    return _aggregate_shap(feature_names, coef)


def _profile_delta_factors(payload: StudentAssessmentInput) -> list[ShapFactor]:
    """Interpretable fallback: student vs typical campus medians (not SHAP)."""
    specs = [
        ("cgpa", payload.cgpa, 7.2, 12.0, False),
        ("backlogs", float(payload.backlogs), 0.4, 18.0, True),
        ("coding_score", payload.coding_score, 62.0, 0.35, False),
        ("dsa_score", payload.dsa_score, 58.0, 0.32, False),
        ("leetcode_problems", float(payload.leetcode_problems), 70.0, 0.08, False),
        ("number_of_internships", float(payload.number_of_internships), 0.6, 10.0, False),
        ("communication_score", payload.communication_score, 62.0, 0.18, False),
        ("aptitude_score", payload.aptitude_score, 64.0, 0.18, False),
        ("technical_score", payload.technical_score, 63.0, 0.2, False),
        ("attendance_percentage", payload.attendance_percentage, 80.0, 0.12, False),
        ("number_of_projects", float(payload.number_of_projects), 2.0, 4.0, False),
        ("twelfth_percentage", payload.twelfth_percentage, 72.0, 0.08, False),
    ]
    raw = []
    for key, value, median, weight, invert in specs:
        delta = median - value if invert else value - median
        raw.append((key, delta * weight))
    arr = np.array([v for _, v in raw], dtype=float)
    names = np.array([k for k, _ in raw])
    return _aggregate_shap(names, arr)


def _heuristic_probability(payload: StudentAssessmentInput) -> float:
    z = (
        0.85 * ((payload.cgpa - 7.2) / 0.9)
        - 0.55 * payload.backlogs
        + 0.55 * ((payload.coding_score - 55) / 14)
        + 0.48 * ((payload.dsa_score - 55) / 14)
        + 0.42 * payload.number_of_internships
        + 0.0022 * payload.leetcode_problems
        + 0.32 * ((payload.communication_score - 60) / 12)
        + 0.20 * ((payload.attendance_percentage - 82) / 8)
        + 0.18 * payload.number_of_projects
    )
    return float(1.0 / (1.0 + np.exp(-z + 0.15)))


def _heuristic_package(payload: StudentAssessmentInput, probability: float) -> float:
    value = (
        3.2
        + 0.55 * (payload.cgpa - 7.0)
        + 0.018 * payload.coding_score
        + 0.012 * payload.dsa_score
        + 0.45 * payload.number_of_internships
        + 0.004 * payload.leetcode_problems
    )
    if probability < 0.35:
        value *= 0.72
    return float(np.clip(round(value, 2), 2.4, 22.0))


def _build_response(
    payload: StudentAssessmentInput,
    probability: float,
    predicted_package: float | None,
    factors: list[ShapFactor],
    model_name: str,
) -> PlacementPredictionResponse:
    ats_score, present, missing = compute_ats(payload)
    threshold_strengths = strengths_from_thresholds(payload)
    threshold_gaps = improvements_from_thresholds(payload)
    shap_strengths = [
        f"{item.feature} (+{abs(item.contribution):.1f}%)"
        for item in factors
        if item.direction == "positive"
    ][:4]
    shap_weak = [
        f"{item.feature} ({item.contribution:.1f}%)"
        for item in factors
        if item.direction == "negative"
    ][:4]
    careers, student_skills = _blend_career_matches(payload)
    readiness = round(
        0.6 * probability * 100 + 0.25 * ats_score + 0.15 * payload.coding_score, 1
    )
    readiness = float(np.clip(readiness, 5, 98))
    return PlacementPredictionResponse(
        placement_probability=round(probability * 100, 1),
        placement_status=_readiness(probability),
        placed=bool(probability >= 0.5),
        confidence=round(abs(probability - 0.5) * 2, 3),
        readiness_index=readiness,
        predicted_package_lpa=predicted_package,
        package_range=_package_range(predicted_package, probability),
        ats_score=ats_score,
        present_keywords=present,
        missing_keywords=missing,
        key_strengths=(threshold_strengths or shap_strengths)[:6],
        areas_to_improve=(threshold_gaps or shap_weak)[:6],
        shap_factors=factors[:10],
        recommendations=careers,
        student_skills=student_skills,
        week_roadmap=four_week_roadmap(payload),
        model_loaded=True,
        model_name=model_name,
    )


def predict_placement(payload: StudentAssessmentInput) -> PlacementPredictionResponse:
    registry.ensure_loaded()
    if not registry.ready:
        registry.load(auto_train=True)

    if not registry.ready:
        logger.warning("Using heuristic fallback because trained artifacts are unavailable.")
        probability = _heuristic_probability(payload)
        package = _heuristic_package(payload, probability)
        factors = _profile_delta_factors(payload)
        return _build_response(payload, probability, package, factors, "HeuristicFallback")

    frame = assessment_to_frame(payload)
    try:
        transformed = registry.preprocessor.transform(frame)
        model = registry.placement_model
        probability = float(model.predict_proba(transformed)[0, 1])
        predicted_package = None
        if registry.package_model is not None:
            predicted_package = float(
                np.clip(registry.package_model.predict(transformed)[0], 2.4, 22.0)
            )
            if probability < 0.35:
                predicted_package = round(max(2.4, predicted_package * 0.72), 2)
            else:
                predicted_package = round(predicted_package, 2)
        try:
            feature_names = np.array(registry.preprocessor.get_feature_names_out())
        except Exception:
            feature_names = np.array([f"f{i}" for i in range(transformed.shape[1])])
        shap_row = _shap_values(model, transformed)
        if shap_row is not None:
            factors = _aggregate_shap(feature_names, shap_row)
        else:
            factors = _coefficient_fallback(model, feature_names) or _profile_delta_factors(payload)
        return _build_response(
            payload,
            probability,
            predicted_package,
            factors,
            type(model).__name__,
        )
    except Exception:
        logger.exception("Trained model inference failed; using heuristic fallback.")
        probability = _heuristic_probability(payload)
        package = _heuristic_package(payload, probability)
        return _build_response(
            payload, probability, package, _profile_delta_factors(payload), "HeuristicFallback"
        )
