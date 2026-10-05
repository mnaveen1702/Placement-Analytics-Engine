"""Career recommendation via skill-vector cosine similarity."""

from __future__ import annotations

import math
from dataclasses import dataclass

from backend.app.schemas.schemas import (
    CareerMatchResponse,
    CareerRoleMatch,
    SkillGapItem,
    SkillGapResponse,
    StudentAssessmentInput,
)

SKILL_ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "sql": "SQL",
    "mysql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "react": "React",
    "html": "HTML/CSS",
    "css": "HTML/CSS",
    "html/css": "HTML/CSS",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Node.js",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "REST APIs",
    "rest": "REST APIs",
    "api": "REST APIs",
    "git": "Git",
    "github": "Git",
    "dsa": "DSA",
    "data structures": "DSA",
    "algorithms": "DSA",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "statistics": "Statistics",
    "pandas": "Data Analysis",
    "numpy": "Data Analysis",
    "excel": "Data Analysis",
    "power bi": "Data Visualization",
    "tableau": "Data Visualization",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "linux": "Linux",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "terraform": "Terraform",
    "mlops": "MLOps",
    "security": "Network Security",
    "cybersecurity": "Network Security",
    "linux security": "Network Security",
    "communication": "Communication",
    "problem solving": "Problem Solving",
}


@dataclass(frozen=True)
class CareerTrack:
    name: str
    required_skills: tuple[str, ...]
    high_importance: tuple[str, ...]
    projects: tuple[str, ...]
    certifications: tuple[str, ...]
    score_hints: tuple[str, ...]


