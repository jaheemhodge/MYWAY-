import { cx } from "./hooks";
import styles from "./Placeholder.module.css";

/**
 * A clearly labelled slot for photography or film that does not exist yet.
 * It says what the shot should be, so it can be briefed and replaced one for one.
 */
export function Placeholder({
  kind = "Photo",
  label,
  tone = "dark",
  className,
}: {
  kind?: "Photo" | "Film";
  label: string;
  tone?: "dark" | "light" | "warm" | "sage";
  className?: string;
}) {
  return (
    <div role="img" aria-label={`${kind} placeholder: ${label}`} className={cx(styles.slot, styles[tone], className)}>
      <span className={styles.tag}>{kind} placeholder</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
