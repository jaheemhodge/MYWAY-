from __future__ import annotations

from typing import Any

from . import loader
from .config import CLINICAL_DELIVERY_ENABLED

PATHWAY_BY_GOAL = {
    "walks": "walk_capacity",
    "enjoy_longer_walks": "walk_capacity",
    "chair": "chair_rise",
    "get_up_from_chairs": "chair_rise",
    "morning": "morning_mobility",
    "morning_stiffness": "morning_mobility",
    "workdays": "workday_capacity",
    "workday": "workday_capacity",
    "stronger": "chair_rise",
    "confidence": "walk_capacity",
}

UI_PHASE = {
    "baseline": "foundation",
    "foundation": "foundation",
    "strength": "build_strength",
    "capacity": "progress",
    "application": "everyday_confidence",
}

INTRODUCTORY_IDS = {
    "seated_march",
    "seated_knee_extension",
    "seated_calf_toe_raise",
    "assisted_sit_stand",
    "mini_squat",
    "supported_hip_hinge",
    "wall_pushup",
    "supported_hip_extension",
    "walk_comfortable",
    "chin_retraction",
    "scapular_w",
    "pelvic_tilt_heel_slide",
    "supported_sit_back",
}

PATHWAY_PREVIEW = {
    "walk_capacity": [
        "assisted_sit_stand",
        "seated_knee_extension",
        "supported_hip_extension",
        "seated_calf_toe_raise",
        "seated_march",
    ],
    "chair_rise": [
        "assisted_sit_stand",
        "seated_knee_extension",
        "seated_march",
        "supported_hip_hinge",
        "seated_calf_toe_raise",
    ],
    "workday_capacity": [
        "assisted_sit_stand",
        "supported_hip_hinge",
        "wall_pushup",
        "seated_march",
        "walk_comfortable",
    ],
    "morning_mobility": [
        "seated_march",
        "chin_retraction",
        "scapular_w",
        "supported_hip_extension",
        "walk_comfortable",
    ],
}

EDUCATION_THEMES = [
    ("Build Stronger Support for Your Knees", "How hip, ankle, and leg strength support everyday knee comfort."),
    ("Hips That Help You Walk", "Why hip control matters for stairs, chairs, and longer walks."),
    ("Moving Your Back Comfortably", "Gentle ways to change position without forcing a stretch."),
    ("Morning Stiffness Is Common", "A calmer start to the day, without diagnosing why you feel stiff."),
    ("Stronger Legs for Everyday Life", "Chair-supported strength that shows up when you stand and walk."),
    ("Walking Capacity, Built Gradually", "Comfortable walking practice is a skill, not a step-count contest."),
    ("Shoulders You Use All Day", "Easy range and posture for reaching, carrying, and getting dressed."),
    ("Getting Up From Chairs", "The sit-to-stand pattern behind cars, sofas, and dinner tables."),
    ("Recovery and Consistency", "Rest days are part of the plan, not a setback."),
]


def pathway_for_goal(primary_goal: str | None) -> str:
    if not primary_goal:
        return "walk_capacity"
    key = primary_goal.strip().lower().replace(" ", "_")
    return PATHWAY_BY_GOAL.get(key, "walk_capacity")


def is_preview_allowed(exercise_id: str) -> bool:
    audit = loader.audit_by_id().get(exercise_id)
    if not audit:
        return False
    if audit.get("v2_mvp_classification") != "INTRODUCTORY_CANDIDATE_REVIEW_REQUIRED":
        return False
    if audit.get("clinical_approval") == "APPROVED" and CLINICAL_DELIVERY_ENABLED:
        return True
    # Preview only — never treated as a live prescription.
    return True


def enrich_exercise(exercise_id: str) -> dict[str, Any] | None:
    catalog = loader.exercise_by_id().get(exercise_id)
    audit = loader.audit_by_id().get(exercise_id)
    videos = loader.video_assignments().get("exercises", {})
    if not catalog or not audit:
        return None
    allowed = is_preview_allowed(exercise_id)
    return {
        **catalog,
        "audit": {
            "classification": audit.get("v2_mvp_classification"),
            "clinical_approval": audit.get("clinical_approval"),
            "deliverable_in_research_build": audit.get("deliverable_in_research_build"),
            "starting_dose_design_only": audit.get("starting_dose_design_only"),
            "stop_rule": audit.get("stop_rule"),
        },
        "video": videos.get(exercise_id) or {"url": "/videos/movement-placeholder.mp4", "status": "placeholder"},
        "preview_only": True,
        "approved_for_delivery": bool(CLINICAL_DELIVERY_ENABLED and audit.get("clinical_approval") == "APPROVED"),
        "visible_in_demo": allowed,
    }


def build_preview_plan(primary_goal: str | None, outcome: str) -> dict[str, Any]:
    pathway_id = pathway_for_goal(primary_goal)
    pathway = loader.pathways()[pathway_id]
    movement_ids = [item for item in PATHWAY_PREVIEW[pathway_id] if is_preview_allowed(item)]
    days = []
    for row in loader.calendar_days():
        day_n = int(row["day"])
        theme = EDUCATION_THEMES[(day_n - 1) % len(EDUCATION_THEMES)]
        day_type = row["day_type"]
        locked = outcome != "provisionally_eligible"
        demo_movements = []
        if day_type == "strength_design" and not locked:
            demo_movements = [enrich_exercise(mid) for mid in movement_ids]
            demo_movements = [item for item in demo_movements if item]
        if day_n == 1 and not locked:
            demo_movements = [
                enrich_exercise("seated_knee_extension"),
                enrich_exercise("supported_hip_extension"),
                enrich_exercise("assisted_sit_stand"),
            ]
            demo_movements = [item for item in demo_movements if item]
        days.append(
            {
                **row,
                "day": day_n,
                "ui_phase": UI_PHASE.get(row["phase"], row["phase"]),
                "theme_title": theme[0] if day_n == 1 else (theme[0] if day_type in {"education", "strength_design"} else theme[0]),
                "theme_summary": theme[1],
                "demonstration": True,
                "locked": locked,
                "approved_prescription": False,
                "movements": demo_movements if day_type in {"strength_design"} and not locked else [],
            }
        )
        if day_n == 1:
            days[-1]["theme_title"] = "Build Stronger Support for Your Knees"
            days[-1]["theme_summary"] = (
                "An introduction to how leg, hip, and ankle strength support everyday knee function. "
                "This is education and a draft demonstration — not a diagnosis of knee pain."
            )
    return {
        "pathway_id": pathway_id,
        "pathway": pathway,
        "clinical_delivery_enabled": CLINICAL_DELIVERY_ENABLED,
        "demonstration": True,
        "days": days,
    }
