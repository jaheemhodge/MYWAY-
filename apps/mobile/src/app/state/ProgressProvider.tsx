import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Answers, DayCompletionRow, ExerciseDoneEntry, QuestionnaireKind, QuestionnaireResponseRow } from "@/lib/database.types";
import {
  completeDay as completeDayRequest,
  EMPTY_PROGRESS,
  getProgress,
  getQuestionnaires,
  saveQuestionnaire as saveQuestionnaireRequest,
  type Progress,
} from "@/lib/progress";
import { isDayCompleted, isDayPaywalled as dayIsPaywalled, isDayUnlocked, type RecheckKind } from "@/lib/unlock";
import { useAuth } from "./AuthProvider";

export type ProgressStatus = "idle" | "loading" | "ready" | "error";

export interface ProgressContextValue {
  progress: Progress;
  status: ProgressStatus;
  /** True once progress has loaded; gate day-lock decisions on this to avoid redirecting too early. */
  ready: boolean;
  error: string | null;
  /** Highest completed day + 1 (max 60). Day 1 until anything is saved. */
  currentDay: number;
  completedDays: number[];
  recheckDue: RecheckKind | null;
  questionnaires: QuestionnaireResponseRow[];
  hasQuestionnaire: (kind: QuestionnaireKind) => boolean;
  isDayUnlocked: (day: number) => boolean;
  isDayCompleted: (day: number) => boolean;
  /** Days included with the free beta. From get_progress, or 3 before the first load. */
  freeDaysLimit: number;
  hasFullAccess: boolean;
  /** Past the free beta and this account does not have full access. Separate from sequential unlock. */
  isDayPaywalled: (day: number) => boolean;
  refresh: () => Promise<void>;
  /** Calls complete_day(); throws ProgressError with a friendly message when refused. */
  completeDay: (day: number, exercises: readonly ExerciseDoneEntry[], feeling?: number | null) => Promise<DayCompletionRow>;
  saveQuestionnaire: (kind: QuestionnaireKind, answers: Answers) => Promise<QuestionnaireResponseRow>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const userId = user?.id ?? null;
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponseRow[]>([]);
  const [status, setStatus] = useState<ProgressStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProgress(EMPTY_PROGRESS);
      setQuestionnaires([]);
      setStatus("idle");
      return;
    }
    setStatus((s) => (s === "ready" ? s : "loading"));
    try {
      const [next, answers] = await Promise.all([getProgress(), getQuestionnaires()]);
      setProgress(next);
      setQuestionnaires(answers);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load your progress.");
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    if (authStatus === "signedIn") void refresh();
    else {
      setProgress(EMPTY_PROGRESS);
      setQuestionnaires([]);
      setStatus("idle");
      setError(null);
    }
  }, [authStatus, refresh]);

  const completeDay = useCallback<ProgressContextValue["completeDay"]>(
    async (day, exercises, feeling = null) => {
      const row = await completeDayRequest({ day, exercises, feeling });
      await refresh();
      return row;
    },
    [refresh],
  );

  const saveQuestionnaire = useCallback<ProgressContextValue["saveQuestionnaire"]>(
    async (kind, answers) => {
      const row = await saveQuestionnaireRequest(kind, answers);
      setQuestionnaires((prev) => [...prev.filter((q) => q.kind !== kind), row]);
      await refresh();
      return row;
    },
    [refresh],
  );

  const value = useMemo<ProgressContextValue>(() => {
    const completed = progress.completedDays;
    return {
      progress,
      status,
      ready: status === "ready",
      error,
      currentDay: progress.currentDay,
      completedDays: completed,
      recheckDue: progress.recheckDue,
      questionnaires,
      hasQuestionnaire: (kind) => questionnaires.some((q) => q.kind === kind),
      isDayUnlocked: (day) => isDayUnlocked(day, completed),
      isDayCompleted: (day) => isDayCompleted(day, completed),
      freeDaysLimit: progress.freeDaysLimit,
      hasFullAccess: progress.hasFullAccess,
      isDayPaywalled: (day) => dayIsPaywalled(day, progress.hasFullAccess, progress.freeDaysLimit),
      refresh,
      completeDay,
      saveQuestionnaire,
    };
  }, [progress, status, error, questionnaires, refresh, completeDay, saveQuestionnaire]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
