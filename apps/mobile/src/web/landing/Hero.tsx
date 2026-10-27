import { useState, type CSSProperties } from "react";
import { routes } from "../routes";
import { DayTicks } from "./DayTicks";
import { LiquidMetalLink } from "./LiquidMetalLink";
import { useReducedMotion } from "./hooks";
import styles from "./Hero.module.css";

/**
 * The hero portrait. Set `src` to the chosen Higgsfield portrait (2:3, at least 2000px tall,
 * seamless sage backdrop) and `backdrop` to the colour sampled from that backdrop, so the
 * page gradient and the photo meet without a seam. Until then `src` is null and the hero
 * shows the gradient alone with a labelled empty slot.
 */
export const HERO_PORTRAIT: {
  src: string | null;
  backdrop: string;
  alt: string;
} = {
  src: null,
  backdrop: "#6f8579",
  alt: "",
};

const PROOF = [
  "Clear stop rules in every session",
  "Personal to you",
  "At home, at your pace",
] as const;

export function Hero() {
  const reduced = useReducedMotion();
  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-title"
      style={{ "--portrait-bg": HERO_PORTRAIT.backdrop } as CSSProperties}
    >
      <div className={styles.top}>
        <div className={styles.haze} aria-hidden="true" />
        <Portrait />

        <div className={styles.grid}>
          <div className={styles.copy}>
            <h1 id="hero-title" className={styles.title}>
              <span className={styles.line}>Feel like</span>
              <em className={styles.line}>yourself</em>
              <span className={`${styles.line} ${styles.again}`}>again.</span>
            </h1>
            <p className={styles.lede}>
              Short video sessions for adults about 50 to 70. You practice at
              home, at your own pace, with conservative movements and clear stop
              rules.
            </p>
            <div className={styles.actions}>
              <LiquidMetalLink to={routes.safety} tone="cream">
                Take the free movement check-in
              </LiquidMetalLink>
              <a className={styles.secondary} href="#how">
                See how it works
              </a>
            </div>
            <p className={styles.note}>
              Free. About a dozen short screens. No account needed.
            </p>
          </div>
        </div>
      </div>

      <ul className={styles.proof}>
        {PROOF.map((item) => (
          <li key={item}>
            <span className={styles.proofDot} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

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
          Sixty days in three phases, with the same check-in questions coming
          back on Day 30 and Day 60. <a href="#days">See the 60 days</a>
        </p>
      </div>
    </section>
  );
}

/** Full-height, bottom-aligned, edges masked into the gradient. No card, no frame. */
function Portrait() {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : HERO_PORTRAIT.src;
  return (
    <figure className={styles.portrait}>
      {src ? (
        <img
          src={src}
          alt={HERO_PORTRAIT.alt}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={styles.slot}
          role="img"
          aria-label="Photo placeholder: hero portrait to come."
        >
          Portrait slot: your chosen Higgsfield portrait goes here
        </span>
      )}
      <figcaption className={styles.caption}>
        {src ? "AI-generated portrait" : "Photo placeholder"}
      </figcaption>
    </figure>
  );
}
