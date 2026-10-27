import { useEffect, useRef, useState } from "react";
import { Placeholder } from "./Placeholder";
import { cx } from "./hooks";
import styles from "./DayOneClip.module.css";

/** A still from the clip (leg extended). The title card, day01-poster.jpg, carries a DRAFT stamp and stays off public pages. */
export const DAY1_POSTER = "/videos/day-01/day01-knee-extension-poster.jpg";
export const DAY1_CLIP = "/videos/day-01/day01-test-knee-extension-left-rep-v2.mp4";

/**
 * Day 1 seated knee extension: our poster, then the test rep clip, muted and looping.
 * Nothing plays until the visitor presses play. If the poster or the clip is missing,
 * the labelled film placeholder is shown instead, so the section never shows a broken player.
 */
export function DayOneClip({ fallbackLabel, className }: { fallbackLabel: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const probe = new Image();
    probe.onerror = () => setMissing(true);
    probe.src = DAY1_POSTER;
  }, []);

  if (missing) return <Placeholder kind="Film" tone="dark" className={className} label={fallbackLabel} />;

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <figure className={cx(styles.figure, className)}>
      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.video}
          poster={DAY1_POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Day 1 test clip: seated knee extension, one repetition with the left leg. No sound."
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setMissing(true)}
        >
          <source src={DAY1_CLIP} type="video/mp4" onError={() => setMissing(true)} />
        </video>
        <button
          type="button"
          className={cx(styles.toggle, playing ? styles.toggleCorner : styles.toggleCenter)}
          onClick={toggle}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14M16 5v14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5v15l12-7.5z" />
            </svg>
          )}
          {playing ? "Pause the clip" : "Play the clip"}
        </button>
      </div>
      <figcaption className={styles.caption}>
        Test clip of our own AI-generated instructor: one seated knee extension, left leg, muted and looping. Not yet
        clinically reviewed. The full Day 1 film is still being prepared.
      </figcaption>
    </figure>
  );
}
