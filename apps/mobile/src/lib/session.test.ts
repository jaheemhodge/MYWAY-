import { describe, expect, it } from "vitest";
import { EXERCISES, type Exercise } from "@/app/data/library";
import {
  back,
  completedRecords,
  createSession,
  cuesBetween,
  doseFor,
  markSetDone,
  next,
  pause,
  restore,
  resume,
  secondsLeft,
  serialize,
  SESSION_DEFAULTS,
  skipExercise,
  skipRest,
  snapshot,
  start,
  tick,
  timerMode,
  workSeconds,
} from "./session";

const THREE = EXERCISES.slice(0, 3);
const T0 = 1_700_000_000_000;
const WORK_MS = workSeconds(doseFor(THREE[0])) * 1000; // 8 reps × 6 s = 48 s
const REST_SET_MS = SESSION_DEFAULTS.restBetweenSetsSeconds * 1000;
const REST_EX_MS = SESSION_DEFAULTS.restBetweenExercisesSeconds * 1000;

describe("doseFor", () => {
  it("falls back to 2 sets × 8 reps at the 2-1-3 rhythm when the data has no dose", () => {
    const dose = doseFor(THREE[0]);
    expect(dose).toEqual({ sets: 2, reps: 8, holdSeconds: null, usedDefaults: true });
    expect(SESSION_DEFAULTS.secondsPerRep).toBe(6);
    expect(workSeconds(dose)).toBe(48);
  });

  it("uses exercise data when present and flags nothing as defaulted", () => {
    const withDose: Exercise = { ...THREE[0], sets: 3, reps: 10 };
    expect(doseFor(withDose)).toEqual({ sets: 3, reps: 10, holdSeconds: null, usedDefaults: false });
    const hold: Exercise = { ...THREE[0], sets: 1, holdSeconds: 20 };
    expect(doseFor(hold)).toEqual({ sets: 1, reps: null, holdSeconds: 20, usedDefaults: false });
    expect(workSeconds(doseFor(hold))).toBe(20);
  });

  it("partially defaulted doses are still flagged", () => {
    expect(doseFor({ ...THREE[0], holdSeconds: 15 }).usedDefaults).toBe(true);
  });
});

describe("timer", () => {
  it("counts down from timestamps, not ticks", () => {
    let s = start(createSession(1, THREE), T0);
    expect(timerMode(s)).toBe("reps");
    expect(secondsLeft(s, T0)).toBe(48);
    expect(secondsLeft(s, T0 + 10_000)).toBe(38);
    expect(secondsLeft(s, T0 + 47_100)).toBe(1);
    s = tick(s, T0 + 10_000);
    expect(s.segment).toBe("work");
  });

  it("pause freezes the clock and resume continues from where it stopped", () => {
    let s = start(createSession(1, THREE), T0);
    s = pause(s, T0 + 10_000);
    expect(s.running).toBe(false);
    expect(secondsLeft(s, T0 + 999_000)).toBe(38);
    s = resume(s, T0 + 60_000);
    expect(secondsLeft(s, T0 + 60_000)).toBe(38);
    expect(secondsLeft(s, T0 + 65_000)).toBe(33);
  });

  it("rolls into the rest between sets when the work segment elapses, carrying overflow", () => {
    let s = start(createSession(1, THREE), T0);
    s = tick(s, T0 + WORK_MS + 2_000);
    expect(s.segment).toBe("rest-set");
    expect(s.set).toBe(1);
    expect(timerMode(s)).toBe("rest");
    expect(secondsLeft(s, T0 + WORK_MS + 2_000)).toBe(SESSION_DEFAULTS.restBetweenSetsSeconds - 2);
  });

  it("settles several segments at once after a long gap (tab hidden), timing exact", () => {
    let s = start(createSession(1, THREE), T0);
    // work 48 s + rest 30 s + work 48 s + rest-exercise 45 s = 171 s; 5 s into exercise 2's work.
    const later = T0 + WORK_MS + REST_SET_MS + WORK_MS + REST_EX_MS + 5_000;
    s = tick(s, later);
    expect(s.index).toBe(1);
    expect(s.set).toBe(1);
    expect(s.segment).toBe("work");
    expect(secondsLeft(s, later)).toBe(43);
    expect(s.exercisesDone[0]).toEqual({ id: THREE[0].id, status: "completed", setsDone: 2 });
  });

  it("finishes the day after every exercise has run its course", () => {
    let s = start(createSession(1, THREE), T0);
    s = tick(s, T0 + 3 * (2 * WORK_MS + REST_SET_MS) + 2 * REST_EX_MS + 1);
    expect(s.readyToFinish).toBe(true);
    expect(s.running).toBe(false);
    expect(secondsLeft(s, T0 + 10 ** 9)).toBe(0);
    expect(completedRecords(s).map((r) => r.status)).toEqual(["completed", "completed", "completed"]);
  });
});

