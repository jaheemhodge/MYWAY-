import { describe, expect, it } from "vitest";
import { MOVEMENTS } from "../content/movements";
import { buildPlan } from "./program";

describe("buildPlan", () => {
  it("marks day 1 as the knee-support draft session", () => {
    const plan = buildPlan("walk_capacity", false);
    expect(plan[0].title).toBe("Build Stronger Support for Your Knees");
    expect(plan[0].movements.map((item) => item.id)).toEqual([
      "seated_knee_extension",
      "supported_hip_extension",
      "assisted_sit_stand",
    ]);
    expect(plan[0].approvedPrescription).toBe(false);
  });

  it("locks movements when the user is not provisionally eligible", () => {
    const plan = buildPlan("walk_capacity", true);
    expect(plan.every((day) => day.locked && day.movements.length === 0)).toBe(true);
  });

  it("never includes excluded movements", () => {
    expect(MOVEMENTS.closed_eye_balance).toBeUndefined();
  });
});
