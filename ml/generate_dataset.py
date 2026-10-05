"""
Phase 2: Realistic synthetic campus-placement dataset.

Labels are NOT assigned with simple if/else rules. A latent employability
score (with noise) is converted to a placement probability, then sampled.
Gender is not used in the label-generating process (avoids encoding bias).

This is a scientifically valid synthetic dataset for academic use when a
complete public dataset with all required fields is not available.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

RANDOM_SEED = 42
N_SAMPLES = 1500

DATA_DIR = Path(__file__).resolve().parent / "data"
OUTPUT_PATH = DATA_DIR / "placement_data.csv"

DEPARTMENTS = np.array(
    ["CSE", "IT", "AIML", "ECE", "EEE", "MECH", "CIVIL"]
)
# Mild campus-drive effect: CSE/IT/AIML see more IT recruiters, not "ability".
DEPT_PLACEMENT_SHIFT = {
    "CSE": 0.18,
    "IT": 0.12,
    "AIML": 0.15,
    "ECE": 0.02,
    "EEE": -0.08,
    "MECH": -0.22,
    "CIVIL": -0.28,
}


def _clip(values: np.ndarray, low: float, high: float) -> np.ndarray:
    return np.clip(values, low, high)


def generate_placement_dataset(
    n_samples: int = N_SAMPLES, seed: int = RANDOM_SEED
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # Shared latent academic factor so 10th, 12th, and CGPA co-vary realistically.
    academic_factor = rng.normal(0.0, 1.0, n_samples)
    effort_factor = rng.normal(0.0, 1.0, n_samples)
    coding_factor = rng.normal(0.0, 1.0, n_samples)

    tenth_percentage = _clip(
        72 + 10 * academic_factor + rng.normal(0, 6, n_samples), 50, 98
    )
    twelfth_percentage = _clip(
        70
        + 8 * academic_factor
        + 0.25 * (tenth_percentage - 72)
        + rng.normal(0, 6, n_samples),
        48,
        98,
    )
    cgpa = _clip(
        7.2
        + 0.55 * academic_factor
        + 0.25 * effort_factor
        + rng.normal(0, 0.55, n_samples),
        5.0,
        9.9,
    )

    attendance_percentage = _clip(
        82 + 6 * effort_factor - 4 * (cgpa < 6.5).astype(float) + rng.normal(0, 7, n_samples),
        55,
        100,
    )

    # Backlogs: higher when CGPA/attendance are lower (count data).
    backlog_rate = np.exp(
        0.15 - 0.55 * (cgpa - 7.0) - 0.02 * (attendance_percentage - 80)
    )
    backlogs = rng.poisson(np.clip(backlog_rate, 0.05, 4.5)).astype(int)
    backlogs = np.clip(backlogs, 0, 8)

    aptitude_score = _clip(
        62 + 8 * academic_factor + 6 * effort_factor + rng.normal(0, 10, n_samples),
        20,
        100,
    )
    coding_score = _clip(
        55 + 14 * coding_factor + 4 * effort_factor + rng.normal(0, 11, n_samples),
        15,
        100,
    )
    dsa_score = _clip(
        0.55 * coding_score + 20 + 8 * coding_factor + rng.normal(0, 9, n_samples),
        10,
        100,
    )
    technical_score = _clip(
        0.35 * coding_score
        + 0.25 * aptitude_score
        + 18
        + 5 * academic_factor
        + rng.normal(0, 8, n_samples),
        15,
        100,
    )
    communication_score = _clip(
        60 + 8 * effort_factor + rng.normal(0, 12, n_samples), 20, 100
    )

    number_of_projects = np.clip(
        rng.poisson(np.clip(1.4 + 0.7 * coding_factor + 0.4 * effort_factor, 0.2, 5)),
        0,
        8,
    ).astype(int)
    number_of_internships = np.clip(
        rng.poisson(
            np.clip(0.55 + 0.35 * (cgpa - 7.0) + 0.25 * (coding_score / 50), 0.05, 2.5)
        ),
        0,
        4,
    ).astype(int)
    number_of_certifications = np.clip(
        rng.poisson(np.clip(1.2 + 0.4 * effort_factor, 0.2, 5)), 0, 10
    ).astype(int)

    leetcode_problems = np.clip(
        rng.negative_binomial(6, 0.08, n_samples)
        + (0.9 * coding_score + 0.6 * dsa_score).astype(int)
        - 70
        + rng.integers(-15, 16, n_samples),
        0,
        520,
    ).astype(int)

    gender = rng.choice(
        np.array(["Male", "Female", "Other"]),
        size=n_samples,
        p=np.array([0.54, 0.44, 0.02]),
    )
    department = rng.choice(
        DEPARTMENTS,
        size=n_samples,
        p=np.array([0.28, 0.16, 0.14, 0.16, 0.10, 0.09, 0.07]),
    )
    dept_shift = np.array([DEPT_PLACEMENT_SHIFT[d] for d in department])

    # Latent employability. Coefficients are modest + Gaussian noise so
    # accuracy cannot be 100% and relationships stay imperfect.
    z = (
        0.85 * ((cgpa - 7.2) / 0.9)
        + 0.18 * ((tenth_percentage - 72) / 10)
        + 0.22 * ((twelfth_percentage - 70) / 10)
        - 0.55 * backlogs
        + 0.20 * ((attendance_percentage - 82) / 8)
        + 0.35 * ((aptitude_score - 62) / 12)
        + 0.55 * ((coding_score - 55) / 14)
        + 0.32 * ((communication_score - 60) / 12)
        + 0.38 * ((technical_score - 60) / 12)
        + 0.48 * ((dsa_score - 55) / 14)
        + 0.18 * number_of_projects
        + 0.42 * number_of_internships
        + 0.08 * number_of_certifications
        + 0.0022 * leetcode_problems
        + dept_shift
        + rng.normal(0.0, 0.85, n_samples)
    )

    # Intercept chosen so overall placement rate is roughly 55–70% (typical
    # for mixed engineering campuses, not a perfectly balanced toy set).
    placement_probability = 1.0 / (1.0 + np.exp(-z + 0.15))
    placement_status = rng.binomial(1, placement_probability)

    # Package only meaningful for placed students.
    package_signal = (
        3.2
        + 0.55 * (cgpa - 7.0)
        + 0.018 * coding_score
        + 0.012 * dsa_score
        + 0.45 * number_of_internships
        + 0.004 * leetcode_problems
        + rng.normal(0.0, 0.85, n_samples)
    )
    package_lpa = np.where(
        placement_status == 1,
        np.round(_clip(package_signal, 2.4, 22.0), 2),
        0.0,
    )

    frame = pd.DataFrame(
        {
            "student_id": [f"STU{str(i + 1).zfill(4)}" for i in range(n_samples)],
            "gender": gender,
            "department": department,
            "cgpa": np.round(cgpa, 2),
            "tenth_percentage": np.round(tenth_percentage, 2),
            "twelfth_percentage": np.round(twelfth_percentage, 2),
            "backlogs": backlogs,
            "attendance_percentage": np.round(attendance_percentage, 2),
            "aptitude_score": np.round(aptitude_score, 2),
            "coding_score": np.round(coding_score, 2),
            "communication_score": np.round(communication_score, 2),
            "technical_score": np.round(technical_score, 2),
            "dsa_score": np.round(dsa_score, 2),
            "number_of_projects": number_of_projects,
            "number_of_internships": number_of_internships,
            "number_of_certifications": number_of_certifications,
            "leetcode_problems": leetcode_problems,
            "placement_status": placement_status,
            "package_lpa": package_lpa,
        }
    )
    return frame


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = generate_placement_dataset()
    df.to_csv(OUTPUT_PATH, index=False)

    placed = int(df["placement_status"].sum())
    rate = placed / len(df)
    print(f"Saved {len(df)} rows to {OUTPUT_PATH}")
    print(f"Placement rate: {rate:.3f} ({placed} placed, {len(df) - placed} not placed)")
    print(f"Package (placed) mean: {df.loc[df['placement_status'] == 1, 'package_lpa'].mean():.2f} LPA")
    print(df.head(3).to_string(index=False))


if __name__ == "__main__":
    main()
