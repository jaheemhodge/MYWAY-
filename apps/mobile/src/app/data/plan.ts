/**
 * Hardcoded sample plan for the logged-in shell prototype: Knees, three 20-day phases,
 * re-checks on Day 30 and Day 60. Real plan generation is out of scope.
 */
import { requireExercise, type Area, type Exercise, type PhaseNumber } from "./library";

export const TOTAL_DAYS = 60;
export const FOCUS_AREA: Area = "knees";

// TODO(duration): placeholder until each clip has a real length. About 3 minutes per exercise.
export const MINUTES_PER_EXERCISE = 3;

export const RECHECK_DAYS = [30, 60] as const;

export interface PhaseInfo {
  number: PhaseNumber;
  name: string;
  startDay: number;
  endDay: number;
}

export const PHASE_INFO: Record<PhaseNumber, PhaseInfo> = {
  1: { number: 1, name: "Get familiar", startDay: 1, endDay: 20 },
  2: { number: 2, name: "Practice them", startDay: 21, endDay: 40 },
  3: { number: 3, name: "Stay with it", startDay: 41, endDay: 60 },
};

/** Exercise ids per phase for the sample Knees plan, in the order given in the brief. */
export const SAMPLE_PLAN: Record<PhaseNumber, readonly string[]> = {
  1: ["K01", "K12", "K02", "K04", "K06", "K07", "K08", "G01"],
  2: ["K01", "K04", "K09", "G03", "K10", "K13", "K14", "G01"],
  3: ["K05", "K07", "K11", "G02", "K09"],
};

export const SESSION_SIZE = 5;

export function clampDay(day: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.min(TOTAL_DAYS, Math.max(1, Math.round(day)));
}

export function phaseForDay(day: number): PhaseInfo {
  const d = clampDay(day);
  if (d <= PHASE_INFO[1].endDay) return PHASE_INFO[1];
  if (d <= PHASE_INFO[2].endDay) return PHASE_INFO[2];
  return PHASE_INFO[3];
}

/**
 * Returns 4–6 exercises for a plan day (5 with the sample plan).
 * Rotates through the phase list one step per day so every exercise comes up.
 * Day 1 always starts with K01.
 */
export function getSession(day: number): Exercise[] {
  const d = clampDay(day);
  const phase = phaseForDay(d);
  const ids = SAMPLE_PLAN[phase.number];
  const size = Math.min(SESSION_SIZE, ids.length);
  const offset = (d - phase.startDay) % ids.length;
  const picked: string[] = [];
  for (let i = 0; i < size; i += 1) picked.push(ids[(offset + i) % ids.length]);
  return picked.map(requireExercise);
}

export function sessionMinutes(count: number): number {
  return count * MINUTES_PER_EXERCISE;
}

/** Day on which an exercise from a later phase opens, or null when it is already open. */
export function opensOnDay(exercisePhase: PhaseNumber, currentDay: number): number | null {
  const current = phaseForDay(currentDay).number;
  if (exercisePhase <= current) return null;
  return PHASE_INFO[exercisePhase].startDay;
}

/**
 * Sample calendar: Day 12 falls on Wednesday 28 October 2026, so Day 1 is Saturday 17 October 2026.
 * TODO(plan-start): replace with the user's real start date once accounts exist.
 */
const PLAN_START = new Date(2026, 9, 17);

export function dateForDay(day: number): Date {
  const date = new Date(PLAN_START);
  date.setDate(PLAN_START.getDate() + (day - 1));
  return date;
}

const weekdayLong = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const weekdayShort = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthDayLong = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });

export function formatWeekday(day: number, style: "long" | "short" = "long"): string {
  return (style === "long" ? weekdayLong : weekdayShort).format(dateForDay(day));
}

export function formatMonthDay(day: number, style: "long" | "short" = "short"): string {
  return (style === "long" ? monthDayLong : monthDay).format(dateForDay(day));
}

export function phaseLabel(phase: PhaseInfo): string {
  return `Phase ${phase.number} · ${phase.name} · Days ${phase.startDay}–${phase.endDay}`;
}
