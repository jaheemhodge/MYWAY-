from app.safety import evaluate_checkin, evaluate_intake


def _eligible_answers() -> dict:
    return {
        "age": 62,
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
        "chest_symptoms": "no",
        "new_weakness": "no",
        "saddle_numbness": "no",
        "acute_neurologic": "no",
        "infection_trauma": "no",
        "unexplained_pain": "no",
        "consent_limits": "yes",
        "privacy_consent": "yes",
    }


def test_missing_answers_are_not_treated_as_no():
    result = evaluate_intake({"age": 60, "primary_goal": "walks"})
    assert result["outcome"] == "clinical_review"
    assert result["assign_exercise"] is False
    assert "missing_or_unknown_required_answers" in result["reasons"]


def test_emergency_flag_blocks_assignment():
    answers = _eligible_answers()
    answers["chest_symptoms"] = "yes"
    result = evaluate_intake(answers)
    assert result["outcome"] == "emergency"
    assert result["assign_exercise"] is False


def test_fall_history_requires_review():
    answers = _eligible_answers()
    answers["falls_last_year"] = "yes"
    answers["falls_injury"] = "no"
    result = evaluate_intake(answers)
    assert result["outcome"] == "clinical_review"
    assert result["assign_exercise"] is False


def test_unsure_is_not_a_pass():
    answers = _eligible_answers()
    answers["recent_surgery"] = "unsure"
    result = evaluate_intake(answers)
    assert result["outcome"] == "clinical_review"


def test_age_out_of_scope():
    answers = _eligible_answers()
    answers["age"] = 42
    result = evaluate_intake(answers)
    assert result["outcome"] == "out_of_scope"


def test_provisionally_eligible_still_does_not_prescribe():
    result = evaluate_intake(_eligible_answers())
    assert result["outcome"] == "provisionally_eligible"
    assert result["assign_exercise"] is False


def test_checkin_worsening_blocks_next_session():
    result = evaluate_checkin({"compared_with_before": "worse", "new_or_concerning_symptoms": False})
    assert result["block_next_session"] is True
    assert result["auto_progress"] is False


def test_checkin_never_auto_progresses():
    result = evaluate_checkin({"difficulty": "too_easy", "compared_with_before": "better"})
    assert result["auto_progress"] is False
    assert result["action"] == "eligible_for_review_of_next_level_not_auto_progress"
