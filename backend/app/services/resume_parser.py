"""Resume PDF parser service using pypdf."""

from __future__ import annotations

import io
import re
from typing import Any

from pypdf import PdfReader

# Known skill option lists matching frontend form defaults
KNOWN_LANGUAGES = ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go"]
KNOWN_CLOUD = ["AWS", "Azure", "GCP", "Docker", "Kubernetes"]
KNOWN_DATABASES = ["SQL", "PostgreSQL", "MySQL", "MongoDB"]
KNOWN_TOOLS = [
    "Git",
    "Linux",
    "CI/CD",
    "Terraform",
    "React",
    "Node.js",
    "REST APIs",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Data Analysis",
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Safely extract all text content from PDF file bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
        return "\n".join(pages_text)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Failed to read PDF file: {exc}") from exc


def _count_projects(text: str) -> int:
    """Infer number of projects based on section headers and bullet points."""
    text_lower = text.lower()
    lines = text.splitlines()

    in_project_section = False
    project_bullets = 0
    project_keywords_found = 0

    for line in lines:
        line_clean = line.strip()
        line_lower = line_clean.lower()

        # Detect section header start
        if any(h in line_lower for h in ["projects", "personal projects", "academic projects", "key projects"]):
            in_project_section = True
            continue

        # If another section header starts, exit project section
        if in_project_section and any(
            h in line_lower
            for h in ["experience", "education", "skills", "certifications", "achievements", "work history"]
        ):
            in_project_section = False

        if in_project_section:
            if re.match(r"^[-•*▪▸\d+\.]", line_clean):
                project_bullets += 1
            elif line_clean and len(line_clean) > 5 and not line_lower.startswith(("http", "github")):
                # Heading candidate inside project section
                project_keywords_found += 1

    if project_bullets > 0:
        # Estimate ~2-3 bullets per project, or heading count
        estimated = max(1, round(project_bullets / 2.5))
        return min(12, max(estimated, project_keywords_found))

    # Fallback keyword match count
    matches = len(re.findall(r"\b(project|built|developed|implemented|created|designed)\b", text_lower))
    if matches == 0:
        return 1 if "github.com" in text_lower else 0
    return min(10, max(1, round(matches / 3)))


def _count_internships(text: str) -> int:
    """Infer number of internships / work experiences from keywords and section entries."""
    text_lower = text.lower()

    # Direct keyword matches
    intern_matches = len(re.findall(r"\b(intern|internship|trainee|apprentice|co-op)\b", text_lower))
    exp_matches = len(re.findall(r"\b(work experience|professional experience|employment)\b", text_lower))

    if intern_matches > 0:
        return min(6, intern_matches)

    if exp_matches > 0 and ("developer" in text_lower or "engineer" in text_lower):
        return min(4, 1)

    return 0


def _estimate_coding_score(text: str) -> int:
    """Estimate a 0-100 coding score based on languages, DSA, frameworks, and coding platform mentions."""
    text_lower = text.lower()
    score = 45  # base score

    # Language matches
    lang_matches = 0
    for lang in KNOWN_LANGUAGES:
        if re.search(rf"\b{re.escape(lang.lower())}\b", text_lower):
            lang_matches += 1
    score += min(25, lang_matches * 6)

    # DSA & Problem Solving
    dsa_keywords = [
        "dsa",
        "data structures",
        "algorithms",
        "leetcode",
        "codeforces",
        "codechef",
        "hackerrank",
        "problem solving",
        "competitive programming",
    ]
    dsa_found = sum(1 for kw in dsa_keywords if kw in text_lower)
    score += min(20, dsa_found * 7)

    # Web & Frameworks
    tech_keywords = ["react", "node", "fastapi", "django", "spring", "c++", "python", "java", "sql", "git"]
    tech_found = sum(1 for kw in tech_keywords if kw in text_lower)
    score += min(15, tech_found * 2)

    # Leetcode count mentions e.g. "solved 200+"
    lc_num_match = re.search(r"(\d+)\+?\s*(problems|leetcode|questions|challenges)", text_lower)
    if lc_num_match:
        try:
            num = int(lc_num_match.group(1))
            if num > 300:
                score += 10
            elif num > 100:
                score += 5
        except ValueError:
            pass

    return min(95, max(35, score))


def _calculate_resume_ats_score(text: str) -> int:
    """Calculate 0-100 ATS score via section completeness & formatting heuristics."""
    text_lower = text.lower()
    score = 0

    # Contact Info check (20 pts)
    has_email = "@" in text
    has_phone = bool(re.search(r"\b\d{10}\b|\+\d{1,3}", text))
    if has_email:
        score += 10
    if has_phone:
        score += 10

    # Education Section (20 pts)
    if any(k in text_lower for k in ["education", "b.tech", "btech", "b.e", "degree", "university", "college"]):
        score += 20

    # Experience / Internship Section (20 pts)
    if any(k in text_lower for k in ["experience", "internship", "employment", "work history", "projects"]):
        score += 20

    # Skills Section (20 pts)
    if any(k in text_lower for k in ["skills", "technical skills", "technologies", "tech stack", "languages"]):
        score += 20

    # Text length / formatting heuristic (20 pts)
    word_count = len(text.split())
    if 200 <= word_count <= 1200:
        score += 20
    elif 100 <= word_count <= 2000:
        score += 10

    return min(98, max(30, score))


def _extract_matched_skills(text: str, options: list[str]) -> list[str]:
    """Find matching items from options list in resume text."""
    text_lower = text.lower()
    matched = []
    for opt in options:
        opt_lower = opt.lower()
        if opt_lower == "c++":
            if "c++" in text_lower or "cpp" in text_lower:
                matched.append(opt)
        elif opt_lower == "c#":
            if "c#" in text_lower or "csharp" in text_lower:
                matched.append(opt)
        elif opt_lower == "rest apis":
            if "rest" in text_lower or "api" in text_lower:
                matched.append(opt)
        elif opt_lower == "machine learning":
            if "machine learning" in text_lower or " ml " in text_lower or "ml/" in text_lower:
                matched.append(opt)
        elif opt_lower == "deep learning":
            if "deep learning" in text_lower or " dl " in text_lower:
                matched.append(opt)
        elif opt_lower == "sql":
            if re.search(r"\bsql\b", text_lower):
                matched.append(opt)
        elif opt_lower == "git":
            if re.search(r"\bgit\b", text_lower):
                matched.append(opt)
        elif opt_lower == "aws":
            if re.search(r"\baws\b", text_lower):
                matched.append(opt)
        elif opt_lower == "gcp":
            if re.search(r"\bgcp\b", text_lower):
                matched.append(opt)
        else:
            if re.search(rf"\b{re.escape(opt_lower)}\b", text_lower):
                matched.append(opt)
    return matched


def parse_resume_pdf(file_bytes: bytes) -> dict[str, Any]:
    """Parse PDF resume bytes and return extracted metrics for pre-filling form fields."""
    text = extract_text_from_pdf(file_bytes)

    projects_count = _count_projects(text)
    internships_count = _count_internships(text)
    coding_score_est = _estimate_coding_score(text)
    resume_ats_score = _calculate_resume_ats_score(text)

    detected_languages = _extract_matched_skills(text, KNOWN_LANGUAGES)
    detected_cloud = _extract_matched_skills(text, KNOWN_CLOUD)
    detected_databases = _extract_matched_skills(text, KNOWN_DATABASES)
    detected_tools = _extract_matched_skills(text, KNOWN_TOOLS)

    # Name & email heuristic extraction
    extracted_email = ""
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    if email_match:
        extracted_email = email_match.group(0)

    return {
        "projects_count": projects_count,
        "internships_count": internships_count,
        "coding_score_est": coding_score_est,
        "resume_ats_score": resume_ats_score,
        "detected_languages": detected_languages,
        "detected_cloud": detected_cloud,
        "detected_databases": detected_databases,
        "detected_tools": detected_tools,
        "extracted_email": extracted_email,
        "raw_text_length": len(text),
    }
