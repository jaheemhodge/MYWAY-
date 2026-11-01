/**
 * Daily plan generation for one focus area over 60 days. Pure and deterministic: the same focus
 * area and day always give the same exercises, so the client never has to store a plan.
 *
 * Uses ONLY the exercises in src/data/library-slim.json. Phase gating:
 *   Days 1–20  → phase 1 exercises
 *   Days 21–40 → phases 1–2
 *   Days 41–60 → phases 1–3
 * Each day rotates through the unlocked pool so consecutive days differ, and the newest phase's
 * exercises come up first in the days right after a phase opens.
 */
import { EXERCISES, type Area, type Exercise, type PhaseNumber } from "@/app/data/library";
import { clampDay, MINUTES_PER_EXERCISE, PHASE_INFO, RECHECK_DAYS, TOTAL_DAYS, type PhaseInfo } from "@/app/data/plan";
import type { FocusArea, QuestionnaireKind } from "./database.types";

export type { FocusArea };
export { TOTAL_DAYS, MINUTES_PER_EXERCISE, PHASE_INFO, RECHECK_DAYS, clampDay };

export const FOCUS_AREAS: readonly FocusArea[] = ["knees", "lower_back", "hips_balance"];

export const FOCUS_AREA_LABEL: Record<FocusArea, string> = {
  knees: "Knees",
  lower_back: "Lower back",
  hips_balance: "Hips & balance",
};

/** The 2-1-3 rep rhythm from PRODUCT.md: lift 2 seconds, hold 1 second, lower 3 seconds. */
export const REP_RHYTHM = { liftSeconds: 2, holdSeconds: 1, lowerSeconds: 3 } as const;

/** Database focus_area values use underscores; the exercise library uses hyphens. */
const AREA_FOR_FOCUS: Record<FocusArea, Area> = {
  knees: "knees",
  lower_back: "lower-back",
  hips_balance: "hips-balance",
};
const FOCUS_FOR_AREA: Record<Area, FocusArea> = {
  knees: "knees",
  "lower-back": "lower_back",
  "hips-balance": "hips_balance",
};

export function toLibraryArea(focus: FocusArea): Area {
  return AREA_FOR_FOCUS[focus];
}

export function toFocusArea(area: Area): FocusArea {
  return FOCUS_FOR_AREA[area];
}

export function isFocusArea(value: unknown): value is FocusArea {
  return typeof value === "string" && (FOCUS_AREAS as string[]).includes(value);
}

/** Session size: 5 exercises at about 3 minutes each lands in the 10–20 minute target. */
export const SESSION_SIZE = 5;
export const MIN_SESSION_SIZE = 3;

export interface DayPlan {
  day: number;
  phase: PhaseNumber;
  phaseName: string;
  phaseInfo: PhaseInfo;
  focusArea: FocusArea;
  exercises: Exercise[];
  estimatedMinutes: number;
  isRecheckDay: boolean;
  /** Which re-check must be saved before this day can be completed, or null. */
  recheckKind: Extract<QuestionnaireKind, "day30" | "day60"> | null;
  rhythm: typeof REP_RHYTHM;
}

export function getPhase(day: number): PhaseInfo {
  const d = clampDay(day);
  if (d <= PHASE_INFO[1].endDay) return PHASE_INFO[1];
  if (d <= PHASE_INFO[2].endDay) return PHASE_INFO[2];
  return PHASE_INFO[3];
}

export function isRecheckDay(day: number): boolean {
  return (RECHECK_DAYS as readonly number[]).includes(clampDay(day));
}

export function recheckKindForDay(day: number): DayPlan["recheckKind"] {
  const d = clampDay(day);
  if (d === 30) return "day30";
  if (d === 60) return "day60";
  return null;
}

/** An exercise is open once the plan has reached its phase. */
export function isExerciseUnlocked(exercise: Pick<Exercise, "phase">, currentDay: number): boolean {
  return exercise.phase <= getPhase(currentDay).number;
}

/** First day on which an exercise opens (its phase's start day). */
export function exerciseUnlockDay(exercise: Pick<Exercise, "phase">): number {
  return PHASE_INFO[exercise.phase].startDay;
}

const LIBRARY_INDEX = new Map(EXERCISES.map((e, i) => [e.id, i]));

/**
 * Exercises available for a focus area on a day: anything tagged with the area whose phase has
 * opened. Ordered so rotation is predictable: newest phase first, then exercises whose primary
 * area is the focus area, then in library order (so Knees Day 1 opens with K01).
 */
export function getPool(focusArea: FocusArea, day: number): Exercise[] {
  const area = toLibraryArea(focusArea);
  const maxPhase = getPhase(day).number;
  return EXERCISES.filter((e) => e.areas.includes(area) && e.phase <= maxPhase).sort((a, b) => {
    if (a.phase !== b.phase) return b.phase - a.phase;
    const aPrimary = a.primaryArea === area ? 0 : 1;
    const bPrimary = b.primaryArea === area ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return (LIBRARY_INDEX.get(a.id) ?? 0) - (LIBRARY_INDEX.get(b.id) ?? 0);
  });
}

function samePool(a: readonly Exercise[], b: readonly Exercise[]): boolean {
  return a.length === b.length && a.every((e, i) => e.id === b[i].id);
}

/**
 * Day the rotation counts from. Normally the phase's first day, so newly opened exercises lead
 * the first sessions of a phase. When a phase adds nothing new for this area (for example Knees
 * has no phase-3 exercises) the rotation carries on from the earlier phase instead of repeating.
 */
function rotationStart(focusArea: FocusArea, phaseInfo: PhaseInfo): number {
  let anchor = phaseInfo;
  while (anchor.number > 1) {
    const previous = PHASE_INFO[(anchor.number - 1) as PhaseNumber];
    if (!samePool(getPool(focusArea, anchor.startDay), getPool(focusArea, previous.startDay))) break;
    anchor = previous;
  }
  return anchor.startDay;
}

export function getDayPlan(focusArea: FocusArea, dayNumber: number): DayPlan {
  const day = clampDay(dayNumber);
  const phaseInfo = getPhase(day);
  const pool = getPool(focusArea, day);
  const size = Math.max(MIN_SESSION_SIZE, Math.min(SESSION_SIZE, pool.length));
  // Stride by the session size so day N+1 picks up where day N left off.
  const offset = pool.length ? ((day - rotationStart(focusArea, phaseInfo)) * SESSION_SIZE) % pool.length : 0;
  const exercises: Exercise[] = [];
  for (let i = 0; i < size && i < pool.length; i += 1) exercises.push(pool[(offset + i) % pool.length]);

  return {
    day,
    phase: phaseInfo.number,
    phaseName: phaseInfo.name,
    phaseInfo,
    focusArea,
    exercises,
    estimatedMinutes: exercises.length * MINUTES_PER_EXERCISE,
    isRecheckDay: isRecheckDay(day),
    recheckKind: recheckKindForDay(day),
    rhythm: REP_RHYTHM,
  };
}

/** Every day's plan, for calendar screens. */
export function getAllDayPlans(focusArea: FocusArea): DayPlan[] {
  const plans: DayPlan[] = [];
  for (let day = 1; day <= TOTAL_DAYS; day += 1) plans.push(getDayPlan(focusArea, day));
  return plans;
}
