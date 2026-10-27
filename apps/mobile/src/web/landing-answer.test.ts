import { afterEach, describe, expect, it } from "vitest";
import {
  adjacentStep,
  applyLandingAnswer,
  createLandingAnswer,
  createMovementCheckIn,
  normalizeLandingAnswer,
  visibleSteps,
  CHECKIN_STEPS,
} from "./model";
import { LANDING_ANSWER_STORAGE_KEY, clearLandingAnswer, loadLandingAnswer, saveLandingAnswer } from "./storage";

afterEach(() => localStorage.clear());

describe("landing first answer", () => {
  it("is carried into the baseline check-in", () => {
    const landing = createLandingAnswer("somewhat_confident", new Date("2026-10-27T10:00:00Z"));
    const record = createMovementCheckIn("baseline", new Date("2026-10-27T09:00:00Z"));
    expect(applyLandingAnswer(record, landing).confidence.chair).toBe("somewhat_confident");
  });

  it("does not overwrite a newer answer given inside the check-in", () => {
    const landing = createLandingAnswer("not_confident", new Date("2026-10-27T10:00:00Z"));
    const record = createMovementCheckIn("baseline", new Date("2026-10-27T09:00:00Z"));
    record.confidence.chair = "confident";
    record.updatedAt = "2026-10-27T11:00:00.000Z";
    expect(applyLandingAnswer(record, landing).confidence.chair).toBe("confident");
  });

  it("never touches a re-check or a completed check-in", () => {
    const landing = createLandingAnswer("confident");
    expect(applyLandingAnswer(createMovementCheckIn("day-30"), landing).confidence.chair).toBeNull();
    const done = createMovementCheckIn("baseline", new Date("2026-01-01T00:00:00Z"));
    done.completedAt = done.startedAt;
    expect(applyLandingAnswer(done, landing).confidence.chair).toBeNull();
  });

  it("skips the answered question in both directions", () => {
    expect(adjacentStep("stairs", 1, ["chair"])?.id).toBe("floor");
    expect(adjacentStep("floor", -1, ["chair"])?.id).toBe("stairs");
    expect(adjacentStep("chair", 1, ["chair"])?.id).toBe("floor");
    expect(visibleSteps(["chair"])).toHaveLength(CHECKIN_STEPS.length - 1);
    expect(visibleSteps(["chair"], "chair")).toHaveLength(CHECKIN_STEPS.length);
  });

  it("round-trips through storage and rejects junk", () => {
    expect(saveLandingAnswer(createLandingAnswer("very_confident"))).toBe(true);
    expect(loadLandingAnswer()?.answer).toBe("very_confident");
    clearLandingAnswer();
    expect(loadLandingAnswer()).toBeNull();
    localStorage.setItem(LANDING_ANSWER_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, taskId: "chair", answer: "great" }));
    expect(loadLandingAnswer()).toBeNull();
    expect(normalizeLandingAnswer(null)).toBeNull();
  });
});
