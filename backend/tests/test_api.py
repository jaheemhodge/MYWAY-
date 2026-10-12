from fastapi.testclient import TestClient

from app.main import app
from app.program import INTRODUCTORY_IDS, is_preview_allowed

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["clinical_delivery_enabled"] is False


def test_default_exercise_list_hides_restricted():
    response = client.get("/v1/exercises")
    ids = {item["id"] for item in response.json()["items"]}
    assert "closed_eye_balance" not in ids
    assert ids <= INTRODUCTORY_IDS


def test_restricted_exercise_detail_forbidden():
    response = client.get("/v1/exercises/closed_eye_balance")
    assert response.status_code == 403


def test_intake_emergency_returns_no_plan():
    response = client.post(
        "/v1/intake",
        json={
            "first_name": "Test",
            "answers": {
                "age": 60,
                "primary_goal": "walks",
                "provider_restrictions": "no",
                "recent_surgery": "no",
                "recent_injury": "no",
                "diagnosed_conditions": ["none"],
                "bone_health": "no",
                "falls_last_year": "no",
                "unsteady": "no",
                "fear_falling": "no",
                "assistive_device": "none",
                "dizziness": "no",
                "chest_symptoms": "yes",
                "new_weakness": "no",
                "saddle_numbness": "no",
                "acute_neurologic": "no",
                "infection_trauma": "no",
                "unexplained_pain": "no",
                "consent_limits": "yes",
                "privacy_consent": "yes",
            },
        },
    )
    body = response.json()
    assert body["evaluation"]["outcome"] == "emergency"
    assert body["plan"] is None
    assert body["assign_exercise"] is False


def test_preview_gate_keeps_excluded_out():
    assert is_preview_allowed("closed_eye_balance") is False
    assert is_preview_allowed("seated_knee_extension") is True
