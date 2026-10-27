import { useState, type CSSProperties } from "react";
import { confidenceLabel, type ConfidenceAnswer } from "../model";
import { Placeholder } from "./Placeholder";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./EverydayMoments.module.css";

const MOMENTS: {
  id: string;
  task: string;
  title: string;
  photo: string;
  tone: "warm" | "sage";
  tint: string;
  day1: ConfidenceAnswer;
  day60: ConfidenceAnswer;
}[] = [
  {
    id: "stairs",
    task: "Stairs",
    title: "The stairs at the end of a long day.",
    photo: "A man about 62 walking up the stairs in his own home, one hand light on the rail, evening light.",
    tone: "warm",
    tint: "#efe4d5",
    day1: "somewhat_confident",
    day60: "confident",
  },
  {
    id: "chair",
    task: "Getting up from a chair",
    title: "Your usual chair, at your usual table.",
    photo: "A woman about 68 standing up from a kitchen chair, hands on the seat edge, morning light.",
    tone: "sage",
    tint: "#e5e9df",
    day1: "not_confident",
    day60: "somewhat_confident",
  },
  {
    id: "groceries",
    task: "Carrying groceries",
    title: "From the car to the kitchen.",
    photo: "A woman about 56 carrying two shopping bags through her front door, everyday clothes.",
    tone: "warm",
    tint: "#f1e3d3",
    day1: "confident",
    day60: "very_confident",
  },
];

export function EverydayMoments() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <section
      id="moments"
      className={cx(ui.rails, ui.section, styles.section)}
      style={{ "--tint": MOMENTS[active].tint } as CSSProperties}
      aria-labelledby="moments-title"
    >
      <div className={ui.wrap}>
        <div className={styles.head}>
          <h2 id="moments-title" className={ui.h2}>
            Stairs, chairs, the shopping. <span className={ui.soft}>Told in your own words.</span>
          </h2>
          <p className={ui.lede}>
            The check-in asks how confident you feel with everyday tasks. On Day 30 and Day 60 the same questions
            come back, so you can read your answers side by side. No score, no percentile, no photos of bodies.
          </p>
        </div>

        <ul className={styles.moments}>
          {MOMENTS.map((moment, index) => {
            const flipped = Boolean(open[moment.id]);
            return (
              <li
                key={moment.id}
                className={cx(styles.moment, styles[`m${index}`])}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <div className={cx(styles.face, flipped && styles.flipped)}>
                  <Placeholder className={styles.photo} tone={moment.tone} label={moment.photo} />
                  <div className={styles.words} aria-hidden={!flipped}>
                    <p className={styles.wordsTask}>{moment.task}</p>
                    <div className={styles.compare}>
                      <p>
                        <span className={styles.when}>Day 1</span>
                        <span className={styles.answer}>{confidenceLabel(moment.day1)}</span>
                      </p>
                      <svg className={styles.arrow} viewBox="0 0 48 24" aria-hidden="true">
                        <path d="M2 12h42M36 4l8 8-8 8" />
                      </svg>
                      <p>
                        <span className={styles.when}>Day 60</span>
                        <span className={styles.answer}>{confidenceLabel(moment.day60)}</span>
                      </p>
                    </div>
                    <p className={styles.illustrative}>
                      Illustrative example, not real member data. Your own answers would appear here.
                    </p>
                  </div>
                </div>
                <h3 className={styles.title}>{moment.title}</h3>
                <button
                  type="button"
                  className={styles.toggle}
                  aria-expanded={flipped}
                  onClick={() => {
                    setActive(index);
                    setOpen((current) => ({ ...current, [moment.id]: !flipped }));
                  }}
                >
                  {flipped ? "Show the photo again" : "See it in your own words"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
