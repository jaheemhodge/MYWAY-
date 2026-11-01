/**
 * Session engine: a pure state machine for one day's session. No React, no timers of its own.
 *
 * Every transition takes `now` (ms since epoch) and the timer is derived from timestamps, so a
 * throttled or hidden tab never drifts the clock. The React hook (src/app/state/useSession.ts)
 * owns persistence, visibility handling and the RPC call.
 *
 * Shape of a session:
 *   exercise 1: work set 1 → rest → work set 2 → … → rest-exercise
 *   exercise 2: …
 *   last exercise finishes → readyToFinish (the UI calls finishDay)
 */
import type { Exercise } from "@/app/data/library";
import type { ExerciseDoneRecord } from "./database.types";
import { REP_RHYTHM } from "./plan";

/* ------------------------------------------------------------------------------------------------
 * Dose and defaults
 * ---------------------------------------------------------------------------------------------- */

/**
 * Used only when an exercise has no sets/reps/hold in the data (true for every exercise in
 * library-slim.json today). `usedDefaults` is flagged on the dose so the UI can say so.
 * 2 sets × 8 reps × 6 s (2-1-3) + 30 s rest + 45 s rest ≈ 2.9 min, matching MINUTES_PER_EXERCISE.
 */
export const SESSION_DEFAULTS = {
  sets: 2,
  reps: 8,
  holdSeconds: null as number | null,
  secondsPerRep: REP_RHYTHM.liftSeconds + REP_RHYTHM.holdSeconds + REP_RHYTHM.lowerSeconds,
  restBetweenSetsSeconds: 30,
  restBetweenExercisesSeconds: 45,
} as const;

export interface Dose {
  sets: number;
  /** Reps per set, or null for a timed hold. */
  reps: number | null;
  /** Seconds to hold, or null for a rep-based set. */
  holdSeconds: number | null;
  usedDefaults: boolean;
}

type DoseSource = Pick<Exercise, "sets" | "reps" | "holdSeconds">;

function positiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function doseFor(exercise: DoseSource): Dose {
  const sets = positiveInt(exercise.sets);
  const reps = positiveInt(exercise.reps);
  const hold = positiveInt(exercise.holdSeconds);
  if (hold !== null) {
    return { sets: sets ?? SESSION_DEFAULTS.sets, reps: null, holdSeconds: hold, usedDefaults: sets === null };
  }
  return {
    sets: sets ?? SESSION_DEFAULTS.sets,
    reps: reps ?? SESSION_DEFAULTS.reps,
    holdSeconds: null,
    usedDefaults: sets === null || reps === null,
  };
}

/** Seconds one work set takes: hold time, or reps at the 2-1-3 rhythm. */
export function workSeconds(dose: Dose): number {
  if (dose.holdSeconds !== null) return dose.holdSeconds;
  return (dose.reps ?? SESSION_DEFAULTS.reps) * SESSION_DEFAULTS.secondsPerRep;
}

/* ------------------------------------------------------------------------------------------------
 * State
 * ---------------------------------------------------------------------------------------------- */

export type Segment = "work" | "rest-set" | "rest-exercise";
export type TimerMode = "reps" | "hold" | "rest";

export interface SessionItem {
  id: string;
  dose: Dose;
}

export interface SessionState {
  day: number;
  items: SessionItem[];
  /** Exercise index (0-based). */
  index: number;
  /** Current set (1-based). */
  set: number;
  segment: Segment;
  /** Length of the current segment in seconds (0 once readyToFinish). */
  segmentSeconds: number;
  started: boolean;
  running: boolean;
  /** When the running stretch of the current segment began; null while paused. */
  startedAt: number | null;
  /** Time already spent in the current segment before the latest start/resume. */
  elapsedBeforeMs: number;
  /** One slot per exercise, filled as each is completed or skipped. */
  exercisesDone: (ExerciseDoneRecord | null)[];
  /** Every exercise has a record: the day can be finished. */
  readyToFinish: boolean;
}

export interface SessionOptions {
  restBetweenSetsSeconds?: number;
  restBetweenExercisesSeconds?: number;
}

export function createSession(day: number, exercises: readonly Exercise[]): SessionState {
  const items = exercises.map((e) => ({ id: e.id, dose: doseFor(e) }));
  return {
    day,
    items,
    index: 0,
    set: 1,
    segment: "work",
    segmentSeconds: items.length ? workSeconds(items[0].dose) : 0,
    started: false,
    running: false,
    startedAt: null,
    elapsedBeforeMs: 0,
    exercisesDone: items.map(() => null),
    readyToFinish: items.length === 0,
  };
}

