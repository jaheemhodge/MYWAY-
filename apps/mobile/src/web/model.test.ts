import { describe, expect, it } from "vitest";
import {
  CHECKIN_STEPS,
  CONFIDENCE_TASKS,
  createMovementCheckIn,
  emptySafetyAnswers,
  normalizeSafetyScreen,
  safetyOutcome,
  toggleSelection,
  whatYouToldUs,
} from "./model";

describe("safety screen", () => {
  it("stays incomplete until every question is answered", () => {
    const answers = emptySafetyAnswers();
    answers.recent_surgery = "no";
    expect(safetyOutcome(answers)).toBe("incomplete");
  });

  it("continues only when every answer is no", () => {
    const answers = emptySafetyAnswers();
    for (const key of Object.keys(answers) as (keyof typeof answers)[]) answers[key] = "no";
    expect(safetyOutcome(answers)).toBe("continue");
  });

  it("pauses for yes and for not sure", () => {
    const yes = emptySafetyAnswers();
    for (const key of Object.keys(yes) as (keyof typeof yes)[]) yes[key] = "no";
    yes.falls_unsteady = "yes";
    expect(safetyOutcome(yes)).toBe("pause");

    const unsure = { ...yes, falls_unsteady: "not_sure" as const };
    expect(safetyOutcome(unsure)).toBe("pause");
  });

  it("does not trust a stored continue flag when an answer is yes", () => {
    const answers = emptySafetyAnswers();
    for (const key of Object.keys(answers) as (keyof typeof answers)[]) answers[key] = "no";
    answers.activity_symptoms = "yes";
    const stored = normalizeSafetyScreen({
      schemaVersion: 1,
      answeredAt: "2026-01-01T00:00:00.000Z",
      answers,
      outcome: "continue",
    });
    expect(stored?.outcome).toBe("pause");
  });
});

describe("movement check-in record", () => {
  it("uses one shape for baseline, day 30, and day 60", () => {
    const baseline = createMovementCheckIn("baseline", new Date("2026-04-01T00:00:00.000Z"));
    const day30 = createMovementCheckIn("day-30", new Date("2026-05-01T00:00:00.000Z"));
    const day60 = createMovementCheckIn("day-60", new Date("2026-06-01T00:00:00.000Z"));
    expect(Object.keys(baseline).sort()).toEqual(Object.keys(day30).sort());
    expect(Object.keys(baseline).sort()).toEqual(Object.keys(day60).sort());
    expect(Object.keys(baseline.confidence).sort()).toEqual(CONFIDENCE_TASKS.map((task) => task.id).sort());
  });

  it("asks one confidence question per everyday task", () => {
    const confidenceSteps = CHECKIN_STEPS.filter((step) => step.kind === "confidence").map((step) => step.id);
    expect(confidenceSteps).toEqual(["stairs", "chair", "floor", "overhead", "groceries", "balance"]);
  });

  it("plays answers back in the person's words, without a score", () => {
    const record = createMovementCheckIn("baseline");
    record.confidence.stairs = "somewhat_confident";
    record.confidence.floor = "do_not_do_this";
    record.goals = ["chair", "steadier"];
    record.sessionMinutes = "15";
    const told = whatYouToldUs(record);
    expect(told.find((item) => item.id === "stairs")?.lines).toEqual(["Somewhat confident"]);
    expect(told.find((item) => item.id === "floor")?.lines).toEqual(["I don’t do this"]);
    expect(told.find((item) => item.id === "goals")?.lines).toEqual([
      "Getting up from a chair",
      "Feeling steadier on my feet",
    ]);
    expect(JSON.stringify(told)).not.toMatch(/percentile|score|diagnos/i);
  });

  it("treats not sure about equipment as its own answer", () => {
    expect(toggleSelection(["chair", "wall"], "none_yet", "none_yet")).toEqual(["none_yet"]);
    expect(toggleSelection(["none_yet"], "chair", "none_yet")).toEqual(["chair"]);
  });
});
