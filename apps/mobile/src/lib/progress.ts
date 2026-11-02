/**
 * Progress: day completions and questionnaires. Completions are written only through the
 * complete_day() database function so the day order is enforced server-side.
 */
import type { PostgrestError } from "@supabase/supabase-js";
import { PHASE_INFO } from "@/app/data/plan";
import type { Answers, DayCompletionRow, ExerciseDoneEntry, ProgressRpcResult, QuestionnaireKind, QuestionnaireResponseRow } from "./database.types";
import { getSupabase } from "./supabaseClient";
import type { CompleteDayDenial } from "./unlock";

export interface Progress {
  currentDay: number;
  completedDays: number[];
  phase: 1 | 2 | 3;
  phaseName: string;
  recheckDue: "day30" | "day60" | null;
  allDone: boolean;
  /** Days included before full access. Defaults to 3 when the server omits the key. */
  freeDaysLimit: number;
  hasFullAccess: boolean;
}

export const EMPTY_PROGRESS: Progress = {
  currentDay: 1,
  completedDays: [],
  phase: 1,
  phaseName: PHASE_INFO[1].name,
  recheckDue: null,
  allDone: false,
  freeDaysLimit: 3,
  hasFullAccess: false,
};

export type ProgressErrorCode = CompleteDayDenial | "NOT_AUTHENTICATED" | "INVALID_FEELING" | "INVALID_EXERCISES" | "NETWORK" | "UNKNOWN";

export class ProgressError extends Error {
  readonly code: ProgressErrorCode;
  constructor(code: ProgressErrorCode, message: string) {
    super(message);
    this.name = "ProgressError";
    this.code = code;
  }
}

export const PROGRESS_MESSAGES: Record<ProgressErrorCode, string> = {
  NOT_AUTHENTICATED: "Please sign in again to save your progress.",
  NOT_ONBOARDED: "Finish setting up your plan first, then come back to this day.",
  INVALID_DAY: "That day isn't part of the 60-day plan.",
  INVALID_FEELING: "Pick how you feel on the 1 to 5 scale.",
  INVALID_EXERCISES: "We couldn't read the exercise list for this day.",
  DAY_LOCKED: "Finish the day before this one first. Days open one at a time.",
  PAYWALL: "Days 4 to 60 are part of full access.",
  RECHECK_REQUIRED: "Do the short re-check first, then finish this day.",
  NETWORK: "We couldn't reach the server. Your day wasn't saved; try again in a moment.",
  UNKNOWN: "Something went wrong while saving. Please try again.",
};

const TOKENS: readonly ProgressErrorCode[] = [
  "NOT_AUTHENTICATED",
  "NOT_ONBOARDED",
  "INVALID_DAY",
  "INVALID_FEELING",
  "INVALID_EXERCISES",
  "DAY_LOCKED",
  "PAYWALL",
  "RECHECK_REQUIRED",
];

/** Maps the token raised by complete_day() (or a transport failure) to a code and friendly text. */
export function toProgressError(error: Pick<PostgrestError, "message"> | Error | string | null | undefined): ProgressError {
  const raw = typeof error === "string" ? error : error?.message ?? "";
  const upper = raw.toUpperCase();
  for (const token of TOKENS) if (upper.includes(token)) return new ProgressError(token, PROGRESS_MESSAGES[token]);
  const lower = raw.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network")) return new ProgressError("NETWORK", PROGRESS_MESSAGES.NETWORK);
  return new ProgressError("UNKNOWN", PROGRESS_MESSAGES.UNKNOWN);
}

export function fromRpc(result: ProgressRpcResult): Progress {
  const phase = result.phase;
  return {
    currentDay: result.current_day,
    completedDays: [...result.completed_days].sort((a, b) => a - b),
    phase,
    phaseName: PHASE_INFO[phase].name,
    recheckDue: result.recheck_due,
    allDone: result.all_done,
    freeDaysLimit: typeof result.free_days_limit === "number" ? result.free_days_limit : 3,
    hasFullAccess: result.has_full_access === true,
  };
}

export async function getProgress(): Promise<Progress> {
  const { data, error } = await getSupabase().rpc("get_progress");
  if (error) throw toProgressError(error);
  return fromRpc(data as unknown as ProgressRpcResult);
}

export interface CompleteDayInput {
  day: number;
  /** What was done today, in order: ids or { id, status, setsDone } records. */
  exercises: readonly ExerciseDoneEntry[];
  /** Optional 1–5 self-report. */
  feeling?: number | null;
}

/** Calls complete_day(). Rejects (with a ProgressError) when the database refuses. */
export async function completeDay({ day, exercises, feeling = null }: CompleteDayInput): Promise<DayCompletionRow> {
  const { data, error } = await getSupabase().rpc("complete_day", {
    p_day: day,
    p_exercises: [...exercises],
    p_feeling: feeling,
  });
  if (error) throw toProgressError(error);
  return data as unknown as DayCompletionRow;
}

async function requireUserId(): Promise<string> {
  const { data } = await getSupabase().auth.getUser();
  const id = data.user?.id;
  if (!id) throw new ProgressError("NOT_AUTHENTICATED", PROGRESS_MESSAGES.NOT_AUTHENTICATED);
  return id;
}

/** Saves (or replaces) one questionnaire. The unique (user_id, kind) index makes this an upsert. */
export async function saveQuestionnaire(kind: QuestionnaireKind, answers: Answers): Promise<QuestionnaireResponseRow> {
  const userId = await requireUserId();
  const { data, error } = await getSupabase()
    .from("questionnaire_responses")
    .upsert({ user_id: userId, kind, answers }, { onConflict: "user_id,kind" })
    .select()
    .single();
  if (error) throw toProgressError(error);
  return data as QuestionnaireResponseRow;
}

export async function getQuestionnaires(): Promise<QuestionnaireResponseRow[]> {
  const { data, error } = await getSupabase().from("questionnaire_responses").select("*").order("created_at");
  if (error) throw toProgressError(error);
  return (data ?? []) as QuestionnaireResponseRow[];
}

export async function getCompletions(): Promise<DayCompletionRow[]> {
  const { data, error } = await getSupabase().from("day_completions").select("*").order("day_number");
  if (error) throw toProgressError(error);
  return (data ?? []) as DayCompletionRow[];
}
