import { Link } from "react-router-dom";
import { routes } from "../routes";
import { cx } from "./hooks";
import ui from "./ui.module.css";
import styles from "./AloneVsMobility.module.css";

const ALONE = [
  { title: "Search for a workout video", body: "Thousands to choose from, most made for someone else." },
  { title: "Guess whether it suits you", body: "Nobody asks what feels hard for you." },
  { title: "Follow it in any order", body: "Hard days and easy days, mixed at random." },
  { title: "No stop rules on screen", body: "You decide alone when something is too much." },
  { title: "Hard to tell what changed", body: "Nothing to look back on." },
];

const MOBILITY = [
  { title: "A short safety screen", body: "Six questions first. Yes, or I’m not sure, pauses here." },
  { title: "The free check-in", body: "Stairs, chairs, the floor, groceries, balance. In your own words." },
  { title: "Your 60 days, before a price", body: "The plan repeats what you told us. The price comes after." },
  { title: "Day 1 at home", body: "About 8 minutes, with a sturdy chair and a counter." },
  { title: "Re-checks on Day 30 and 60", body: "The same questions come back. Still no score." },
];

export function AloneVsMobility() {
  return (
    <section id="how" className={cx(ui.rails, ui.section)} aria-labelledby="how-title">
      <div className={ui.wrap}>
        <div className={styles.head}>
          <h2 id="how-title" className={ui.h2}>
            Doing it alone, <span className={ui.soft}>or in a careful order.</span>
          </h2>
          <p className={ui.lede}>
            Free videos are everywhere. What is missing is a sensible order, a safety screen before you start, and
            stop rules you can trust.
          </p>
        </div>

        <ol className={cx(styles.row, styles.alone)} aria-label="Doing it alone">
          <li className={styles.label} aria-hidden="true">
            Doing it alone
          </li>
          {ALONE.map((step) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.dot} aria-hidden="true" />
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </li>
          ))}
        </ol>

        <ol className={cx(styles.row, styles.mobility)} aria-label="With Mobility">
          <li className={styles.label} aria-hidden="true">
            With Mobility
          </li>
          {MOBILITY.map((step) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.dot} aria-hidden="true" />
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </li>
          ))}
        </ol>

        <div className={styles.foot}>
          <Link className="web-btn web-btn-primary" to={routes.safety}>
            Take the free movement check-in
          </Link>
        </div>
      </div>
    </section>
  );
}
