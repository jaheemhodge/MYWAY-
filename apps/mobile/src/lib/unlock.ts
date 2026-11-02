/**
 * Day unlock rules, mirrored from complete_day() / get_progress() in the database so the UI can
 * decide what to show without a round trip. The database is the source of truth; these are for
 * routing and labels, and for unit tests of the rules.
 */
import { TOTAL_DAYS } from "@/app/data/plan";
import type { QuestionnaireKind } from "./database.types";

export type RecheckKind = Extract<QuestionnaireKind, "day30" | "day60">;

export type CompleteDayDenial =
  | "NOT_ONBOARDED"
  | "INVALID_DAY"
  | "DAY_LOCKED"
  | "PAYWALL"
  | "RECHECK_REQUIRED";

/** Used when get_progress has not reported a limit yet. The database function is the source of truth. */
export const FREE_DAYS_FALLBACK = 3;

export interface UnlockState {
  /** Days finished so far (any order; duplicates ignored). */
  completedDays: Iterable<number>;
  /** Re-checks saved so far. */
  recheckDone?: Iterable<RecheckKind>;
  onboarded?: boolean;
  /**
   * When omitted, the paywall check is skipped so older callers keep today's behaviour.
   * Pass false for a free account and true for active / trialing / comped.
   */
  hasFullAccess?: boolean;
  freeDaysLimit?: number;
}

/** True when this day sits past the free beta and the account does not have full access. */
export function isDayPaywalled(day: number, hasFullAccess: boolean, freeDaysLimit = FREE_DAYS_FALLBACK): boolean {
  return day > freeDaysLimit && !hasFullAccess;
}

function toSet(days: Iterable<number>): Set<number> {
  return new Set(Array.from(days).filter((d) => Number.isInteger(d) && d >= 1 && d <= TOTAL_DAYS));
}

export function isValidDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS;
}

/** Highest completed day + 1, capped at 60. */
export function currentDayFrom(completedDays: Iterable<number>): number {
  let max = 0;
  for (const d of toSet(completedDays)) if (d > max) max = d;
  return Math.min(max + 1, TOTAL_DAYS);
}

export function isDayCompleted(day: number, completedDays: Iterable<number>): boolean {
  return toSet(completedDays).has(day);
}

/** A day can be opened (started or replayed) once the day before it is done. Day 1 is always open. */
export function isDayUnlocked(day: number, completedDays: Iterable<number>): boolean {
  if (!isValidDay(day)) return false;
  if (day === 1) return true;
  return toSet(completedDays).has(day - 1);
}

export function recheckKindFor(day: number): RecheckKind | null {
  if (day === 30) return "day30";
  if (day === 60) return "day60";
  return null;
}

/**
 * Same checks as the SQL function, in the same order. Returns null when the completion would be
 * accepted, otherwise the token the database would raise.
 */
export function completeDayDenial(day: number, state: UnlockState): CompleteDayDenial | null {
  if (!isValidDay(day)) return "INVALID_DAY";
  if (state.onboarded === false) return "NOT_ONBOARDED";
  if (!isDayUnlocked(day, state.completedDays)) return "DAY_LOCKED";
  if (state.hasFullAccess !== undefined && isDayPaywalled(day, state.hasFullAccess, state.freeDaysLimit ?? FREE_DAYS_FALLBACK)) return "PAYWALL";
  const kind = recheckKindFor(day);
  if (kind && !new Set(state.recheckDone ?? []).has(kind)) return "RECHECK_REQUIRED";
  return null;
}

export function canCompleteDay(day: number, state: UnlockState): boolean {
  return completeDayDenial(day, state) === null;
}

/** Which re-check should run before the current day, or null. */
export function recheckDueFor(currentDay: number, recheckDone: Iterable<RecheckKind>, completedDays: Iterable<number>): RecheckKind | null {
  const kind = recheckKindFor(currentDay);
  if (!kind) return null;
  if (toSet(completedDays).has(currentDay)) return null;
  return new Set(recheckDone).has(kind) ? null : kind;
}
