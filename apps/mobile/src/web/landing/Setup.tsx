import { cx, useInView, useReducedMotion } from "./hooks";
import ui from "./ui.module.css";
import styles from "./Setup.module.css";

/** The brand's one line style: a window, a counter, a chair against the wall. One 1.6 stroke, no fills, no faces. */
const STROKES = [
  "M60 40h260v300H60z",
  "M60 190h260M190 40v300",
  "M84 250c30-38 66-48 102-19 19 15 36 19 62 8",
  "M372 64v376",
  "M372 300h120M480 300v140",
  "M296 330h124v18h-18v92h-16v-92h-72v92h-16v-92h-18v-18h16z",
  "M314 330v-86h92",
  "M40 440h480",
];

export function Setup() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>({ once: true, rootMargin: "0px 0px -25% 0px" });
  const drawn = reduced || inView;

  return (
    <section id="setup" className={cx(ui.rails, ui.section)} aria-labelledby="setup-title">
      <div className={cx(ui.wrap, styles.grid)}>
        <figure className={styles.figure} ref={ref}>
          <svg
            className={cx(styles.drawing, drawn && styles.drawn, !reduced && styles.animated)}
            viewBox="0 0 560 470"
            role="img"
            aria-label="Line drawing of the setup: a window, a kitchen counter, and a sturdy chair against the wall."
          >
            {STROKES.map((d, index) => (
              <path key={d} d={d} pathLength={1} style={{ transitionDelay: `${index * 140}ms` }} />
            ))}
          </svg>
          <figcaption className={styles.caption}>A chair and a window. That is the setup.</figcaption>
        </figure>

        <div className={styles.copy}>
          <h2 id="setup-title" className={ui.h2}>
            A sturdy chair. <span className={ui.soft}>A counter or a wall.</span>
          </h2>
          <p className={ui.lede}>No gym, no mat, no weights. Day 1 uses what is already in most kitchens.</p>
          <ul className={styles.list}>
            <li>
              <strong>A sturdy chair without wheels,</strong> ideally against a wall.
            </li>
            <li>
              <strong>A fixed counter</strong> or similar surface at about hip height.
            </li>
            <li>
              <strong>Room to stand and take a step.</strong> The check-in asks what you actually have.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
