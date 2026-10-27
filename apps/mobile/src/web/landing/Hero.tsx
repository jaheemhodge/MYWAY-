import { useState, type CSSProperties, type ReactNode } from "react";
import { routes } from "../routes";
import { DayTicks } from "./DayTicks";
import { LiquidMetalLink } from "./LiquidMetalLink";
import { useReducedMotion } from "./hooks";
import styles from "./Hero.module.css";

/**
 * The hero portrait (AI-generated, Higgsfield). Files live in public/images/hero/: WebP with a JPEG fallback,
 * and -768 versions for phones. `backdrop` is the photo's sampled edge colour and `glow` the lighter area
 * behind her head, so the page gradient continues the backdrop without a seam.
 */
const HERO_PORTRAIT = {
  base: "/images/hero/hero-portrait-woman",
  width: 1536,
  height: 2048,
  backdrop: "#6c765d",
  glow: "#757f66",
  alt: "A smiling woman in her sixties with long grey hair.",
} as const;

/** The same portrait as a short silent loop (public/hero/). Decorative; the still above stays as the fallback. */
const HERO_VIDEO = {
  webm: "/hero/hero-portrait-woman.webm",
  mp4: "/hero/hero-portrait-woman.mp4",
  poster: "/hero/hero-portrait-woman-poster.jpg",
} as const;

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
      style={
        {
          "--portrait-bg": HERO_PORTRAIT.backdrop,
          "--portrait-glow": HERO_PORTRAIT.glow,
        } as CSSProperties
      }
    >
      <div className={styles.stage}>
        <div className={styles.haze} aria-hidden="true" />
        <Portrait />
        <div className={styles.top}>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <h1 id="hero-title" className={styles.title}>
                <span className={styles.line}>Feel like</span>
                <em className={styles.line}>yourself</em>
                <span className={`${styles.line} ${styles.again}`}>again.</span>
              </h1>
              <p className={styles.lede}>
                Short video sessions for adults about 50 to 70. You practice at
                home, at your own pace, with conservative movements and clear
                stop rules.
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
          Sixty days in three phases, with the same check-in questions coming
          back on Day 30 and Day 60. <a href="#days">See the 60 days</a>
        </p>
      </div>
    </section>
  );
}

/**
 * Anchored to the bottom of the hero like a studio portrait: shoulders run off the bottom edge, only the left and
 * top-right edges fade. No card, no frame. A silent looping video plays in the slot; with reduced motion only its
 * poster shows. If the video can't load, the still portrait takes its place, and if that fails too the glow stays.
 */
function Portrait() {
  const reduced = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [stillFailed, setStillFailed] = useState(false);
  const { base, width, height, alt } = HERO_PORTRAIT;

  let media: ReactNode;
  if (!videoFailed && reduced) {
    media = (
      <img
        src={HERO_VIDEO.poster}
        alt=""
        aria-hidden="true"
        onError={() => setVideoFailed(true)}
      />
    );
  } else if (!videoFailed) {
    media = (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={HERO_VIDEO.poster}
        aria-hidden="true"
        tabIndex={-1}
        onError={() => setVideoFailed(true)}
      >
        <source src={HERO_VIDEO.webm} type="video/webm" />
        <source
          src={HERO_VIDEO.mp4}
          type="video/mp4"
          onError={() => setVideoFailed(true)}
        />
      </video>
    );
  } else if (!stillFailed) {
    media = (
      <picture>
        <source
          media="(max-width: 899px)"
          type="image/webp"
          srcSet={`${base}-768.webp`}
        />
        <source
          media="(max-width: 899px)"
          type="image/jpeg"
          srcSet={`${base}-768.jpg`}
        />
        <source type="image/webp" srcSet={`${base}.webp`} />
        <img
          src={`${base}.jpg`}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          onError={() => setStillFailed(true)}
        />
      </picture>
    );
  } else {
    return null;
  }

  return (
    <figure className={styles.portrait}>
      {media}
      <figcaption className={styles.caption}>AI-generated portrait</figcaption>
    </figure>
  );
}
