import { describe, expect, it } from "vitest";
import { evaluateCheckIn, evaluateIntake } from "./safety";

const eligible = {
  age: 62,
  primary_goal: "walks",
  provider_restrictions: "no",
  recent_surgery: "no",
  recent_injury: "no",
  diagnosed_conditions: ["none"],
  bone_health: "no",
  falls_last_year: "no",
  unsteady: "no",
  fear_falling: "no",
  assistive_device: "none",
  dizziness: "no",
  chest_symptoms: "no",
  new_weakness: "no",
  saddle_numbness: "no",
  acute_neurologic: "no",
  infection_trauma: "no",
  unexplained_pain: "no",
  consent_limits: "yes",
  privacy_consent: "yes",
};

describe("evaluateIntake", () => {
  it("does not treat missing answers as No", () => {
    const result = evaluateIntake({ age: 60, primary_goal: "walks" });
    expect(result.outcome).toBe("clinical_review");
    expect(result.assignExercise).toBe(false);
  });

  it("blocks emergency answers", () => {
    expect(evaluateIntake({ ...eligible, chest_symptoms: "yes" }).outcome).toBe("emergency");
  });

  it("holds after a reported fall", () => {
    expect(evaluateIntake({ ...eligible, falls_last_year: "yes", falls_injury: "no" }).outcome).toBe(
      "clinical_review",
    );
  });

  it("still does not prescribe when provisionally eligible", () => {
    const result = evaluateIntake(eligible);
    expect(result.outcome).toBe("provisionally_eligible");
    expect(result.assignExercise).toBe(false);
  });
});

describe("evaluateCheckIn", () => {
  it("never auto-progresses", () => {
    const result = evaluateCheckIn({ difficulty: "too_easy", comparedWithBefore: "better" });
    expect(result.autoProgress).toBe(false);
  });

  it("blocks the next session when symptoms worsen", () => {
    expect(evaluateCheckIn({ comparedWithBefore: "worse" }).blockNextSession).toBe(true);
  });
});
