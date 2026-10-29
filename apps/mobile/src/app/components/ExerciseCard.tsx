import { Link } from "react-router-dom";
import type { Exercise } from "../data/library";
import { ExerciseTags } from "./Tags";
import { VideoSlot } from "./VideoSlot";

/**
 * Library card: 4:3 video thumbnail, tags, name, subtitle. Text never sits on the image.
 * The whole card is one link; its accessible name is the exercise name.
 */
export function ExerciseCard({
  exercise,
  currentDay,
  headingLevel = 3,
}: {
  exercise: Exercise;
  currentDay: number;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const titleId = `card-${exercise.id}-title`;
  return (
    <article className="mob-card" aria-labelledby={titleId}>
      <VideoSlot label={exercise.name} size="thumb" />
      <div className="mob-card__body">
        <ExerciseTags exercise={exercise} currentDay={currentDay} />
        <Heading className="mob-card__title" id={titleId}>
          <Link to={`/app/library/${exercise.id}`} className="mob-card__link">
            {exercise.name}
          </Link>
        </Heading>
        {exercise.subtitle ? <p className="mob-card__subtitle">{exercise.subtitle}</p> : null}
      </div>
    </article>
  );
}
