import { Link } from "react-router-dom";
import { displayName, POSITION_LABEL, type Exercise } from "../data/library";
import { opensOnDay } from "../data/plan";
import { ExerciseThumb } from "./ExerciseThumb";

/**
 * The image is the card: a 4:5 picture, one meta line and the name. Nothing else.
 * The whole card is one link. Long names end in an ellipsis on screen; the full text is still read.
 */
export function ExerciseCard({
  exercise,
  currentDay,
  eyebrow,
  srPrefix,
}: {
  exercise: Exercise;
  currentDay: number;
  /** Meta line above the name. Defaults to "Chair · Phase 1". */
  eyebrow?: string;
  /** Read before the name, e.g. "Exercise 2: ". */
  srPrefix?: string;
}) {
  const titleId = `card-${exercise.id}-title`;
  const opens = opensOnDay(exercise.phase, currentDay);
  const meta = eyebrow ?? `${POSITION_LABEL[exercise.position]} · Phase ${exercise.phase}`;
  return (
    <article className="mob-card" aria-labelledby={titleId}>
      <ExerciseThumb exercise={exercise} badge={opens ? `Opens Day ${opens}` : undefined} />
      <div className="mob-card__body">
        <p className="mob-card__eyebrow">{meta}</p>
        <h3 className="mob-card__title" id={titleId}>
          <Link to={`/app/library/${exercise.id}`} className="mob-card__link">
            {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
            {displayName(exercise)}
          </Link>
        </h3>
      </div>
    </article>
  );
}
