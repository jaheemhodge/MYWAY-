import { cx } from "./hooks";
import styles from "./DayTicks.module.css";

export const TOTAL_DAYS = 60;
export const RECHECK_DAYS = [30, 60] as const;

/**
 * Sixty ticks in three phases. Done days in sage, today as a brass dot, Day 30 and Day 60 taller.
 * Purely visual: the meaning is always repeated in text next to it.
 */
export function DayTicks({ day, size = "large", animate = true }: { day: number; size?: "large" | "small"; animate?: boolean }) {
  return (
    <div className={cx(styles.ticks, styles[size], animate && styles.animate)} aria-hidden="true">
      {Array.from({ length: TOTAL_DAYS }, (_, index) => {
        const d = index + 1;
        const state = d < day ? styles.done : d === day ? styles.today : styles.ahead;
        const major = (RECHECK_DAYS as readonly number[]).includes(d);
        const phaseStart = d === 21 || d === 41;
        return <span key={d} className={cx(styles.tick, state, major && styles.major, phaseStart && styles.phaseStart)} />;
      })}
    </div>
  );
}
