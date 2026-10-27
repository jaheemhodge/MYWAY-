import { useState } from "react";
import { FAQ, FAQ_GROUPS, type FaqGroupId } from "../copy";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./Faq.module.css";

type Filter = FaqGroupId | "all";

export function Faq() {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? FAQ : FAQ.filter((item) => item.group === filter);
  const rail: { id: Filter; label: string }[] = [{ id: "all", label: "All questions" }, ...FAQ_GROUPS];

  return (
    <section id="faq" className={cx(ui.rails, ui.section)} aria-labelledby="faq-title">
      <div className={cx(ui.wrap, styles.grid)}>
        <div className={styles.side}>
          <h2 id="faq-title" className={ui.h2}>
            Short answers, <span className={ui.soft}>before you begin.</span>
          </h2>
          <div className={styles.rail} role="group" aria-label="Show questions about">
            {rail.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cx(styles.railItem, filter === item.id && styles.railActive)}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {shown.map((item) => (
            <details key={item.id} className={styles.item}>
              <summary className={styles.summary}>
                <span>{item.question}</span>
                <svg className={styles.plus} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className={styles.answer}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
