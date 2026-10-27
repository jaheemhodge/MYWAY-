import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { PHASES } from "../copy";
import { DayTicks, TOTAL_DAYS } from "./DayTicks";
import { cx, useMediaQuery, useReducedMotion } from "./hooks";
import ui from "./ui.module.css";
import styles from "./SixtyDayLine.module.css";

/** The days a visitor can jump to, and what each one is like. Copy stays descriptive: no promised results. */
const STOPS = [
  {
    day: 1,
    title: "Day 1",
    body: "About 8 minutes. Seated knee extension, a small standing hip movement with both hands on a counter, and a supported sit-to-stand.",
  },
  {
    day: 12,
    title: "Day 12",
    body: "The quiet middle of the first phase, where the practice happens and not much looks different yet. You showed up today.",
  },
  {
    day: 30,
    title: "Day 30 · Re-check",
    body: "The same check-in questions come back. You answer in your own words, and see them next to Day 1. There is no score.",
  },
  {
    day: 45,
    title: "Day 45",
    body: "You keep the routine you have been practicing. A missed day never makes the next one longer or harder.",
  },
  {
    day: 60,
    title: "Day 60 · Re-check",
    body: "Day 1 and Day 60, side by side, in your own words. What you do next is up to you.",
  },
] as const;

function phaseIndex(day: number): number {
  return day <= 20 ? 0 : day <= 40 ? 1 : 2;
}

/** Space between the sticky header and the bottom of the window, in px. */
function spaceBelowHeader(): number {
  const header = document.querySelector(".web-header");
  return window.innerHeight - (header ? header.getBoundingClientRect().height : 0);
}

const PINNED_PADDING = 32; // .pinned .inner padding-block, per side

/** Whether the panel's content, at its full length, fits on one screen under the header. */
function useFitsBelowHeader(ref: RefObject<HTMLElement>, enabled: boolean): boolean {
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) {
      setFits(false);
      return;
    }
    const measure = () => {
      const style = getComputedStyle(node);
      const content = node.offsetHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setFits(content + PINNED_PADDING * 2 <= spaceBelowHeader());
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref, enabled]);
  return fits;
}

function stopFor(day: number) {
  return [...STOPS].reverse().find((stop) => stop.day <= day) ?? STOPS[0];
}

export function SixtyDayLine() {
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 900px)");
  const innerRef = useRef<HTMLDivElement>(null);
  const fits = useFitsBelowHeader(innerRef, wide && !reduced);
  // Pinned and scroll-driven only with motion allowed and room to show the whole panel, full copy and all.
  const pinned = wide && !reduced && fits;

  const outerRef = useRef<HTMLDivElement>(null);
  const [day, setDay] = useState(1);

  const scrollRange = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return null;
    const top = outer.getBoundingClientRect().top + window.scrollY;
    const travel = outer.offsetHeight - window.innerHeight;
    return { top, travel: Math.max(travel, 1) };
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const range = scrollRange();
      if (!range) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - range.top) / range.travel));
      setDay(1 + Math.round(progress * (TOTAL_DAYS - 1)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pinned, scrollRange]);

  const jumpTo = (target: number) => {
    const range = pinned ? scrollRange() : null;
    if (!range) {
      setDay(target);
      return;
    }
    window.scrollTo({ top: range.top + (range.travel * (target - 1)) / (TOTAL_DAYS - 1), behavior: "smooth" });
  };

  const stop = stopFor(day);
  const activePhase = phaseIndex(day);

  return (
    <section id="days" className={cx(ui.dark, styles.section)} aria-labelledby="days-title">
      <div ref={outerRef} className={cx(styles.track, pinned && styles.pinned)}>
        <div className={styles.stage}>
          <div ref={innerRef} className={cx(ui.wrap, styles.inner)}>
            <div className={styles.top}>
              <h2 id="days-title" className={ui.h2}>
                Sixty days, <span className={ui.soft}>in a careful order.</span>
              </h2>
              <div className={styles.now}>
                <p className={styles.dayNumber} aria-hidden="true">
                  <span>Day</span> {day}
                </p>
                <div className={styles.note}>
                  <p className={styles.noteTitle}>{stop.title}</p>
                  <p className={styles.noteBody}>{stop.body}</p>
                </div>
              </div>
            </div>

            <div className={styles.lineWrap}>
              <div className={styles.recheckLabels} aria-hidden="true">
                <span style={{ left: `${(29 / 59) * 100}%` }}>Re-check</span>
                <span style={{ left: "100%" }}>Re-check</span>
              </div>
              <DayTicks day={day} animate={!reduced} />
              <p className={ui.visuallyHidden}>
                Day {day} of 60, in the phase {PHASES[activePhase].title}.
              </p>
            </div>

            <div className={styles.pills} role="group" aria-label="Show a day on the 60-day line">
              {STOPS.map((item) => (
                <button
                  key={item.day}
                  type="button"
                  className={cx(styles.pill, stop.day === item.day && styles.pillActive)}
                  aria-pressed={stop.day === item.day}
                  onClick={() => jumpTo(item.day)}
                >
                  Day {item.day}
                </button>
              ))}
            </div>

            <ol className={styles.phases}>
              {PHASES.map((phase, index) => (
                <li key={phase.id} className={cx(styles.phase, index === activePhase && styles.phaseActive)}>
                  <p className={styles.range}>{phase.range}</p>
                  <h3 className={styles.phaseTitle}>{phase.title}</h3>
                  <p className={styles.phaseBody}>{phase.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
