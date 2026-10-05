"""Persist assessments and predictions for history."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from backend.app.database.models import (
    Assessment,
    CareerRecommendation,
    PredictionResult,
    Student,
)
from backend.app.schemas.schemas import (
    CareerMatchResponse,
    PlacementPredictionResponse,
    StudentAssessmentInput,
)


def upsert_student(db: Session, payload: StudentAssessmentInput) -> Student | None:
    if not payload.email and not payload.name:
        return None
    student = None
    if payload.email:
        student = db.query(Student).filter(Student.email == str(payload.email)).first()
    if student is None:
        student = Student(
            email=str(payload.email) if payload.email else None,
            name=payload.name,
            department=payload.department,
        )
        db.add(student)
        db.flush()
    else:
        student.name = payload.name or student.name
        student.department = payload.department
    return student


def save_assessment(
    db: Session,
    payload: StudentAssessmentInput,
    prediction: PlacementPredictionResponse,
    careers: CareerMatchResponse | None = None,
) -> Assessment:
    student = upsert_student(db, payload)
    skills = {
        "programming_languages": payload.programming_languages,
        "cloud_skills": payload.cloud_skills,
        "database_skills": payload.database_skills,
        "tools": payload.tools,
    }
    assessment = Assessment(
        student_id=student.id if student else None,
        gender=payload.gender,
        department=payload.department,
        cgpa=payload.cgpa,
        tenth_percentage=payload.tenth_percentage,
        twelfth_percentage=payload.twelfth_percentage,
        backlogs=payload.backlogs,
        attendance_percentage=payload.attendance_percentage,
        aptitude_score=payload.aptitude_score,
        coding_score=payload.coding_score,
        communication_score=payload.communication_score,
        technical_score=payload.technical_score,
        dsa_score=payload.dsa_score,
        number_of_projects=payload.number_of_projects,
        number_of_internships=payload.number_of_internships,
        number_of_certifications=payload.number_of_certifications,
        leetcode_problems=payload.leetcode_problems,
        skills_json=json.dumps(skills),
    )
    db.add(assessment)
    db.flush()

    record = PredictionResult(
        assessment_id=assessment.id,
        probability=prediction.placement_probability,
        status=prediction.placement_status,
        confidence=prediction.confidence,
        predicted_package=prediction.predicted_package_lpa,
        shap_values_json=json.dumps([item.model_dump() for item in prediction.shap_factors]),
    )
    db.add(record)
    db.flush()

    if careers:
        for item in careers.recommendations:
            db.add(
                CareerRecommendation(
                    prediction_id=record.id,
                    role=item.career,
                    match_percentage=item.match_percentage,
                    missing_skills=json.dumps(item.missing_skills),
                    matched_skills=json.dumps(item.matching_skills),
                    reason=item.reason,
                )
            )
    db.commit()
    db.refresh(assessment)
    return assessment
