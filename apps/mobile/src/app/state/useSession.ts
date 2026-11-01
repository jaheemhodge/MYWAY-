import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Exercise } from "@/app/data/library";
import type { ExerciseDoneRecord } from "@/lib/database.types";
import { mediaFor, type ExerciseMedia } from "@/data/mediaMap";
import { ProgressError, PROGRESS_MESSAGES } from "@/lib/progress";
import { REP_RHYTHM, type DayPlan } from "@/lib/plan";
import * as engine from "@/lib/session";
import { isValidDay } from "@/lib/unlock";
import { useMediaQuery } from "../hooks";
import { useProgress } from "./ProgressProvider";
import { useDayPlan } from "./useDayPlan";

export type SessionStatus = "loading" | "locked" | "recheck-required" | "ready" | "in-progress" | "paused" | "finishing" | "done" | "error";

export const CUES_SETTING_KEY = "mobility.session.cues.v1";

export interface SessionTimer {
  mode: engine.TimerMode;
  segment: engine.Segment;
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
}

export interface SessionActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Toggle helper for the Space key / one play-pause button. */
  togglePause: () => void;
  /** Current exercise done → next exercise (no rest). During a rest, skips the rest. */
  next: () => void;
  /** Previous exercise (or restart the first). */
  back: () => void;
  skipExercise: () => void;
  restartExercise: () => void;
  markSetDone: () => void;
  skipRest: () => void;
  /** Calls complete_day(). Resolves true on success (and navigates to /done). */
  finishDay: (feeling?: number | null) => Promise<boolean>;
  /** Pauses, keeps the saved progress, and leaves the session. */
  exit: () => void;
}

export interface KeyBinding {
  key: string;
  action: keyof Pick<SessionActions, "togglePause" | "next" | "back">;
  label: string;
}

export const KEY_BINDINGS: readonly KeyBinding[] = [
  { key: " ", action: "togglePause", label: "Space: pause / resume" },
  { key: "ArrowRight", action: "next", label: "Right arrow: next" },
  { key: "ArrowLeft", action: "back", label: "Left arrow: back" },
];

export interface UseSessionResult {
  status: SessionStatus;
  day: number;
  plan: DayPlan | null;
  /** For status 'locked': where to send the user. */
  currentDay: number;
  /** For status 'recheck-required'. */
  recheckRoute: string | null;
  isReplay: boolean;

  index: number;
  exercise: Exercise | null;
  total: number;
  isFirst: boolean;
  isLast: boolean;

  currentSet: number;
  totalSets: number;
  repsTarget: number | null;
  holdSeconds: number | null;
  usedDefaults: boolean;
  rhythm: typeof REP_RHYTHM;

  timer: SessionTimer;
  readyToFinish: boolean;
  exercisesDone: (ExerciseDoneRecord | null)[];
  media: ExerciseMedia;
  error: string | null;

  actions: SessionActions;
  cues: {
    enabled: boolean;
    setEnabled: (on: boolean) => void;
    last: engine.Cue | null;
    subscribe: (listener: (cue: engine.Cue) => void) => () => void;
  };
  reducedMotion: boolean;
  keyBindings: readonly KeyBinding[];
  handleKeyDown: (event: { key: string; preventDefault: () => void; target?: EventTarget | null }) => void;
}

export interface UseSessionOptions {
  /** Clock, for tests. */
  now?: () => number;
  /** UI refresh period while running (ms). */
  tickMs?: number;
  rest?: engine.SessionOptions;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
}

