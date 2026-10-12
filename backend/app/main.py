from __future__ import annotations

import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import loader
from .config import CLINICAL_DELIVERY_ENABLED, DATA_DIR, DEMO_MODE
from .db import get_profile, progress_for, save_checkin, save_completion, save_profile
from .program import build_preview_plan, enrich_exercise, pathway_for_goal
from .safety import evaluate_checkin, evaluate_intake
from .schemas import CheckInRequest, IntakeRequest, VideoAssignment

app = FastAPI(
    title="Mobility research API",
    version="0.2.0",
    description="Fail-closed research prototype. Not clinically validated. Do not store real health records.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "capacitor://localhost", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "clinical_delivery_enabled": CLINICAL_DELIVERY_ENABLED,
        "demo_mode": DEMO_MODE,
        "disclaimer": "Research prototype. Not a medical device.",
    }


@app.get("/v1/sources")
def sources() -> list[dict[str, Any]]:
    return loader.sources()


@app.get("/v1/pathways")
def pathways() -> dict[str, Any]:
    return loader.pathways()


@app.get("/v1/questionnaire")
def questionnaire() -> list[dict[str, Any]]:
    return loader.questionnaire()


@app.get("/v1/calendar")
def calendar() -> list[dict[str, Any]]:
    return loader.calendar_days()


@app.get("/v1/exercises")
def exercises(include_restricted: bool = False) -> dict[str, Any]:
    audit = loader.audit_by_id()
    items = []
    for row in loader.exercises():
        classification = audit.get(row["id"], {}).get("v2_mvp_classification")
        preview = classification == "INTRODUCTORY_CANDIDATE_REVIEW_REQUIRED"
        if not preview and not include_restricted:
            continue
        items.append(
            {
                **row,
                "classification": classification,
                "preview_only": True,
                "approved_for_delivery": False,
            }
        )
    return {
        "items": items,
        "restricted_hidden": not include_restricted,
        "note": "Restricted and unapproved exercises are omitted from user-facing lists by default.",
    }


@app.get("/v1/exercises/{exercise_id}")
def exercise_detail(exercise_id: str) -> dict[str, Any]:
    item = enrich_exercise(exercise_id)
    if not item:
        raise HTTPException(status_code=404, detail="Unknown exercise")
    if not item.get("visible_in_demo"):
        raise HTTPException(status_code=403, detail="Exercise is not available for preview")
    return item


@app.post("/v1/intake")
def intake(body: IntakeRequest) -> dict[str, Any]:
    result = evaluate_intake(body.answers)
    profile_id = body.profile_id or str(uuid.uuid4())
    save_profile(profile_id, body.first_name, body.answers, result["outcome"], body.demo)
    plan = None
    if result["outcome"] == "provisionally_eligible":
        plan = build_preview_plan(body.answers.get("primary_goal"), result["outcome"])
    return {
        "profile_id": profile_id,
        "evaluation": result,
        "plan": plan,
        "assign_exercise": False,
    }


@app.get("/v1/program/{profile_id}")
def program(profile_id: str) -> dict[str, Any]:
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Unknown profile")
    outcome = profile["outcome"]
    plan = build_preview_plan(profile["answers"].get("primary_goal"), outcome)
    if outcome != "provisionally_eligible":
        plan["days"] = [{**day, "locked": True, "movements": []} for day in plan["days"]]
    return {"profile": profile, "plan": plan}


@app.post("/v1/checkin")
def checkin(body: CheckInRequest) -> dict[str, Any]:
    payload = body.model_dump()
    result = evaluate_checkin(payload)
    save_checkin(body.profile_id, body.day, body.session_id, payload, result["action"])
    return {"evaluation": result, "auto_progress": False}


@app.post("/v1/session/complete")
def complete(body: dict[str, Any]) -> dict[str, Any]:
    profile_id = body.get("profile_id")
    day = body.get("day")
    session_id = body.get("session_id")
    if not profile_id or day is None or not session_id:
        raise HTTPException(status_code=400, detail="profile_id, day, and session_id are required")
    save_completion(str(profile_id), int(day), str(session_id))
    return {"ok": True}


@app.get("/v1/progress/{profile_id}")
def progress(profile_id: str) -> dict[str, Any]:
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Unknown profile")
    return {"profile": profile, **progress_for(profile_id)}


@app.post("/v1/admin/assign-video")
def assign_video(body: VideoAssignment) -> dict[str, Any]:
    """Developer helper for local media assignment. Not an admin product surface."""
    if not DEMO_MODE:
        raise HTTPException(status_code=403, detail="Video assignment is demo-only")
    assignments = loader.video_assignments()
    bucket = "exercises" if body.target_type == "exercise" else "education"
    assignments.setdefault(bucket, {})[body.target_id] = {
        "url": body.video_url,
        "alt_url": body.alt_video_url,
        "captions_url": body.captions_url,
        "version": body.version,
        "status": "draft",
    }
    path = DATA_DIR / "video_assignments.json"
    path.write_text(__import__("json").dumps(assignments, indent=2), encoding="utf-8")
    loader.video_assignments.cache_clear()
    return {"ok": True, "assignments": assignments}


@app.get("/v1/pathway-for-goal/{goal}")
def pathway_lookup(goal: str) -> dict[str, Any]:
    return {"goal": goal, "pathway_id": pathway_for_goal(goal)}