describe("manual controls", () => {
  it("markSetDone moves to the set rest, then the next set; the last set ends the exercise with a rest", () => {
    let s = start(createSession(1, THREE), T0);
    s = markSetDone(s, T0 + 5_000);
    expect(s.segment).toBe("rest-set");
    s = skipRest(s, T0 + 6_000);
    expect(s.segment).toBe("work");
    expect(s.set).toBe(2);
    s = markSetDone(s, T0 + 7_000);
    expect(s.segment).toBe("rest-exercise");
    expect(s.index).toBe(0);
    expect(s.exercisesDone[0]).toEqual({ id: THREE[0].id, status: "completed", setsDone: 2 });
    s = skipRest(s, T0 + 8_000);
    expect(s.index).toBe(1);
    expect(s.set).toBe(1);
  });

  it("next records the exercise as completed with the sets done so far and skips the rest", () => {
    let s = start(createSession(1, THREE), T0);
    s = next(s, T0 + 1_000);
    expect(s.index).toBe(1);
    expect(s.segment).toBe("work");
    expect(s.exercisesDone[0]).toEqual({ id: THREE[0].id, status: "completed", setsDone: 0 });
  });

  it("skipExercise records skipped and keeps the sets already done", () => {
    let s = start(createSession(1, THREE), T0);
    s = markSetDone(s, T0 + 1_000);
    s = skipExercise(s, T0 + 2_000);
    expect(s.index).toBe(1);
    expect(s.exercisesDone[0]).toEqual({ id: THREE[0].id, status: "skipped", setsDone: 1 });
  });

  it("back returns to the previous exercise and clears both records so they are redone", () => {
    let s = start(createSession(1, THREE), T0);
    s = next(s, T0 + 1_000);
    s = next(s, T0 + 2_000);
    expect(s.index).toBe(2);
    s = back(s, T0 + 3_000);
    expect(s.index).toBe(1);
    expect(s.set).toBe(1);
    expect(s.segment).toBe("work");
    expect(s.exercisesDone[1]).toBeNull();
    expect(s.exercisesDone[2]).toBeNull();
    expect(s.exercisesDone[0]).not.toBeNull();
    expect(secondsLeft(s, T0 + 3_000)).toBe(48);
  });

  it("back on the first exercise restarts it; back after the last exercise reopens it", () => {
    let s = start(createSession(1, THREE), T0);
    s = markSetDone(s, T0 + 1_000);
    s = back(s, T0 + 2_000);
    expect(s.index).toBe(0);
    expect(s.set).toBe(1);
    expect(s.segment).toBe("work");

    s = next(s, T0 + 3_000);
    s = next(s, T0 + 4_000);
    s = next(s, T0 + 5_000);
    expect(s.readyToFinish).toBe(true);
    s = back(s, T0 + 6_000);
    expect(s.readyToFinish).toBe(false);
    expect(s.index).toBe(2);
    expect(s.running).toBe(true);
    expect(s.exercisesDone[2]).toBeNull();
  });

  it("skipExercise on every exercise still produces a full record list", () => {
    let s = start(createSession(1, THREE), T0);
    s = skipExercise(s, T0 + 1);
    s = skipExercise(s, T0 + 2);
    s = skipExercise(s, T0 + 3);
    expect(s.readyToFinish).toBe(true);
    expect(completedRecords(s)).toEqual(THREE.map((e) => ({ id: e.id, status: "skipped", setsDone: 0 })));
  });

  it("actions are no-ops when they do not apply", () => {
    const fresh = createSession(1, THREE);
    expect(resume(fresh, T0)).toBe(fresh);
    expect(pause(fresh, T0)).toBe(fresh);
    const running = start(fresh, T0);
    expect(skipRest(running, T0 + 1)).toBe(running);
    expect(start(running, T0 + 1)).toBe(running);
  });
});

