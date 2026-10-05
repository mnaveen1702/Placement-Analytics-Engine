"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILES = (BACKEND_DIR / ".env", PROJECT_ROOT / ".env")

for env_path in ENV_FILES:
    if env_path.exists():
        load_dotenv(env_path, override=False)

DEFAULT_SQLITE_URL = f"sqlite:///{(BACKEND_DIR / 'placement.db').as_posix()}"


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [item.strip() for item in raw.split(",") if item.strip()]


class Settings:
    database_url: str = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or None
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    cors_origins: list[str] = _cors_origins()
    models_dir: Path = PROJECT_ROOT / "ml" / "saved_models"
    data_path: Path = PROJECT_ROOT / "ml" / "data" / "placement_data.csv"


settings = Settings()
