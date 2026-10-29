import { Link } from "react-router-dom";
import { imageFor } from "../data/images";
import type { Exercise } from "../data/library";
import { ExerciseTags } from "./Tags";

/**
 * Picture card: 4:5 image with rounded corners, then tags, name and one quiet line.
 * Text never sits on the image. The whole card is one link named by the exercise.
 */
export function ExerciseCard({
  exercise,
  currentDay,
  meta,
  showPhase = true,
  index,
}: {
  exercise: Exercise;
  currentDay: number;
  /** Quiet line under the name; defaults to the exercise subtitle. */
  meta?: string;
  showPhase?: boolean;
  /** Position in a session, shown before the name for screen readers. */
  index?: number;
}) {
  const titleId = `card-${exercise.id}-title`;
  const line = meta ?? exercise.subtitle;
  return (
    <article className="mob-card" aria-labelledby={titleId}>
      <div className="mob-card__img">
        <img src={imageFor(exercise)} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="mob-card__body">
        <ExerciseTags exercise={exercise} currentDay={currentDay} showPhase={showPhase} />
        <h3 className="mob-card__title" id={titleId}>
          <Link to={`/app/library/${exercise.id}`} className="mob-card__link">
            {index ? <span className="sr-only">{index}. </span> : null}
            {exercise.name}
          </Link>
        </h3>
        {line ? <p className="mob-card__meta">{line}</p> : null}
      </div>
    </article>
  );
}