CAREER_TRACKS: tuple[CareerTrack, ...] = (
    CareerTrack(
        "Software Developer",
        ("Python", "Java", "DSA", "Git", "SQL", "REST APIs", "Problem Solving"),
        ("DSA", "Git", "Problem Solving"),
        ("Build a CRUD app with tests", "Contribute to an open-source repo"),
        ("Git & GitHub fundamentals", "Language-specific coding certificate"),
        ("coding_score", "dsa_score", "leetcode_problems"),
    ),
    CareerTrack(
        "Backend Developer",
        ("Python", "Java", "SQL", "REST APIs", "Git", "Docker", "Linux"),
        ("SQL", "REST APIs", "Docker"),
        ("Design a REST API with auth", "Add caching and database indexing"),
        ("SQL", "Docker essentials"),
        ("coding_score", "technical_score", "dsa_score"),
    ),
    CareerTrack(
        "Frontend Developer",
        ("JavaScript", "TypeScript", "React", "HTML/CSS", "Git", "REST APIs"),
        ("JavaScript", "React", "HTML/CSS"),
        ("Build a responsive dashboard", "Recreate a production UI from Figma"),
        ("Meta Front-End / equivalent", "JavaScript algorithms"),
        ("coding_score", "communication_score", "number_of_projects"),
    ),
    CareerTrack(
        "Full Stack Developer",
        ("JavaScript", "React", "Node.js", "SQL", "REST APIs", "Git", "Docker"),
        ("React", "Node.js", "SQL"),
        ("Deploy a full-stack app", "Add CI and a production database"),
        ("Full-stack web development", "Cloud fundamentals"),
        ("coding_score", "number_of_projects", "technical_score"),
    ),
    CareerTrack(
        "Data Analyst",
        ("SQL", "Python", "Data Analysis", "Data Visualization", "Statistics", "Excel"),
        ("SQL", "Data Analysis", "Data Visualization"),
        ("Analyze a public dataset end-to-end", "Build a dashboard with KPIs"),
        ("Google Data Analytics", "SQL for data analysis"),
        ("aptitude_score", "communication_score", "cgpa"),
    ),
    CareerTrack(
        "Data Scientist",
        ("Python", "Statistics", "Machine Learning", "SQL", "Data Analysis", "Communication"),
        ("Statistics", "Machine Learning", "Python"),
        ("End-to-end ML notebook on a real dataset", "Write a model evaluation report"),
        ("IBM Data Science / equivalent", "Applied statistics"),
        ("aptitude_score", "technical_score", "cgpa"),
    ),
    CareerTrack(
        "Machine Learning Engineer",
        ("Python", "Machine Learning", "SQL", "Deep Learning", "Docker", "MLOps", "DSA"),
        ("Machine Learning", "Docker", "MLOps"),
        ("Train and serialize an ML model", "Serve the model behind a REST API"),
        ("ML specialization", "Docker + cloud deployment"),
        ("coding_score", "dsa_score", "technical_score"),
    ),
    CareerTrack(
        "AI Engineer",
        ("Python", "Machine Learning", "Deep Learning", "NLP", "Docker", "Git"),
        ("Deep Learning", "NLP", "Python"),
        ("Fine-tune or prompt-orchestrate an LLM app", "Evaluate model quality with metrics"),
        ("Deep learning specialization", "Generative AI applications"),
        ("technical_score", "coding_score", "number_of_projects"),
    ),
    CareerTrack(
        "Cloud Engineer",
        ("AWS", "Linux", "Networking", "Docker", "Terraform", "Python", "CI/CD"),
        ("AWS", "Linux", "Docker"),
        ("Deploy an app on a cloud VM/container", "Write basic IaC for one service"),
        ("AWS Cloud Practitioner / AZ-900", "Linux essentials"),
        ("technical_score", "number_of_certifications", "coding_score"),
    ),
    CareerTrack(
        "DevOps Engineer",
        ("Linux", "Docker", "Kubernetes", "CI/CD", "Git", "AWS", "Python"),
        ("Docker", "CI/CD", "Linux"),
        ("Create a CI pipeline", "Containerize an existing project"),
        ("Docker + Kubernetes", "CI/CD with GitHub Actions"),
        ("technical_score", "number_of_projects", "coding_score"),
    ),
    CareerTrack(
        "Cybersecurity Analyst",
        ("Network Security", "Linux", "Networking", "Python", "Problem Solving"),
        ("Network Security", "Linux", "Networking"),
        ("Complete a beginner SOC / CTF lab", "Write a basic vulnerability report"),
        ("CompTIA Security+ / equivalent", "Network fundamentals"),
        ("aptitude_score", "technical_score", "communication_score"),
    ),
    CareerTrack(
        "Database Engineer",
        ("SQL", "PostgreSQL", "MongoDB", "Python", "Linux", "REST APIs"),
        ("SQL", "PostgreSQL", "Linux"),
        ("Design a normalized schema", "Optimize slow queries with EXPLAIN"),
        ("SQL advanced", "Database administration basics"),
        ("technical_score", "dsa_score", "coding_score"),
    ),
)


def normalize_skill(raw: str) -> str:
    key = raw.strip().lower()
    return SKILL_ALIASES.get(key, raw.strip().title())


def inferred_skills(payload: StudentAssessmentInput) -> set[str]:
    skills: set[str] = set()
    if payload.coding_score >= 65:
        skills.add("Programming")
        skills.add("Problem Solving")
    if payload.dsa_score >= 60 or payload.leetcode_problems >= 80:
        skills.add("DSA")
    if payload.technical_score >= 65:
        skills.add("REST APIs")
        skills.add("Git")
    if payload.communication_score >= 70:
        skills.add("Communication")
    if payload.aptitude_score >= 70:
        skills.add("Problem Solving")
        skills.add("Statistics")
    if payload.number_of_projects >= 2:
        skills.add("Git")
    if payload.department in {"AIML", "CSE", "IT"} and payload.technical_score >= 60:
        skills.add("Python")
    if payload.department == "AIML" and payload.technical_score >= 55:
        skills.add("Machine Learning")
    return skills


