from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

SafetyOutcome = Literal[
    "emergency",
    "clinical_review",
    "out_of_scope",
    "provisionally_eligible",
    "consent_refused",
]

CheckInAction = Literal[
    "pause_and_seek_assessment",
    "hold_no_progression_review_symptoms",
    "consider_easier_candidate_after_review",
    "eligible_for_review_of_next_level_not_auto_progress",
    "hold_level_and_monitor",
]


class IntakeRequest(BaseModel):
    """Raw onboarding payload. Missing safety answers stay missing — never defaulted."""

    profile_id: str | None = None
    first_name: str | None = None
    answers: dict[str, Any] = Field(default_factory=dict)
    demo: bool = True


class CheckInRequest(BaseModel):
    profile_id: str
    day: int
    session_id: str
    difficulty: Literal["too_easy", "comfortable", "too_difficult"] | None = None
    compared_with_before: Literal["better", "same", "worse"] | None = None
    new_or_concerning_symptoms: bool | None = None
    fall_or_near_fall: bool | None = None
    notes: str | None = None
    emergency_flag: bool = False


class VideoAssignment(BaseModel):
    target_type: Literal["exercise", "education"]
    target_id: str
    video_url: str
    alt_video_url: str | None = None
    captions_url: str | None = None
    version: str = "draft"