/* ------------------------------------------------------------------------------------------------
 * Timer reads
 * ---------------------------------------------------------------------------------------------- */

export function elapsedMs(s: SessionState, now: number): number {
  const live = s.running && s.startedAt !== null ? Math.max(0, now - s.startedAt) : 0;
  return s.elapsedBeforeMs + live;
}

export function secondsLeft(s: SessionState, now: number): number {
  if (s.readyToFinish) return 0;
  return Math.max(0, Math.ceil(s.segmentSeconds - elapsedMs(s, now) / 1000));
}

export function timerMode(s: SessionState): TimerMode {
  if (s.segment !== "work") return "rest";
  return s.items[s.index]?.dose.holdSeconds !== null ? "hold" : "reps";
}

/** Sets finished so far on the current exercise (the current set counts once its rest has begun). */
export function setsDoneSoFar(s: SessionState): number {
  return s.segment === "rest-set" ? s.set : s.set - 1;
}

/* ------------------------------------------------------------------------------------------------
 * Transitions
 * ---------------------------------------------------------------------------------------------- */

function enterSegment(s: SessionState, segment: Segment, seconds: number, now: number, carryMs = 0): SessionState {
  return {
    ...s,
    segment,
    segmentSeconds: seconds,
    // Overflow may exceed this segment too; tick() keeps settling until it fits.
    elapsedBeforeMs: carryMs,
    startedAt: s.running ? now : null,
  };
}

function idle(s: SessionState): SessionState {
  return { ...s, running: false, startedAt: null, elapsedBeforeMs: 0, segmentSeconds: 0, segment: "work" };
}

function enterExercise(s: SessionState, index: number, now: number, carryMs = 0): SessionState {
  const next = { ...s, index, set: 1, readyToFinish: false };
  return enterSegment(next, "work", workSeconds(s.items[index].dose), now, carryMs);
}

function recordExercise(
  s: SessionState,
  status: ExerciseDoneRecord["status"],
  setsDone: number,
  now: number,
  opts: SessionOptions,
  { rest, carryMs = 0 }: { rest: boolean; carryMs?: number },
): SessionState {
  const item = s.items[s.index];
  const exercisesDone = [...s.exercisesDone];
  exercisesDone[s.index] = { id: item.id, status, setsDone: Math.min(setsDone, item.dose.sets) };
  const withRecord = { ...s, exercisesDone };
  const isLast = s.index >= s.items.length - 1;
  if (isLast) return { ...idle(withRecord), readyToFinish: true };
  if (rest) return enterSegment(withRecord, "rest-exercise", opts.restBetweenExercisesSeconds ?? SESSION_DEFAULTS.restBetweenExercisesSeconds, now, carryMs);
  return enterExercise(withRecord, s.index + 1, now, carryMs);
}

function completeSet(s: SessionState, now: number, opts: SessionOptions, carryMs = 0): SessionState {
  const dose = s.items[s.index].dose;
  if (s.set < dose.sets) return enterSegment(s, "rest-set", opts.restBetweenSetsSeconds ?? SESSION_DEFAULTS.restBetweenSetsSeconds, now, carryMs);
  return recordExercise(s, "completed", dose.sets, now, opts, { rest: true, carryMs });
}

/** Moves to whatever follows the current segment. */
function advance(s: SessionState, now: number, opts: SessionOptions, carryMs: number): SessionState {
  switch (s.segment) {
    case "work":
      return completeSet(s, now, opts, carryMs);
    case "rest-set":
      return enterSegment({ ...s, set: s.set + 1 }, "work", workSeconds(s.items[s.index].dose), now, carryMs);
    case "rest-exercise":
      return enterExercise(s, s.index + 1, now, carryMs);
  }
}

/**
 * Settles any segments whose time has fully elapsed. Call before reading the timer and on every
 * UI tick; overflow carries into the next segment so timing stays exact across long gaps.
 */
export function tick(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  let state = s;
  for (let guard = 0; guard < 1000; guard += 1) {
    if (!state.running || state.readyToFinish) return state;
    const over = elapsedMs(state, now) - state.segmentSeconds * 1000;
    if (over < 0) return state;
    state = advance(state, now, opts, over);
  }
  return state;
}

export function start(s: SessionState, now: number): SessionState {
  if (s.started || s.readyToFinish) return s;
  return { ...s, started: true, running: true, startedAt: now, elapsedBeforeMs: 0 };
}

export function pause(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  if (!s.running) return s;
  const settled = tick(s, now, opts);
  if (!settled.running) return settled;
  return { ...settled, running: false, elapsedBeforeMs: elapsedMs(settled, now), startedAt: null };
}

