import { Link } from "react-router-dom";
import { POSITION_LABEL, type Exercise } from "../data/library";
import { opensOnDay } from "../data/plan";
import { ExerciseThumb } from "./ExerciseThumb";

/**
 * The image is the card: a 4:5 picture, then plain text on the page underneath
 * (one meta line, the name, one quiet line). No container, border or shadow.
 * The whole card is one link named by the exercise.
 */
export function ExerciseCard({
  exercise,
  currentDay,
  eyebrow,
  line,
  srPrefix,
}: {
  exercise: Exercise;
  currentDay: number;
  /** Meta line above the name. Defaults to "Chair · Phase 1". */
  eyebrow?: string;
  /** Quiet line under the name. Defaults to the exercise subtitle. */
  line?: string;
  /** Read before the name, e.g. "Exercise 2: ". */
  srPrefix?: string;
}) {
  const titleId = `card-${exercise.id}-title`;
  const opens = opensOnDay(exercise.phase, currentDay);
  const meta = eyebrow ?? `${POSITION_LABEL[exercise.position]} · Phase ${exercise.phase}`;
  const quiet = line ?? exercise.subtitle;
  return (
    <article className="mob-card" aria-labelledby={titleId}>
      <ExerciseThumb exercise={exercise} badge={opens ? `Opens Day ${opens}` : undefined} />
      <div className="mob-card__body">
        <p className="mob-card__eyebrow">{meta}</p>
        <h3 className="mob-card__title" id={titleId}>
          <Link to={`/app/library/${exercise.id}`} className="mob-card__link">
            {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
            {exercise.name}
          </Link>
        </h3>
        {quiet ? <p className="mob-card__meta">{quiet}</p> : null}
      </div>
    </article>
  );
}
