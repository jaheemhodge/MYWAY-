import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { clampDay } from "./data/plan";

/** Sample current day. Day 12 = Wednesday 28 October 2026 in the sample calendar. */
export const DEFAULT_DAY = 12;

interface DayState {
  currentDay: number;
  setCurrentDay: (day: number) => void;
  /** Days finished in this browser session (local state only, nothing is saved). */
  finished: ReadonlySet<number>;
  markFinished: (day: number) => void;
  isDone: (day: number) => boolean;
}

const DayContext = createContext<DayState | null>(null);

export function DayProvider({ children }: { children: ReactNode }) {
  const [currentDay, setDay] = useState(DEFAULT_DAY);
  const [finished, setFinished] = useState<Set<number>>(() => new Set());

  const setCurrentDay = useCallback((day: number) => setDay(clampDay(day)), []);
  const markFinished = useCallback((day: number) => {
    setFinished((prev) => new Set(prev).add(day));
  }, []);

  const value = useMemo<DayState>(
    () => ({
      currentDay,
      setCurrentDay,
      finished,
      markFinished,
      // Sample assumption: every earlier day was completed.
      isDone: (day: number) => day < currentDay || finished.has(day),
    }),
    [currentDay, setCurrentDay, finished, markFinished],
  );

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

export function useDay(): DayState {
  const value = useContext(DayContext);
  if (!value) throw new Error("useDay must be used inside DayProvider");
  return value;
}
