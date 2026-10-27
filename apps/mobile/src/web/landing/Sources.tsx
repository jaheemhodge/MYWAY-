import { SOURCES } from "../copy";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./Sources.module.css";

export function Sources() {
  return (
    <section id="sources" className={cx(ui.rails, ui.section, styles.section)} aria-labelledby="sources-title">
      <div className={cx(ui.wrap, styles.grid)}>
        <div>
          <h2 id="sources-title" className={ui.h2}>
            Built on guidance from <span className={ui.soft}>physiotherapy education.</span>
          </h2>
          <p className={ui.lede}>
            Public teaching from physiotherapists informed the ideas behind these sessions. The names here are
            educational references. They have not reviewed Mobility, they have not endorsed it, and this is not their
            program. We do not use their logos, their scripts, or their footage.
          </p>
        </div>

        <ul className={styles.rows}>
          {SOURCES.map((source) => (
            <li key={source.id} className={styles.row}>
              <svg className={styles.thumb} viewBox="0 0 96 64" aria-hidden="true">
                <rect x="1" y="1" width="94" height="62" rx="10" />
                <path d="M41 22v20l17-10z" />
                <path d="M14 52h68" />
              </svg>
              <div className={styles.text}>
                <h3 className={styles.name}>{source.name}</h3>
                <p className={styles.detail}>{source.detail}</p>
              </div>
              <p className={styles.tag}>Educational reference. Not an endorsement.</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
