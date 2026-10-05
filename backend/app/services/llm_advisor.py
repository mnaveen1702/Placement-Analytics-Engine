"""OpenAI career advisor. Does not replace the ML model or recommendation engine."""

from __future__ import annotations

import json
import logging

from openai import OpenAI

from backend.app.core.config import settings
from backend.app.schemas.schemas import (
    AdvisorResponse,
    CareerMatchResponse,
    PlacementPredictionResponse,
    RoadmapMonth,
    StudentAssessmentInput,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a campus career advisor for engineering students.
You MUST only use facts present in the provided JSON context.
Do not invent CGPA, skills, internships, packages, or personal details.
The placement probability comes from a trained ML model. Do not contradict it
with a different numeric probability.
The career rankings come from a skill-similarity engine. Do not replace them
with unrelated roles.
Return STRICT JSON with this shape:
{
  "guidance": "plain language advice answering the student question",
  "roadmap": [
    {"month": 1, "title": "...", "focus": ["..."], "tasks": ["..."]},
    {"month": 2, "title": "...", "focus": ["..."], "tasks": ["..."]},
    {"month": 3, "title": "...", "focus": ["..."], "tasks": ["..."]},
    {"month": 4, "title": "...", "focus": ["..."], "tasks": ["..."]},
    {"month": 5, "title": "...", "focus": ["..."], "tasks": ["..."]}
  ]
}
"""


def _context_payload(
    assessment: StudentAssessmentInput,
    prediction: PlacementPredictionResponse,
    careers: CareerMatchResponse,
) -> dict:
    return {
        "student": {
            "department": assessment.department,
            "cgpa": assessment.cgpa,
            "backlogs": assessment.backlogs,
            "coding_score": assessment.coding_score,
            "dsa_score": assessment.dsa_score,
            "aptitude_score": assessment.aptitude_score,
            "communication_score": assessment.communication_score,
            "technical_score": assessment.technical_score,
            "internships": assessment.number_of_internships,
            "projects": assessment.number_of_projects,
            "certifications": assessment.number_of_certifications,
            "leetcode_problems": assessment.leetcode_problems,
            "programming_languages": assessment.programming_languages,
            "cloud_skills": assessment.cloud_skills,
            "database_skills": assessment.database_skills,
            "tools": assessment.tools,
            "target_career": assessment.target_career,
        },
        "ml_prediction": {
            "placement_probability": prediction.placement_probability,
            "placement_status": prediction.placement_status,
            "predicted_package_lpa": prediction.predicted_package_lpa,
            "key_strengths": prediction.key_strengths,
            "areas_to_improve": prediction.areas_to_improve,
        },
        "career_matches": [item.model_dump() for item in careers.recommendations],
        "question": assessment.question
        or "Explain my results and what I should do over the next five months.",
    }


def _template_roadmap(assessment: StudentAssessmentInput, careers: CareerMatchResponse) -> list[RoadmapMonth]:
    top = careers.recommendations[0] if careers.recommendations else None
    missing = top.missing_skills if top else ["DSA", "SQL", "Git"]
    role = top.career if top else "Software Developer"
    month_skills = (missing + ["Interview preparation", "Portfolio"])[:5]
    while len(month_skills) < 5:
        month_skills.append("Interview preparation")

    return [
        RoadmapMonth(
            month=1,
            title=f"Foundations for {role}",
            focus=[month_skills[0], "Git"],
            tasks=[
                f"Study {month_skills[0]} for 45–60 minutes daily.",
                "Publish or update a GitHub profile with README and pinned repos.",
            ],
        ),
        RoadmapMonth(
            month=2,
            title="Core technical gap",
            focus=[month_skills[1], "DSA"],
            tasks=[
                f"Complete a beginner-to-intermediate course on {month_skills[1]}.",
                "Solve 4–5 coding problems per week linked to your target role.",
            ],
        ),
        RoadmapMonth(
            month=3,
            title="Build evidence",
            focus=["Portfolio project"],
            tasks=[
                f"Build one project that demonstrates {role} skills.",
                "Write a short case study: problem, approach, result.",
            ],
        ),
        RoadmapMonth(
            month=4,
            title="Deploy and document",
            focus=[month_skills[3], "Deployment"],
            tasks=[
                "Deploy the project and record a 3-minute demo.",
                "Add tests or a simple CI workflow if relevant.",
            ],
        ),
        RoadmapMonth(
            month=5,
            title="Interview readiness",
            focus=["Aptitude", "Communication", "Mock interviews"],
            tasks=[
                "Revise aptitude and core CS fundamentals twice a week.",
                "Do two mock interviews and refine your resume bullets.",
            ],
        ),
    ]


def _template_guidance(
    assessment: StudentAssessmentInput,
    prediction: PlacementPredictionResponse,
    careers: CareerMatchResponse,
) -> str:
    top = careers.recommendations[0].career if careers.recommendations else "a software role"
    question = assessment.question or "How can I improve?"
    return (
        f"Based only on the submitted assessment, the ML model estimates a "
        f"{prediction.placement_probability:.1f}% placement probability "
        f"({prediction.placement_status} readiness). "
        f"The skill-similarity engine ranks {top} among the best current matches. "
        f"Strengths: {', '.join(prediction.key_strengths) or 'none highlighted'}. "
        f"Priority improvements: {', '.join(prediction.areas_to_improve) or 'none highlighted'}. "
        f"Regarding \"{question}\": start with the highest-impact gaps in the 5-month roadmap. "
        f"This text is a template fallback because OPENAI_API_KEY is not configured."
    )


def _parse_roadmap(raw: list) -> list[RoadmapMonth]:
    months: list[RoadmapMonth] = []
    for item in raw[:5]:
        months.append(
            RoadmapMonth(
                month=int(item.get("month", len(months) + 1)),
                title=str(item.get("title", f"Month {len(months) + 1}")),
                focus=[str(x) for x in item.get("focus", [])][:6],
                tasks=[str(x) for x in item.get("tasks", [])][:6],
            )
        )
    return months


def generate_llm_guidance(
    assessment: StudentAssessmentInput,
    prediction: PlacementPredictionResponse,
    careers: CareerMatchResponse,
) -> AdvisorResponse:
    """Generate natural-language guidance. Falls back if the API key is missing."""
    if not settings.openai_api_key:
        return AdvisorResponse(
            guidance=_template_guidance(assessment, prediction, careers),
            roadmap=_template_roadmap(assessment, careers),
            source="template_fallback",
        )

    context = _context_payload(assessment, prediction, careers)
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        completion = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(context, ensure_ascii=True),
                },
            ],
        )
        content = completion.choices[0].message.content or "{}"
        parsed = json.loads(content)
        roadmap = _parse_roadmap(parsed.get("roadmap", []))
        if len(roadmap) < 5:
            roadmap = _template_roadmap(assessment, careers)
        return AdvisorResponse(
            guidance=str(parsed.get("guidance", "")).strip()
            or _template_guidance(assessment, prediction, careers),
            roadmap=roadmap,
            source="openai",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("OpenAI advisor failed: %s", exc)
        return AdvisorResponse(
            guidance=_template_guidance(assessment, prediction, careers),
            roadmap=_template_roadmap(assessment, careers),
            source="template_fallback",
        )
