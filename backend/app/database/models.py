"""SQLAlchemy ORM models for students, assessments, and predictions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.connection import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    department: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assessments: Mapped[list["Assessment"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)
    gender: Mapped[str] = mapped_column(String(32))
    department: Mapped[str] = mapped_column(String(64))
    cgpa: Mapped[float] = mapped_column(Float)
    tenth_percentage: Mapped[float] = mapped_column(Float)
    twelfth_percentage: Mapped[float] = mapped_column(Float)
    backlogs: Mapped[int] = mapped_column(Integer)
    attendance_percentage: Mapped[float] = mapped_column(Float)
    aptitude_score: Mapped[float] = mapped_column(Float)
    coding_score: Mapped[float] = mapped_column(Float)
    communication_score: Mapped[float] = mapped_column(Float)
    technical_score: Mapped[float] = mapped_column(Float)
    dsa_score: Mapped[float] = mapped_column(Float)
    number_of_projects: Mapped[int] = mapped_column(Integer)
    number_of_internships: Mapped[int] = mapped_column(Integer)
    number_of_certifications: Mapped[int] = mapped_column(Integer)
    leetcode_problems: Mapped[int] = mapped_column(Integer)
    skills_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped[Student | None] = relationship(back_populates="assessments")
    prediction: Mapped["PredictionResult | None"] = relationship(
        back_populates="assessment", cascade="all, delete-orphan", uselist=False
    )


class PredictionResult(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"), unique=True)
    probability: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32))
    confidence: Mapped[float] = mapped_column(Float)
    predicted_package: Mapped[float | None] = mapped_column(Float, nullable=True)
    shap_values_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assessment: Mapped[Assessment] = relationship(back_populates="prediction")
    careers: Mapped[list["CareerRecommendation"]] = relationship(
        back_populates="prediction", cascade="all, delete-orphan"
    )


class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id"))
    role: Mapped[str] = mapped_column(String(128))
    match_percentage: Mapped[float] = mapped_column(Float)
    missing_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    matched_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    prediction: Mapped[PredictionResult] = relationship(back_populates="careers")
