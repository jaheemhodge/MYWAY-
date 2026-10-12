from __future__ import annotations

import csv
import json
from functools import lru_cache
from typing import Any

from .config import DATA_DIR


def _read_json(name: str) -> Any:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def exercises() -> list[dict[str, Any]]:
    return _read_json("exercises.json")


@lru_cache(maxsize=1)
def exercise_audit() -> list[dict[str, Any]]:
    return _read_json("exercise_audit_61.json")


@lru_cache(maxsize=1)
def sources() -> list[dict[str, Any]]:
    return _read_json("sources.json")


@lru_cache(maxsize=1)
def pathways() -> dict[str, Any]:
    return _read_json("pathways.json")


@lru_cache(maxsize=1)
def questionnaire() -> list[dict[str, Any]]:
    return _read_json("onboarding_questionnaire.json")


@lru_cache(maxsize=1)
def calendar_days() -> list[dict[str, Any]]:
    path = DATA_DIR / "60_day_calendar.csv"
    with path.open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def video_assignments() -> dict[str, Any]:
    path = DATA_DIR / "video_assignments.json"
    if not path.exists():
        return {"exercises": {}, "education": {}, "version": "0.1.0-demo"}
    return json.loads(path.read_text(encoding="utf-8"))


def audit_by_id() -> dict[str, dict[str, Any]]:
    return {row["id"]: row for row in exercise_audit()}


def exercise_by_id() -> dict[str, dict[str, Any]]:
    return {row["id"]: row for row in exercises()}
