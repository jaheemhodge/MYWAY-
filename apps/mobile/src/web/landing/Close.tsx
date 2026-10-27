import { Link } from "react-router-dom";
import { routes } from "../routes";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./Close.module.css";

export function Close() {
  return (
    <section className={cx(ui.dark, styles.close)} aria-labelledby="close-title">
      <div className={cx(ui.wrap, styles.inner)}>
        <h2 id="close-title" className={cx(ui.h2, styles.title)}>
          When you’re ready, <span className={ui.soft}>start with one question.</span>
        </h2>
        <div className={styles.action}>
          <Link className={`web-btn web-btn-light ${styles.cta}`} to={routes.safety}>
            Take the free movement check-in
          </Link>
          <p className={ui.fine}>Free. About a dozen short screens. No account needed. The price is not on this page.</p>
        </div>
      </div>
    </section>
  );
}
