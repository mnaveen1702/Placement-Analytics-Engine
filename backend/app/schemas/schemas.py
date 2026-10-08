"""Pydantic request and response schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Department = Literal["CSE", "IT", "AIML", "ECE", "EEE", "MECH", "CIVIL"]
Gender = Literal["Male", "Female", "Other"]


class StudentAssessmentInput(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
    gender: Gender
    department: Department
    cgpa: float = Field(..., ge=0, le=10)
    tenth_percentage: float = Field(..., ge=0, le=100)
    twelfth_percentage: float = Field(..., ge=0, le=100)
    backlogs: int = Field(..., ge=0, le=20)
    attendance_percentage: float = Field(..., ge=0, le=100)
    aptitude_score: float = Field(..., ge=0, le=100)
    coding_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    technical_score: float = Field(..., ge=0, le=100)
    dsa_score: float = Field(..., ge=0, le=100)
    number_of_projects: int = Field(..., ge=0, le=30)
    number_of_internships: int = Field(..., ge=0, le=10)
    number_of_certifications: int = Field(..., ge=0, le=30)
    leetcode_problems: int = Field(..., ge=0, le=5000)
    programming_languages: list[str] = Field(default_factory=list)
    cloud_skills: list[str] = Field(default_factory=list)
    database_skills: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    target_career: str | None = None
    question: str | None = Field(
        default=None,
        description="Optional question for the AI career advisor.",
    )

    @field_validator(
        "programming_languages",
        "cloud_skills",
        "database_skills",
        "tools",
        mode="before",
    )
    @classmethod
    def split_comma_strings(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


class ShapFactor(BaseModel):
    feature: str
    contribution: float
    direction: Literal["positive", "negative"]
    explanation: str = ""


class WeekPlan(BaseModel):
    week: int
    title: str
    focus: list[str]
    tasks: list[str]


class PlacementPredictionResponse(BaseModel):
    placement_probability: float
    placement_status: Literal["High", "Medium", "Low"]
    placed: bool = False
    confidence: float
    readiness_index: float = 0.0
    predicted_package_lpa: float | None = None
    package_range: str | None = None
    ats_score: float = 0.0
    present_keywords: list[str] = []
    missing_keywords: list[str] = []
    key_strengths: list[str]
    areas_to_improve: list[str]
    shap_factors: list[ShapFactor]
    recommendations: list["CareerRoleMatch"] = []
    student_skills: list[str] = []
    week_roadmap: list[WeekPlan] = []
    model_loaded: bool = True
    model_name: str | None = None


class CareerRoleMatch(BaseModel):
    career: str
    match_percentage: float
    matching_skills: list[str]
    missing_skills: list[str]
    reason: str


class CareerMatchResponse(BaseModel):
    recommendations: list[CareerRoleMatch]
    student_skills: list[str]


class SkillGapItem(BaseModel):
    skill: str
    importance: Literal["high", "medium", "low"]
    why_it_matters: str


class SkillGapResponse(BaseModel):
    target_career: str
    match_percentage: float
    matching_skills: list[str]
    missing_skills: list[SkillGapItem]
    recommended_projects: list[str]
    recommended_certifications: list[str]


class RoadmapMonth(BaseModel):
    month: int
    title: str
    focus: list[str]
    tasks: list[str]


class AdvisorResponse(BaseModel):
    guidance: str
    roadmap: list[RoadmapMonth]
    source: Literal["openai", "template_fallback"]
    used_student_fields_only: bool = True


class HealthResponse(BaseModel):
    status: str
    database: str
    placement_model_loaded: bool
    package_model_loaded: bool
    preprocessor_loaded: bool
    career_model_loaded: bool = False


class DemoProfile(BaseModel):
    key: str
    label: str
    summary: str
    payload: StudentAssessmentInput


PlacementPredictionResponse.model_rebuild()