function defaultStorage(): UseSessionOptions["storage"] {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readSaved(storage: UseSessionOptions["storage"]): unknown {
  try {
    const raw = storage?.getItem(engine.SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readCuesSetting(storage: UseSessionOptions["storage"]): boolean {
  try {
    return storage?.getItem(CUES_SETTING_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * All the logic behind /app/session/:day. The screen only renders what this returns and calls
 * `actions`. Timers are derived from timestamps (see src/lib/session.ts); progress is saved to
 * localStorage on every change and restored on mount; the tab going hidden pauses automatically.
 */
export function useSession(day: number, options: UseSessionOptions = {}): UseSessionResult {
  const { tickMs = 250 } = options;
  // Read through refs so callers may pass inline objects/functions without re-creating the timers.
  const nowRef = useRef(options.now ?? Date.now);
  nowRef.current = options.now ?? Date.now;
  const restRef = useRef<engine.SessionOptions>(options.rest ?? {});
  restRef.current = options.rest ?? restRef.current;
  const now = useCallback(() => nowRef.current(), []);
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const navigate = useNavigate();
  const { ready, currentDay, isDayUnlocked, isDayCompleted, hasQuestionnaire, completeDay } = useProgress();
  const plan = useDayPlan(day);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [state, setState] = useState<engine.SessionState | null>(null);
  const [clock, setClock] = useState(() => now());
  const [finish, setFinish] = useState<"idle" | "finishing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [cuesEnabled, setCuesEnabledState] = useState(() => readCuesSetting(storage));
  const [lastCue, setLastCue] = useState<engine.Cue | null>(null);
  const listeners = useRef(new Set<(cue: engine.Cue) => void>());
  const stateRef = useRef<engine.SessionState | null>(null);
  stateRef.current = state;
  const cueSnap = useRef<engine.CueSnapshot | null>(null);

  /* ---- gating ---- */
  const valid = isValidDay(day);
  const unlocked = valid && ready && isDayUnlocked(day);
  const recheckKind = plan?.recheckKind ?? null;
  const needsRecheck = unlocked && recheckKind !== null && !isDayCompleted(day) && !hasQuestionnaire(recheckKind);
  const canRun = ready && plan !== null && unlocked && !needsRecheck;

  /* ---- create or restore the engine state once the plan is known ---- */
  useEffect(() => {
    if (!canRun || !plan) return;
    setState((prev) => {
      if (prev && prev.day === day) return prev;
      return engine.restore(readSaved(storage), day, plan.exercises) ?? engine.createSession(day, plan.exercises);
    });
    // `storage` is stable for a mount; `plan` only changes with focus area or day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRun, plan, day]);

  /* ---- persistence: on every state change, and synchronously when the page hides ---- */
  const save = useCallback(
    (s: engine.SessionState | null) => {
      if (!s || !storage) return;
      try {
        if (s.started) storage.setItem(engine.SESSION_STORAGE_KEY, JSON.stringify(engine.serialize(s, now())));
      } catch {
        /* storage blocked: the session still runs in memory */
      }
    },
    [storage, now],
  );
  const clearSaved = useCallback(() => {
    try {
      const raw = storage?.getItem(engine.SESSION_STORAGE_KEY);
      if (!raw) return;
      // One slot for the whole app. Only drop it when it belongs to the day just finished,
      // so a replay save for another day is left alone if this day never overwrote it.
      const saved = JSON.parse(raw) as { day?: number };
      if (saved.day === undefined || saved.day === day) storage?.removeItem(engine.SESSION_STORAGE_KEY);
    } catch {
      try {
        storage?.removeItem(engine.SESSION_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [storage, day]);

  useEffect(() => {
    if (finish === "done") return;
    save(state);
  }, [state, save, finish]);

  /* ---- apply a transition at the current time ---- */
  const dispatch = useCallback(
    (fn: (s: engine.SessionState, at: number) => engine.SessionState) => {
      const at = now();
      setClock(at);
      setState((s) => (s ? fn(engine.tick(s, at, restRef.current), at) : s));
    },
    [now],
  );

  /* ---- UI clock while running ---- */
  const running = Boolean(state?.running);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => dispatch((s) => s), tickMs);
    return () => clearInterval(id);
  }, [running, tickMs, dispatch]);

  /* ---- auto-pause when the tab is hidden / page is being left ---- */
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const onHide = () => {
      const current = stateRef.current;
      if (!current) return;
      const at = now();
      const paused = engine.pause(current, at, restRef.current);
      save(paused);
      if (paused !== current) {
        setClock(at);
        setState(paused);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [now, save]);

  /* ---- cues ---- */
  useEffect(() => {
    if (!state) return;
    if (!state.started) {
      cueSnap.current = null;
      return;
    }
    const snap = engine.snapshot(state, clock);
    const cues = engine.cuesBetween(cueSnap.current, snap, state.started);
    cueSnap.current = snap;
    if (!cues.length) return;
    setLastCue(cues[cues.length - 1]);
    if (cuesEnabled) for (const cue of cues) listeners.current.forEach((l) => l(cue));
  }, [state, clock, cuesEnabled]);

  const subscribe = useCallback((listener: (cue: engine.Cue) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const setCuesEnabled = useCallback(
    (on: boolean) => {
      setCuesEnabledState(on);
      try {
        storage?.setItem(CUES_SETTING_KEY, on ? "true" : "false");
      } catch {
        /* ignore */
      }
    },
    [storage],
  );

  /* ---- actions ---- */
  const finishDay = useCallback(
    async (feeling: number | null = null) => {
      const current = stateRef.current;
      if (!current || !current.readyToFinish) {
        setError("Finish or skip the remaining exercises first.");
        return false;
      }
      if (feeling !== null && (!Number.isInteger(feeling) || feeling < 1 || feeling > 5)) {
        setError(PROGRESS_MESSAGES.INVALID_FEELING);
        return false;
      }
      setFinish("finishing");
      setError(null);
      try {
        await completeDay(day, engine.completedRecords(current), feeling);
        clearSaved();
        setFinish("done");
        navigate(`/app/session/${day}/done`, { replace: true });
        return true;
      } catch (err) {
        setFinish("error");
        setError(err instanceof ProgressError ? err.message : PROGRESS_MESSAGES.UNKNOWN);
        return false;
      }
    },
    [completeDay, day, clearSaved, navigate],
  );

  const actions = useMemo<SessionActions>(() => {
    const clearError = () => {
      setError(null);
      setFinish((f) => (f === "error" ? "idle" : f));
    };
    // Keyboard shortcuts can fire before Start. Any action that moves the session also starts it,
    // so the clock runs and the progress is saved.
    const begun = (s: engine.SessionState, at: number) => (s.started ? s : engine.start(s, at));
    return {
      start: () => {
        clearError();
        dispatch(engine.start);
      },
      pause: () => dispatch((s, at) => engine.pause(s, at, restRef.current)),
      resume: () => dispatch(engine.resume),
      togglePause: () => dispatch((s, at) => (s.running ? engine.pause(s, at, restRef.current) : s.started ? engine.resume(s, at) : engine.start(s, at))),
      next: () => {
        clearError();
        dispatch((s, at) => engine.next(begun(s, at), at, restRef.current));
      },
      back: () => {
        clearError();
        dispatch((s, at) => engine.back(begun(s, at), at));
      },
      skipExercise: () => {
        clearError();
        dispatch((s, at) => engine.skipExercise(begun(s, at), at, restRef.current));
      },
      restartExercise: () => dispatch((s, at) => engine.restartExercise(begun(s, at), at)),
      markSetDone: () => dispatch((s, at) => engine.markSetDone(begun(s, at), at, restRef.current)),
      skipRest: () => dispatch((s, at) => engine.skipRest(begun(s, at), at, restRef.current)),
      finishDay,
      exit: () => {
        const current = stateRef.current;
        if (current) save(engine.pause(current, now(), restRef.current));
        navigate("/app/home");
      },
    };
  }, [dispatch, finishDay, save, now, navigate]);

  const handleKeyDown = useCallback<UseSessionResult["handleKeyDown"]>(
    (event) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      const binding = KEY_BINDINGS.find((b) => b.key === event.key);
      if (!binding) return;
      event.preventDefault();
      actions[binding.action]();
    },
    [actions],
  );

  /* ---- derived view ---- */
  const status: SessionStatus = (() => {
    if (!valid) return "locked";
    if (!ready || !plan) return "loading";
    if (!unlocked) return "locked";
    if (needsRecheck) return "recheck-required";
    if (finish === "done") return "done";
    if (finish === "finishing") return "finishing";
    if (finish === "error") return "error";
    if (!state) return "loading";
    if (!state.started) return "ready";
    // Every exercise is recorded; the session is still "in progress" until finishDay() is called.
    if (state.readyToFinish) return "in-progress";
    return state.running ? "in-progress" : "paused";
  })();

  const settled = state ? engine.tick(state, clock, restRef.current) : null;
  const item = settled?.items[settled.index] ?? null;
  const exercise = settled && plan ? plan.exercises[settled.index] ?? null : null;
  const dose = item?.dose ?? null;

  return {
    status,
    day,
    plan,
    currentDay,
    recheckRoute: needsRecheck && recheckKind ? `/app/recheck/${recheckKind}` : null,
    isReplay: ready && valid && isDayCompleted(day),

    index: settled?.index ?? 0,
    exercise,
    total: settled?.items.length ?? plan?.exercises.length ?? 0,
    isFirst: (settled?.index ?? 0) === 0,
    isLast: settled ? settled.index === settled.items.length - 1 : false,

    currentSet: settled?.set ?? 1,
    totalSets: dose?.sets ?? engine.SESSION_DEFAULTS.sets,
    repsTarget: dose ? dose.reps : null,
    holdSeconds: dose ? dose.holdSeconds : null,
    usedDefaults: dose?.usedDefaults ?? true,
    rhythm: REP_RHYTHM,

    timer: {
      mode: settled ? engine.timerMode(settled) : "reps",
      segment: settled?.segment ?? "work",
      secondsLeft: settled ? engine.secondsLeft(settled, clock) : 0,
      totalSeconds: settled?.segmentSeconds ?? 0,
      running: Boolean(settled?.running),
    },
    readyToFinish: Boolean(settled?.readyToFinish),
    exercisesDone: settled?.exercisesDone ?? [],
    media: exercise ? mediaFor(exercise.id) : {},
    error,

    actions,
    cues: { enabled: cuesEnabled, setEnabled: setCuesEnabled, last: lastCue, subscribe },
    reducedMotion,
    keyBindings: KEY_BINDINGS,
    handleKeyDown,
  };
}
