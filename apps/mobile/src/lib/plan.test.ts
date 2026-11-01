import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/app/data/library";
import {
  exerciseUnlockDay,
  FOCUS_AREAS,
  getAllDayPlans,
  getDayPlan,
  getPhase,
  getPool,
  isExerciseUnlocked,
  MINUTES_PER_EXERCISE,
  REP_RHYTHM,
  toLibraryArea,
} from "./plan";

const LIBRARY_IDS = new Set(EXERCISES.map((e) => e.id));

describe("getPhase", () => {
  it("splits 60 days into three named 20-day phases", () => {
    expect(getPhase(1)).toMatchObject({ number: 1, name: "Get familiar" });
    expect(getPhase(20)).toMatchObject({ number: 1 });
    expect(getPhase(21)).toMatchObject({ number: 2, name: "Practice them" });
    expect(getPhase(40)).toMatchObject({ number: 2 });
    expect(getPhase(41)).toMatchObject({ number: 3, name: "Stay with it" });
    expect(getPhase(60)).toMatchObject({ number: 3 });
  });

  it("clamps out-of-range days", () => {
    expect(getPhase(0).number).toBe(1);
    expect(getPhase(99).number).toBe(3);
  });
});

describe("getDayPlan", () => {
  it("is deterministic: same input, same output", () => {
    for (const area of FOCUS_AREAS) {
      for (const day of [1, 2, 19, 20, 21, 30, 45, 60]) {
        const a = getDayPlan(area, day);
        const b = getDayPlan(area, day);
        expect(a.exercises.map((e) => e.id)).toEqual(b.exercises.map((e) => e.id));
        expect(a).toEqual(b);
      }
    }
  });

  it("only uses exercises from the library, tagged with the focus area", () => {
    for (const area of FOCUS_AREAS) {
      const libraryArea = toLibraryArea(area);
      for (const plan of getAllDayPlans(area)) {
        for (const e of plan.exercises) {
          expect(LIBRARY_IDS.has(e.id)).toBe(true);
          expect(e.areas).toContain(libraryArea);
        }
      }
    }
  });

  it("respects phase gating: 1–20 phase 1, 21–40 phases 1–2, 41–60 phases 1–3", () => {
    for (const area of FOCUS_AREAS) {
      for (const plan of getAllDayPlans(area)) {
        const maxPhase = plan.day <= 20 ? 1 : plan.day <= 40 ? 2 : 3;
        for (const e of plan.exercises) expect(e.phase).toBeLessThanOrEqual(maxPhase);
        expect(plan.phase).toBe(maxPhase);
      }
    }
  });

  it("has 3–5 distinct exercises and about 10–20 minutes every day", () => {
    for (const area of FOCUS_AREAS) {
      for (const plan of getAllDayPlans(area)) {
        expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
        expect(plan.exercises.length).toBeLessThanOrEqual(5);
        expect(new Set(plan.exercises.map((e) => e.id)).size).toBe(plan.exercises.length);
        expect(plan.estimatedMinutes).toBe(plan.exercises.length * MINUTES_PER_EXERCISE);
        expect(plan.estimatedMinutes).toBeGreaterThanOrEqual(10);
        expect(plan.estimatedMinutes).toBeLessThanOrEqual(20);
      }
    }
  });

  it("rotates so consecutive days differ", () => {
    for (const area of FOCUS_AREAS) {
      const plans = getAllDayPlans(area);
      for (let i = 1; i < plans.length; i += 1) {
        const prev = plans[i - 1].exercises.map((e) => e.id).join(",");
        const next = plans[i].exercises.map((e) => e.id).join(",");
        expect(next).not.toBe(prev);
      }
    }
  });

  it("brings newly opened exercises in when a phase starts", () => {
    for (const area of FOCUS_AREAS) {
      const day21 = getDayPlan(area, 21);
      expect(day21.exercises.some((e) => e.phase === 2)).toBe(true);
      const day41 = getDayPlan(area, 41);
      // Every area has at least one phase-3 exercise tagged to it.
      if (getPool(area, 41).some((e) => e.phase === 3)) expect(day41.exercises.some((e) => e.phase === 3)).toBe(true);
    }
  });

  it("starts Knees Day 1 with the seated knee extension (K01)", () => {
    expect(getDayPlan("knees", 1).exercises[0].id).toBe("K01");
  });

  it("flags re-check days 30 and 60 only", () => {
    for (const plan of getAllDayPlans("lower_back")) {
      expect(plan.isRecheckDay).toBe(plan.day === 30 || plan.day === 60);
      expect(plan.recheckKind).toBe(plan.day === 30 ? "day30" : plan.day === 60 ? "day60" : null);
    }
  });

  it("carries the 2-1-3 rhythm and phase name", () => {
    const plan = getDayPlan("hips_balance", 33);
    expect(plan.rhythm).toEqual(REP_RHYTHM);
    expect(REP_RHYTHM).toEqual({ liftSeconds: 2, holdSeconds: 1, lowerSeconds: 3 });
    expect(plan.phaseName).toBe("Practice them");
    expect(plan.day).toBe(33);
  });
});

describe("isExerciseUnlocked", () => {
  it("opens exercises by phase start day", () => {
    const p1 = { phase: 1 as const };
    const p2 = { phase: 2 as const };
    const p3 = { phase: 3 as const };
    expect(isExerciseUnlocked(p1, 1)).toBe(true);
    expect(isExerciseUnlocked(p2, 20)).toBe(false);
    expect(isExerciseUnlocked(p2, 21)).toBe(true);
    expect(isExerciseUnlocked(p3, 40)).toBe(false);
    expect(isExerciseUnlocked(p3, 41)).toBe(true);
    expect(exerciseUnlockDay(p1)).toBe(1);
    expect(exerciseUnlockDay(p2)).toBe(21);
    expect(exerciseUnlockDay(p3)).toBe(41);
  });
});
