from __future__ import annotations

from typing import Any

YES = {"yes", "true", "y"}
NO = {"no", "false", "n"}
UNSURE = {"unsure", "unknown", "not_sure", "i'm not sure", "im not sure"}

RED_FLAG_IDS = (
    "chest_symptoms",
    "new_weakness",
    "back_bladder",
    "saddle_numbness",
    "acute_neurologic",
    "infection_trauma",
)

CLINICAL_REVIEW_IDS = (
    "provider_restrictions",
    "recent_surgery",
    "recent_injury",
    "bone_health",
    "falls_last_year",
    "falls_injury",
    "unsteady",
    "fear_falling",
    "dizziness",
    "unexplained_pain",
    "symptom_onset",
)

REQUIRED_SAFETY_IDS = (
    "provider_restrictions",
    "recent_surgery",
    "recent_injury",
    "diagnosed_conditions",
    "bone_health",
    "falls_last_year",
    "unsteady",
    "fear_falling",
    "assistive_device",
    "dizziness",
    "chest_symptoms",
    "new_weakness",
    "saddle_numbness",
    "acute_neurologic",
    "infection_trauma",
    "unexplained_pain",
    "consent_limits",
    "privacy_consent",
    "age",
    "primary_goal",
)


def _norm(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value).strip().lower()


def is_yes(value: Any) -> bool:
    return _norm(value) in YES


def is_no(value: Any) -> bool:
    return _norm(value) in NO


def is_unsure(value: Any) -> bool:
    text = _norm(value)
    return text in UNSURE or text == ""


def missing_required(answers: dict[str, Any]) -> list[str]:
    missing: list[str] = []
    for key in REQUIRED_SAFETY_IDS:
        if key == "back_bladder":
            continue
        value = answers.get(key)
        if value is None or value == "" or value == []:
            missing.append(key)
    symptoms = answers.get("symptom_areas") or []
    if isinstance(symptoms, list) and any(
        _norm(item) in {"lower_back", "back", "lower-back discomfort"} for item in symptoms
    ):
        if answers.get("back_bladder") in (None, ""):
            missing.append("back_bladder")
    if answers.get("falls_last_year") and is_yes(answers.get("falls_last_year")):
        if answers.get("falls_injury") in (None, ""):
            missing.append("falls_injury")
    return missing


def evaluate_intake(answers: dict[str, Any]) -> dict[str, Any]:
    """Fail-closed screening. Unknown is not treated as No."""

    reasons: list[str] = []
    missing = missing_required(answers)
    if missing:
        return {
            "outcome": "clinical_review",
            "action": "pause_and_seek_assessment",
            "assign_exercise": False,
            "reasons": ["missing_or_unknown_required_answers", *missing],
            "disclaimer": "Unanswered safety questions cannot be treated as No.",
        }

    if not is_yes(answers.get("consent_limits")) or not is_yes(answers.get("privacy_consent")):
        return {
            "outcome": "consent_refused",
            "action": "pause_and_seek_assessment",
            "assign_exercise": False,
            "reasons": ["consent_refused"],
            "disclaimer": "Without consent the app cannot personalize a program.",
        }

    for key in RED_FLAG_IDS:
        if key not in answers:
            continue
        if is_yes(answers.get(key)):
            reasons.append(key)
    if reasons:
        return {
            "outcome": "emergency",
            "action": "pause_and_seek_assessment",
            "assign_exercise": False,
            "reasons": reasons,
            "disclaimer": "This is not emergency monitoring. If you may be having a medical emergency, call 911.",
        }

    try:
        age = int(answers.get("age"))
    except (TypeError, ValueError):
        age = None
    if age is None or age < 50 or age > 70:
        return {
            "outcome": "out_of_scope",
            "action": "pause_and_seek_assessment",
            "assign_exercise": False,
            "reasons": ["age_outside_target_range"],
            "disclaimer": "Automated sessions are not offered outside the 50–70 research audience.",
        }

    for key in CLINICAL_REVIEW_IDS:
        value = answers.get(key)
        if value is None:
            continue
        if is_yes(value) or is_unsure(value):
            reasons.append(key)

    conditions = answers.get("diagnosed_conditions") or []
    if isinstance(conditions, str):
        conditions = [conditions]
    normalized_conditions = [_norm(item) for item in conditions]
    if any(item not in {"none", "no", ""} for item in normalized_conditions):
        reasons.append("diagnosed_conditions")

    device = _norm(answers.get("assistive_device"))
    if device and device not in {"none", "no", "i don't use one", "do_not_use"}:
        reasons.append("assistive_device")

    if _norm(answers.get("symptom_trend")) in {"worsened", "worse"}:
        reasons.append("symptom_trend_worsened")

    if reasons:
        return {
            "outcome": "clinical_review",
            "action": "pause_and_seek_assessment",
            "assign_exercise": False,
            "reasons": reasons,
            "disclaimer": "Your answers need a conversation with a clinician before any program is assigned.",
        }

    return {
        "outcome": "provisionally_eligible",
        "action": "hold_level_and_monitor",
        "assign_exercise": False,
        "reasons": ["preview_only_no_clinical_authorization"],
        "disclaimer": "Eligible to preview program structure only. No exercise is clinically approved or prescribed.",
    }


def evaluate_checkin(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("emergency_flag") or payload.get("fall_or_near_fall"):
        return {
            "action": "pause_and_seek_assessment",
            "block_next_session": True,
            "auto_progress": False,
        }
    if payload.get("new_or_concerning_symptoms") or payload.get("compared_with_before") == "worse":
        return {
            "action": "hold_no_progression_review_symptoms",
            "block_next_session": True,
            "auto_progress": False,
        }
    if payload.get("difficulty") == "too_difficult":
        return {
            "action": "consider_easier_candidate_after_review",
            "block_next_session": False,
            "auto_progress": False,
        }
    if payload.get("difficulty") == "too_easy" and payload.get("compared_with_before") == "better":
        return {
            "action": "eligible_for_review_of_next_level_not_auto_progress",
            "block_next_session": False,
            "auto_progress": False,
        }
    return {
        "action": "hold_level_and_monitor",
        "block_next_session": False,
        "auto_progress": False,
    }
