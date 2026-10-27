import { Link } from "react-router-dom";
import { routes } from "../routes";
import { DayTicks } from "./DayTicks";
import { Placeholder } from "./Placeholder";
import { useReducedMotion } from "./hooks";
import styles from "./Hero.module.css";

export function Hero() {
  const reduced = useReducedMotion();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.grid}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>Feel like</span>
            <em className={styles.line}>yourself</em>
            <span className={`${styles.line} ${styles.again}`}>again.</span>
          </h1>
          <p className={styles.lede}>
            Short video sessions for adults about 50 to 70. You practice at home, at your own pace, with
            conservative movements and clear stop rules.
          </p>
          <div className={styles.actions}>
            <Link className={`web-btn web-btn-light ${styles.cta}`} to={routes.safety}>
              Take the free movement check-in
            </Link>
            <a className={styles.secondary} href="#how">
              See how it works
            </a>
          </div>
          <p className={styles.note}>Free. About a dozen short screens. No account needed.</p>
        </div>
        <Placeholder
          className={styles.media}
          tone="dark"
          label="A woman about 60 to 65 rising from a sturdy dining chair by a bright window, mid-movement and at ease. Her own home, natural light."
        />
      </div>

      <div className={styles.fold}>
        <div className={styles.foldLabels} aria-hidden="true">
          <span>
            <strong>Day 1</strong> Get familiar
          </span>
          <span className={styles.foldMid}>
            <strong>Day 30</strong> Re-check
          </span>
          <span>
            <strong>Day 60</strong> Re-check
          </span>
        </div>
        <DayTicks day={1} size="small" animate={!reduced} />
        <p className={styles.foldText}>
          Sixty days in three phases, with the same check-in questions coming back on Day 30 and Day 60.{" "}
          <a href="#days">See the 60 days</a>
        </p>
      </div>
    </section>
  );
}