export function resume(s: SessionState, now: number): SessionState {
  if (s.running || !s.started || s.readyToFinish) return s;
  return { ...s, running: true, startedAt: now };
}

/** The current work set is done (user tapped "set done"). No-op during rests. */
export function markSetDone(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  const state = tick(s, now, opts);
  if (state.readyToFinish || state.segment !== "work") return state;
  return completeSet(state, now, opts, 0);
}

/** Skips a rest (between sets or exercises). No-op during work. */
export function skipRest(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  const state = tick(s, now, opts);
  if (state.readyToFinish || state.segment === "work") return state;
  return advance(state, now, opts, 0);
}

/** "Done, next exercise": records the current exercise as completed and moves on without a rest. */
export function next(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  const state = tick(s, now, opts);
  if (state.readyToFinish) return state;
  if (state.segment === "rest-exercise") return advance(state, now, opts, 0);
  return recordExercise(state, "completed", setsDoneSoFar(state), now, opts, { rest: false });
}

/** Records the current exercise as skipped (keeping any sets already done) and moves on. */
export function skipExercise(s: SessionState, now: number, opts: SessionOptions = {}): SessionState {
  const state = tick(s, now, opts);
  if (state.readyToFinish) return state;
  if (state.segment === "rest-exercise") return advance(state, now, opts, 0);
  return recordExercise(state, "skipped", setsDoneSoFar(state), now, opts, { rest: false });
}

/** Back to the start of the current exercise; its record is cleared. */
export function restartExercise(s: SessionState, now: number): SessionState {
  const exercisesDone = [...s.exercisesDone];
  exercisesDone[s.index] = null;
  const running = s.started && (s.running || s.readyToFinish);
  return enterExercise({ ...s, exercisesDone, running, startedAt: null }, s.index, now);
}

/**
 * Back to the previous exercise (or restart the first). After the last exercise finished,
 * this reopens it. The reopened exercise's record is cleared so it is redone.
 */
export function back(s: SessionState, now: number): SessionState {
  // After the last exercise, or while resting after one, "back" reopens that exercise.
  if (s.readyToFinish || s.segment === "rest-exercise") return restartExercise(s, now);
  if (s.index === 0) return restartExercise(s, now);
  const exercisesDone = [...s.exercisesDone];
  exercisesDone[s.index] = null;
  exercisesDone[s.index - 1] = null;
  return enterExercise({ ...s, exercisesDone }, s.index - 1, now);
}

/** Records for completeDay(): every exercise, in plan order. Only valid when readyToFinish. */
export function completedRecords(s: SessionState): ExerciseDoneRecord[] {
  return s.exercisesDone.map((r, i) => r ?? { id: s.items[i].id, status: "skipped", setsDone: 0 });
}

/* ------------------------------------------------------------------------------------------------
 * Persistence (localStorage shape)
 * ---------------------------------------------------------------------------------------------- */

export const SESSION_STORAGE_KEY = "mobility.session.v1";

export interface SavedSession {
  v: 1;
  day: number;
  ids: string[];
  index: number;
  set: number;
  segment: Segment;
  segmentSeconds: number;
  elapsedMs: number;
  started: boolean;
  exercisesDone: (ExerciseDoneRecord | null)[];
  readyToFinish: boolean;
  savedAt: number;
}

export function serialize(s: SessionState, now: number): SavedSession {
  return {
    v: 1,
    day: s.day,
    ids: s.items.map((i) => i.id),
    index: s.index,
    set: s.set,
    segment: s.segment,
    segmentSeconds: s.segmentSeconds,
    elapsedMs: Math.min(elapsedMs(s, now), s.segmentSeconds * 1000),
    started: s.started,
    exercisesDone: s.exercisesDone,
    readyToFinish: s.readyToFinish,
    savedAt: now,
  };
}

/**
 * Rebuilds a paused session from a saved snapshot. Returns null when the snapshot is for another
 * day or the plan has changed (different exercise ids), so a stale save can never corrupt a day.
 */
