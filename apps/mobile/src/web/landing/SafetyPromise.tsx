import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./SafetyPromise.module.css";

const STOP_FOR = ["Sharp pain", "Pain that builds", "Dizziness", "Chest discomfort", "Feeling unsteady"];

const PROMISES = [
  { title: "Conservative movements.", body: "Supported movements in a careful order across 60 days." },
  { title: "Your own pace.", body: "Pause any time. Fewer repetitions, or skipping a movement, is always allowed." },
  {
    title: "A safety screen first.",
    body: "Yes, or I’m not sure, on a red-flag question asks you to check with your doctor before starting.",
  },
  {
    title: "Check with your doctor if unsure.",
    body: "Answering no is not a medical clearance. The screen cannot rule out a health problem.",
  },
];

export function SafetyPromise() {
  return (
    <section id="safety-promise" className={cx(ui.rails, ui.section)} aria-labelledby="safety-title">
      <div className={cx(ui.wrap, styles.grid)}>
        <div>
          <h2 id="safety-title" className={ui.h2}>
            Careful by design. <span className={ui.soft}>You can always stop.</span>
          </h2>
          <dl className={styles.promises}>
            {PROMISES.map((item) => (
              <div key={item.title} className={styles.promise}>
                <dt>{item.title}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.stop}>
          <h3 className={styles.stopTitle}>Stop and rest for any of these</h3>
          <ul className={styles.stopList}>
            {STOP_FOR.map((item) => (
              <li key={item}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                  <path d="M10 9v6M14 9v6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <p className={styles.stopNote}>
            If you might be having an emergency, contact local emergency services. Mobility does not monitor
            emergencies.
          </p>
        </div>
      </div>
    </section>
  );
}
