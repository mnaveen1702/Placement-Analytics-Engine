"""FastAPI application for placement prediction and career guidance."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.connection import get_db, init_db
from backend.app.schemas.schemas import (
    AdvisorResponse,
    CareerMatchResponse,
    DemoProfile,
    HealthResponse,
    PlacementPredictionResponse,
    SkillGapResponse,
    StudentAssessmentInput,
)
from backend.app.services.demo import DEMO_PROFILES
from backend.app.services.llm_advisor import generate_llm_guidance
from backend.app.services.persistence import save_assessment
from backend.app.services.predictor import predict_placement, registry
from backend.app.services.recommendation import CAREER_TRACKS, recommend_careers, skill_gap_for_career

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    registry.load(auto_train=True)
    yield


app = FastAPI(
    title="PlacePath AI",
    description="Placement prediction, career recommendation, ATS scoring, and guidance.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({*settings.cors_origins, "http://localhost:5173", "http://127.0.0.1:5173"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    registry.ensure_loaded()
    if not registry.ready:
        registry.load(auto_train=True)
    db_kind = "sqlite" if settings.database_url.startswith("sqlite") else "postgresql"
    return HealthResponse(
        status="ok" if registry.ready else "degraded",
        database=db_kind,
        placement_model_loaded=registry.placement_model is not None,
        package_model_loaded=registry.package_model is not None,
        preprocessor_loaded=registry.preprocessor is not None,
        career_model_loaded=registry.career_model is not None,
    )


@app.get("/api/demo-data", response_model=list[DemoProfile])
def demo_data() -> list[DemoProfile]:
    return DEMO_PROFILES


@app.get("/api/career-roles")
def career_roles() -> dict:
    return {
        "roles": [
            {
                "name": track.name,
                "required_skills": list(track.required_skills),
                "high_importance": list(track.high_importance),
            }
            for track in CAREER_TRACKS
        ]
    }


@app.post("/api/predict", response_model=PlacementPredictionResponse)
def predict(payload: StudentAssessmentInput, db: Session = Depends(get_db)) -> PlacementPredictionResponse:
    try:
        result = predict_placement(payload)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    try:
        rec = CareerMatchResponse(
            recommendations=result.recommendations or [],
            student_skills=result.student_skills or [],
        )
        save_assessment(db, payload, result, rec)
    except Exception:
        logger.exception("Could not persist prediction; returning live result anyway.")
        db.rollback()
    return result


@app.post("/api/recommend-careers", response_model=CareerMatchResponse)
def recommend(payload: StudentAssessmentInput) -> CareerMatchResponse:
    return recommend_careers(payload)


@app.post("/api/skill-gap", response_model=SkillGapResponse)
def skill_gap(payload: StudentAssessmentInput) -> SkillGapResponse:
    return skill_gap_for_career(payload, payload.target_career)


@app.post("/api/ai-advisor", response_model=AdvisorResponse)
def ai_advisor(payload: StudentAssessmentInput) -> AdvisorResponse:
    prediction = predict_placement(payload)
    careers = recommend_careers(payload)
    return generate_llm_guidance(payload, prediction, careers)


@app.get("/api/model-info")
def model_info() -> dict:
    registry.ensure_loaded()
    return {
        "models_dir": str(settings.models_dir),
        "placement_model_loaded": registry.placement_model is not None,
        "package_model_loaded": registry.package_model is not None,
        "preprocessor_loaded": registry.preprocessor is not None,
        "career_model_loaded": registry.career_model is not None,
        "placement_model_type": type(registry.placement_model).__name__
        if registry.placement_model
        else None,
    }