export function restore(saved: unknown, day: number, exercises: readonly Exercise[]): SessionState | null {
  if (!saved || typeof saved !== "object") return null;
  const v = saved as Partial<SavedSession>;
  if (v.v !== 1 || v.day !== day || !Array.isArray(v.ids) || !Array.isArray(v.exercisesDone)) return null;
  const fresh = createSession(day, exercises);
  if (v.ids.length !== fresh.items.length || v.ids.some((id, i) => id !== fresh.items[i].id)) return null;
  if (typeof v.index !== "number" || v.index < 0 || v.index >= fresh.items.length) return null;
  const dose = fresh.items[v.index].dose;
  const set = typeof v.set === "number" && v.set >= 1 && v.set <= dose.sets ? v.set : 1;
  const segment: Segment = v.segment === "rest-set" || v.segment === "rest-exercise" ? v.segment : "work";
  const segmentSeconds = typeof v.segmentSeconds === "number" && v.segmentSeconds >= 0 ? v.segmentSeconds : workSeconds(dose);
  return {
    ...fresh,
    index: v.index,
    set,
    segment,
    segmentSeconds: v.readyToFinish ? 0 : segmentSeconds,
    started: Boolean(v.started),
    running: false,
    startedAt: null,
    elapsedBeforeMs: Math.max(0, Math.min(typeof v.elapsedMs === "number" ? v.elapsedMs : 0, segmentSeconds * 1000)),
    exercisesDone: fresh.items.map((item, i) => {
      const r = v.exercisesDone?.[i];
      return r && typeof r === "object" && r.id === item.id && (r.status === "completed" || r.status === "skipped")
        ? { id: item.id, status: r.status, setsDone: positiveInt(r.setsDone) ?? 0 }
        : null;
    }),
    readyToFinish: Boolean(v.readyToFinish),
  };
}

/* ------------------------------------------------------------------------------------------------
 * Cues (for optional sound / speech in the UI)
 * ---------------------------------------------------------------------------------------------- */

export type Cue =
  | { type: "start"; segment: Segment; index: number; set: number }
  | { type: "halfway"; segment: Segment }
  | { type: "countdown"; secondsLeft: 1 | 2 | 3 }
  | { type: "set-done"; index: number; set: number }
  | { type: "exercise-done"; index: number; status: ExerciseDoneRecord["status"] }
  | { type: "ready-to-finish" };

export interface CueSnapshot {
  index: number;
  set: number;
  segment: Segment;
  secondsLeft: number;
  segmentSeconds: number;
  readyToFinish: boolean;
  exercisesDone: (ExerciseDoneRecord | null)[];
}

export function snapshot(s: SessionState, now: number): CueSnapshot {
  return {
    index: s.index,
    set: s.set,
    segment: s.segment,
    secondsLeft: secondsLeft(s, now),
    segmentSeconds: s.segmentSeconds,
    readyToFinish: s.readyToFinish,
    exercisesDone: s.exercisesDone,
  };
}

/** Cues that happened between two observations of a running session. */
export function cuesBetween(prev: CueSnapshot | null, nextSnap: CueSnapshot, started: boolean): Cue[] {
  const cues: Cue[] = [];
  if (!started) return cues;
  if (prev) {
    for (let i = 0; i < nextSnap.exercisesDone.length; i += 1) {
      const was = prev.exercisesDone[i];
      const is = nextSnap.exercisesDone[i];
      if (!was && is) cues.push({ type: "exercise-done", index: i, status: is.status });
    }
    const movedOn = prev.index !== nextSnap.index || prev.set !== nextSnap.set || prev.segment !== nextSnap.segment;
    if (movedOn) {
      if (prev.segment === "work") {
        const record = nextSnap.exercisesDone[prev.index];
        const finishedSet =
          (nextSnap.index === prev.index && nextSnap.segment !== "work") ||
          (record !== null && !prev.exercisesDone[prev.index] && record.status === "completed" && record.setsDone >= prev.set);
        if (finishedSet) cues.push({ type: "set-done", index: prev.index, set: prev.set });
      }
      if (!nextSnap.readyToFinish) cues.push({ type: "start", segment: nextSnap.segment, index: nextSnap.index, set: nextSnap.set });
    }
    if (!prev.readyToFinish && nextSnap.readyToFinish) cues.push({ type: "ready-to-finish" });
  } else if (!nextSnap.readyToFinish) {
    cues.push({ type: "start", segment: nextSnap.segment, index: nextSnap.index, set: nextSnap.set });
  }

  const sameSegment = prev && prev.index === nextSnap.index && prev.set === nextSnap.set && prev.segment === nextSnap.segment;
  if (sameSegment && !nextSnap.readyToFinish && nextSnap.segmentSeconds >= 6) {
    const half = Math.ceil(nextSnap.segmentSeconds / 2);
    if (prev.secondsLeft > half && nextSnap.secondsLeft <= half && nextSnap.secondsLeft > 3) cues.push({ type: "halfway", segment: nextSnap.segment });
    for (const n of [3, 2, 1] as const) {
      if (prev.secondsLeft > n && nextSnap.secondsLeft <= n && nextSnap.secondsLeft === n) cues.push({ type: "countdown", secondsLeft: n });
    }
  }
  return cues;
}