def collect_student_skills(payload: StudentAssessmentInput) -> set[str]:
    listed = [
        *payload.programming_languages,
        *payload.cloud_skills,
        *payload.database_skills,
        *payload.tools,
    ]
    skills = {normalize_skill(item) for item in listed if item and item.strip()}
    skills |= inferred_skills(payload)
    return {skill for skill in skills if skill}


def _vector(skills: set[str], universe: list[str]) -> list[float]:
    return [1.0 if name in skills else 0.0 for name in universe]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _score_bonus(payload: StudentAssessmentInput, track: CareerTrack) -> float:
    values = []
    mapping = {
        "coding_score": payload.coding_score / 100,
        "dsa_score": payload.dsa_score / 100,
        "technical_score": payload.technical_score / 100,
        "aptitude_score": payload.aptitude_score / 100,
        "communication_score": payload.communication_score / 100,
        "cgpa": payload.cgpa / 10,
        "leetcode_problems": min(payload.leetcode_problems / 250, 1.0),
        "number_of_projects": min(payload.number_of_projects / 5, 1.0),
        "number_of_certifications": min(payload.number_of_certifications / 5, 1.0),
    }
    for key in track.score_hints:
        if key in mapping:
            values.append(mapping[key])
    return sum(values) / len(values) if values else 0.0


def _reason(track: CareerTrack, match_pct: float, matched: list[str], missing: list[str]) -> str:
    matched_text = ", ".join(matched[:4]) if matched else "limited overlapping skills"
    gap_text = ", ".join(missing[:3]) if missing else "no major skill gaps"
    return (
        f"{track.name} is ranked at {match_pct:.0f}% match because the profile already "
        f"covers {matched_text}. Priority gaps: {gap_text}."
    )


def rank_careers(payload: StudentAssessmentInput) -> list[CareerRoleMatch]:
    student_skills = collect_student_skills(payload)
    universe = sorted({skill for track in CAREER_TRACKS for skill in track.required_skills})
    student_vec = _vector(student_skills, universe)

    ranked: list[CareerRoleMatch] = []
    for track in CAREER_TRACKS:
        required = set(track.required_skills)
        track_vec = _vector(required, universe)
        similarity = _cosine(student_vec, track_vec)
        bonus = _score_bonus(payload, track)
        match = 100.0 * (0.75 * similarity + 0.25 * bonus)
        matched = sorted(student_skills & required)
        missing = [skill for skill in track.required_skills if skill not in student_skills]
        ranked.append(
            CareerRoleMatch(
                career=track.name,
                match_percentage=round(match, 1),
                matching_skills=matched,
                missing_skills=missing,
                reason=_reason(track, match, matched, missing),
            )
        )

    ranked.sort(key=lambda item: item.match_percentage, reverse=True)
    return ranked


def recommend_careers(payload: StudentAssessmentInput, top_k: int = 3) -> CareerMatchResponse:
    ranked = rank_careers(payload)
    return CareerMatchResponse(
        recommendations=ranked[:top_k],
        student_skills=sorted(collect_student_skills(payload)),
    )


def skill_gap_for_career(payload: StudentAssessmentInput, career_name: str | None) -> SkillGapResponse:
    ranked = rank_careers(payload)
    chosen = ranked[0]
    if career_name:
        for item in ranked:
            if item.career.lower() == career_name.lower():
                chosen = item
                break

    track = next(t for t in CAREER_TRACKS if t.name == chosen.career)
    missing_items = []
    for skill in chosen.missing_skills:
        importance = "high" if skill in track.high_importance else "medium"
        missing_items.append(
            SkillGapItem(
                skill=skill,
                importance=importance,
                why_it_matters=f"{skill} is commonly expected for entry-level {track.name} roles.",
            )
        )
    return SkillGapResponse(
        target_career=chosen.career,
        match_percentage=chosen.match_percentage,
        matching_skills=chosen.matching_skills,
        missing_skills=missing_items,
        recommended_projects=list(track.projects),
        recommended_certifications=list(track.certifications),
    )