describe("persistence", () => {
  it("round-trips through serialize/restore as a paused session at the same exercise, set and time", () => {
    let s = start(createSession(1, THREE), T0);
    s = next(s, T0 + 1_000);
    s = markSetDone(s, T0 + 2_000);
    s = skipRest(s, T0 + 3_000);
    const saved = JSON.parse(JSON.stringify(serialize(s, T0 + 13_000)));
    const restored = restore(saved, 1, THREE);
    expect(restored).not.toBeNull();
    expect(restored!.index).toBe(1);
    expect(restored!.set).toBe(2);
    expect(restored!.segment).toBe("work");
    expect(restored!.started).toBe(true);
    expect(restored!.running).toBe(false);
    expect(secondsLeft(restored!, T0 + 999_999)).toBe(38);
    expect(restored!.exercisesDone[0]).toEqual({ id: THREE[0].id, status: "completed", setsDone: 0 });
  });

  it("refuses snapshots for another day, a changed plan, or garbage", () => {
    const s = start(createSession(1, THREE), T0);
    const saved = serialize(s, T0);
    expect(restore(saved, 2, THREE)).toBeNull();
    expect(restore(saved, 1, EXERCISES.slice(1, 4))).toBeNull();
    expect(restore(null, 1, THREE)).toBeNull();
    expect(restore({ v: 2 }, 1, THREE)).toBeNull();
    expect(restore({ ...saved, index: 99 }, 1, THREE)).toBeNull();
  });
});

describe("cues", () => {
  it("emits start, halfway, countdown, set-done and ready-to-finish", () => {
    let s = start(createSession(1, THREE), T0);
    let prev = snapshot(s, T0);
    expect(cuesBetween(null, prev, true).map((c) => c.type)).toEqual(["start"]);

    let cur = snapshot(s, T0 + 24_000);
    expect(cuesBetween(prev, cur, true)).toEqual([{ type: "halfway", segment: "work" }]);
    prev = cur;

    cur = snapshot(s, T0 + 45_000);
    expect(cuesBetween(prev, cur, true)).toEqual([{ type: "countdown", secondsLeft: 3 }]);
    prev = cur;

    s = tick(s, T0 + WORK_MS + 100);
    cur = snapshot(s, T0 + WORK_MS + 100);
    expect(cuesBetween(prev, cur, true).map((c) => c.type)).toEqual(["set-done", "start"]);
    prev = cur;

    s = next(next(next(s, T0 + 50_000), T0 + 50_001), T0 + 50_002);
    cur = snapshot(s, T0 + 50_002);
    const types = cuesBetween(prev, cur, true).map((c) => c.type);
    expect(types).toContain("exercise-done");
    expect(types).toContain("ready-to-finish");
  });

  it("is silent before the session starts", () => {
    const s = createSession(1, THREE);
    expect(cuesBetween(null, snapshot(s, T0), false)).toEqual([]);
  });
});
