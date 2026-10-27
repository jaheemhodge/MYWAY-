import { Link } from "react-router-dom";
import { routes } from "../routes";
import styles from "./SiteFooter.module.css";

/** Shared by every public page. Ends on the wordmark, as both references do. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.about}>
            <p className={styles.tagline}>
              Feel like <em>yourself</em> again.
            </p>
            <p>
              A 60-day home movement program for adults about 50 to 70. It is not medical advice, not physiotherapy,
              not a diagnosis, and not emergency care. It does not tell you the cause of pain, and it does not clear
              you to exercise.
            </p>
          </div>
          <nav aria-label="Footer" className={styles.nav}>
            <Link to={routes.safety}>Safety screen</Link>
            <Link to={routes.checkIn}>Free check-in</Link>
            <Link to={routes.plan}>Plan preview</Link>
            <Link to={routes.signUp}>Sign up</Link>
            <Link to={routes.welcome}>In-app preview</Link>
            <Link to={routes.legal}>Privacy note</Link>
          </nav>
        </div>
        <p className={styles.meta}>
          Educational references on this site are sources only. They are not endorsements, partnerships, or a review
          of Mobility. If you might be having an emergency, contact local emergency services.
        </p>
        <p className={styles.meta}>© 2026 Jah Brands LLC. Mobility is a working name.</p>
      </div>
      <p className={styles.wordmark} aria-hidden="true">
        Mobility
      </p>
    </footer>
  );
}
