import { useEffect, useRef, useState } from "react";
import { Placeholder } from "./Placeholder";
import { cx, useInView, useReducedMotion } from "./hooks";
import ui from "./ui.module.css";
import styles from "./RepRhythm.module.css";

/** One repetition: lift for 2 seconds, hold for 1, lower for 3. */
const LIFT = 2;
const HOLD = 1;
const LOWER = 3;
const CYCLE = LIFT + HOLD + LOWER;

// The trace, in SVG units: 100 units per second across, rising 110 units.
const BASE = 140;
const PEAK = 30;
const SEGMENTS = [
  { from: [0, BASE], to: [200, PEAK] },
  { from: [200, PEAK], to: [300, PEAK] },
  { from: [300, PEAK], to: [600, BASE] },
] as const;
const LENGTHS = SEGMENTS.map(({ from, to }) => Math.hypot(to[0] - from[0], to[1] - from[1]));
const TOTAL_LENGTH = LENGTHS.reduce((sum, value) => sum + value, 0);
const TRACE = `M0 ${BASE} L200 ${PEAK} L300 ${PEAK} L600 ${BASE}`;

type Phase = "lift" | "hold" | "lower";

function sample(t: number): { x: number; y: number; travelled: number; phase: Phase } {
  const index = t < LIFT ? 0 : t < LIFT + HOLD ? 1 : 2;
  const start = index === 0 ? 0 : index === 1 ? LIFT : LIFT + HOLD;
  const span = index === 0 ? LIFT : index === 1 ? HOLD : LOWER;
  const k = Math.min(1, Math.max(0, (t - start) / span));
  const { from, to } = SEGMENTS[index];
  const before = LENGTHS.slice(0, index).reduce((sum, value) => sum + value, 0);
  return {
    x: from[0] + (to[0] - from[0]) * k,
    y: from[1] + (to[1] - from[1]) * k,
    travelled: before + LENGTHS[index] * k,
    phase: (["lift", "hold", "lower"] as const)[index],
  };
}

export function RepRhythm() {
  const reduced = useReducedMotion();
  const [viewRef, inView] = useInView<HTMLDivElement>();
  // With reduced motion the diagram is still unless the visitor asks for it to move.
  const [wantsMotion, setWantsMotion] = useState<boolean | null>(null);
  const playing = (wantsMotion ?? !reduced) && inView;

  const dotRef = useRef<SVGCircleElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const elapsed = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current = (elapsed.current + (now - last) / 1000) % CYCLE;
      last = now;
      const point = sample(elapsed.current);
      dotRef.current?.setAttribute("cx", point.x.toFixed(1));
      dotRef.current?.setAttribute("cy", point.y.toFixed(1));
      progressRef.current?.setAttribute("stroke-dashoffset", (TOTAL_LENGTH - point.travelled).toFixed(1));
      if (clockRef.current) clockRef.current.textContent = elapsed.current.toFixed(1);
      setPhase((current) => (current === point.phase ? current : point.phase));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const moving = wantsMotion ?? !reduced;

  return (
    <section id="session" className={cx(ui.dark, ui.deep, ui.section)} aria-labelledby="session-title">
      <div className={cx(ui.wrap, styles.grid)}>
        <div className={styles.head}>
          <h2 id="session-title" className={ui.h2}>
            Lift for two, hold for one, <span className={ui.soft}>lower for three.</span>
          </h2>
          <p className={ui.lede}>
            Every movement follows the same unhurried count. Here it is with the seated knee extension, the first
            movement of Day 1. In a session the count runs beside the instructor, so you never have to keep it
            yourself.
          </p>
        </div>

        <div className={styles.player} ref={viewRef}>
          <Placeholder
            kind="Film"
            tone="dark"
            className={styles.film}
            label="Day 1, seated knee extension. Our own instructor, a woman about 60 to 65, sits tall on a sturdy chair without wheels, its back against the wall, and slowly straightens one knee: 2 s lift, 1 s hold, 3 s lower, 5 times each side. Locked-off camera, voice-over. The Day 1 film is still being prepared."
          />

          <div className={styles.rhythm}>
            <svg
              className={styles.trace}
              viewBox="-10 10 620 150"
              role="img"
              aria-label="Rep rhythm: lift for 2 seconds, hold for 1 second, lower for 3 seconds. One repetition takes 6 seconds."
            >
              <line x1="0" y1={BASE} x2="600" y2={BASE} className={styles.base} />
              <path d={TRACE} className={styles.track} />
              <path
                ref={progressRef}
                d={TRACE}
                className={styles.progress}
                strokeDasharray={TOTAL_LENGTH}
                strokeDashoffset={moving ? TOTAL_LENGTH : 0}
              />
              <circle ref={dotRef} cx={moving ? 0 : 200} cy={moving ? BASE : PEAK} r="9" className={styles.dot} />
            </svg>

            <ol className={styles.labels}>
              <li className={cx(styles.label, styles.liftLabel, phase === "lift" && styles.on)}>
                Lift <strong>2 s</strong>
              </li>
              <li className={cx(styles.label, styles.holdLabel, phase === "hold" && styles.on)}>
                Hold <strong>1 s</strong>
              </li>
              <li className={cx(styles.label, styles.lowerLabel, phase === "lower" && styles.on)}>
                Lower <strong>3 s</strong>
              </li>
            </ol>

            <div className={styles.controls}>
              <button type="button" className={styles.play} onClick={() => setWantsMotion(!moving)}>
                {moving ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14M16 5v14" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 4.5v15l12-7.5z" />
                  </svg>
                )}
                {moving ? "Pause the rhythm" : reduced ? "Show the rhythm moving" : "Play the rhythm"}
              </button>
              <p className={styles.clock} aria-hidden="true">
                <span ref={clockRef}>0.0</span> of {CYCLE} s
              </p>
            </div>
          </div>
        </div>

        <aside className={styles.side} aria-label="Day 1 and the stop rules">
          <h3 className={styles.sideTitle}>Day 1, about 8 minutes</h3>
          <ul className={styles.list}>
            <li>Seated knee extension</li>
            <li>A small standing hip movement, both hands on a counter</li>
            <li>A supported sit-to-stand</li>
          </ul>
          <p className={styles.small}>Fewer repetitions, or skipping a movement, is always allowed.</p>

          <div className={styles.stop}>
            <h3 className={styles.sideTitle}>You can stop.</h3>
            <p>Stop for sharp pain, pain that builds, dizziness, chest discomfort, or unsteadiness.</p>
            <p className={styles.small}>Stopping when something feels wrong is the right call, not a missed day.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
