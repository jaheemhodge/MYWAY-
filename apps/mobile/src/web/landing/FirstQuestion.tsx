import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIDENCE_OPTIONS, createLandingAnswer, landingQuestion, type ConfidenceAnswer } from "../model";
import { routes } from "../routes";
import { loadLandingAnswer, saveLandingAnswer } from "../storage";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./FirstQuestion.module.css";

/**
 * The real first check-in question, answerable here. Choosing an answer saves it on this device
 * and opens the safety screen. The check-in then continues without asking it again.
 */
export function FirstQuestion() {
  const navigate = useNavigate();
  const question = landingQuestion();
  const [saved, setSaved] = useState(() => loadLandingAnswer());
  const [note, setNote] = useState("");

  const choose = (answer: ConfidenceAnswer) => {
    const record = createLandingAnswer(answer);
    const stored = saveLandingAnswer(record);
    setSaved(record);
    if (!stored) {
      setNote("We couldn’t store this on the device. The check-in will ask it again.");
    }
    navigate(routes.safety);
  };

  return (
    <section id="start" className={cx(ui.dark, ui.deep, styles.band)} aria-labelledby="first-question">
      <div className={cx(ui.wrap, styles.grid)}>
        <div className={styles.intro}>
          <h2 id="first-question" className={cx(ui.h2, styles.question)}>
            {question.title}
          </h2>
          <p className={styles.help}>{question.help}</p>
          <p className={styles.lead}>This is the first question of the free check-in. You can answer it right here.</p>
        </div>
        <div>
          <div className={styles.choices} role="radiogroup" aria-labelledby="first-question">
            {CONFIDENCE_OPTIONS.map((option) => {
              const active = saved?.answer === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={cx(styles.choice, active && styles.selected)}
                  onClick={() => choose(option.id)}
                >
                  <span>{option.label}</span>
                  <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                  </svg>
                </button>
              );
            })}
          </div>
          <p className={styles.after}>
            Choosing an answer opens the short safety screen first. Then the check-in continues, and we won’t ask
            this again. No account, no score.
          </p>
          {saved ? (
            <p className={styles.after}>
              You answered this already. <Link to={routes.safety}>Continue where you left off</Link>
            </p>
          ) : null}
          {note ? (
            <p className={styles.after} role="status">
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
