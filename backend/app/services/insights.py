"""ATS keyword coverage and a 4-week improvement plan."""

from __future__ import annotations

from backend.app.schemas.schemas import StudentAssessmentInput, WeekPlan
from backend.app.services.recommendation import collect_student_skills, rank_careers

CRITICAL_KEYWORDS = [
    "Python",
    "DSA",
    "SQL",
    "Git",
    "REST APIs",
    "Problem Solving",
    "Communication",
    "Machine Learning",
    "Docker",
    "AWS",
    "React",
    "Java",
    "Linux",
    "CI/CD",
]


def compute_ats(payload: StudentAssessmentInput) -> tuple[float, list[str], list[str]]:
    skills = {s.lower() for s in collect_student_skills(payload)}
    bonus = 0.0
    if payload.number_of_internships >= 1:
        bonus += 8
    if payload.number_of_projects >= 2:
        bonus += 8
    if payload.leetcode_problems >= 100:
        bonus += 6
    if payload.communication_score >= 70:
        bonus += 5
    if payload.backlogs == 0:
        bonus += 4
    if payload.cgpa >= 7.5:
        bonus += 5

    present = []
    missing = []
    for keyword in CRITICAL_KEYWORDS:
        if keyword.lower() in skills or any(keyword.lower() in s for s in skills):
            present.append(keyword)
        else:
            missing.append(keyword)

    coverage = 100.0 * len(present) / len(CRITICAL_KEYWORDS)
    score = min(98.0, round(0.7 * coverage + bonus, 1))
    return score, present, missing[:8]


def strengths_from_thresholds(payload: StudentAssessmentInput) -> list[str]:
    items = []
    if payload.cgpa >= 8.0:
        items.append("Strong CGPA relative to typical campus shortlists")
    if payload.backlogs == 0:
        items.append("Clean academic record (no backlogs)")
    if payload.coding_score >= 75:
        items.append("Coding score is interview-ready")
    if payload.dsa_score >= 70 or payload.leetcode_problems >= 120:
        items.append("DSA / problem-solving practice is visible")
    if payload.number_of_internships >= 1:
        items.append("Internship experience to discuss in interviews")
    if payload.number_of_projects >= 3:
        items.append("Project portfolio has enough talking points")
    if payload.communication_score >= 75:
        items.append("Communication score supports HR / managerial rounds")
    if payload.attendance_percentage >= 85:
        items.append("Consistent attendance")
    return items[:6]


def improvements_from_thresholds(payload: StudentAssessmentInput) -> list[str]:
    items = []
    if payload.backlogs > 0:
        items.append(f"Clear remaining backlogs ({payload.backlogs}) before drive season")
    if payload.cgpa < 7.0:
        items.append("Raise CGPA above 7.0 — many product/service filters start there")
    if payload.coding_score < 70:
        items.append("Increase coding score with daily implementation practice")
    if payload.dsa_score < 65 or payload.leetcode_problems < 80:
        items.append("Build DSA consistency (target 100+ graded problems)")
    if payload.number_of_internships == 0:
        items.append("Complete at least one internship or equivalent freelance project")
    if payload.number_of_projects < 2:
        items.append("Ship two portfolio projects with README + live demo")
    if payload.communication_score < 65:
        items.append("Practice mock interviews and structured STAR stories")
    if payload.attendance_percentage < 75:
        items.append("Attendance is below common eligibility cutoffs")
    return items[:6]


def four_week_roadmap(payload: StudentAssessmentInput) -> list[WeekPlan]:
    ranked = rank_careers(payload)
    top = ranked[0] if ranked else None
    gaps = (top.missing_skills if top else ["DSA", "SQL", "Git"])[:4]
    while len(gaps) < 4:
        gaps.append("Interview preparation")
    role = top.career if top else "Software Engineer"
    return [
        WeekPlan(
            week=1,
            title=f"Stabilize fundamentals for {role}",
            focus=[gaps[0], "Git"],
            tasks=[
                f"Study {gaps[0]} 45 minutes daily and keep a notes file.",
                "Publish or clean your GitHub profile and pin one honest project.",
            ],
        ),
        WeekPlan(
            week=2,
            title="Close the highest skill gap",
            focus=[gaps[1], "DSA"],
            tasks=[
                f"Finish a structured intro course or playlist on {gaps[1]}.",
                "Solve 5 coding problems this week; log patterns you miss.",
            ],
        ),
        WeekPlan(
            week=3,
            title="Turn skills into evidence",
            focus=["Portfolio", gaps[2]],
            tasks=[
                f"Build or upgrade one project that showcases {role} work.",
                "Write a 10-line README: problem, approach, result, tech stack.",
            ],
        ),
        WeekPlan(
            week=4,
            title="Interview and ATS polish",
            focus=["Resume keywords", "Mocks"],
            tasks=[
                "Add missing industry keywords only where you can defend them.",
                "Do two mock interviews and revise three resume bullets with metrics.",
            ],
        ),
    ]
