import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import type { Exercise } from "../data/library";
import { useCardsPerPage } from "../hooks";
import { ExerciseCard } from "./ExerciseCard";
import { Icon } from "./Icon";

/**
 * Paged row: a fixed number of cards per page with visible Previous / Next buttons and a See all
 * link. Nothing scrolls sideways, so the row works with a keyboard, at 200% zoom and at 360px.
 */
export function CarouselRow({
  title,
  description,
  exercises,
  seeAllTo,
  currentDay,
}: {
  title: string;
  description?: string;
  exercises: readonly Exercise[];
  seeAllTo: string;
  currentDay: number;
}) {
  const perPage = useCardsPerPage();
  const pages = Math.max(1, Math.ceil(exercises.length / perPage));
  const [page, setPage] = useState(0);
  const headingId = useId();
  const statusId = useId();
  const trackId = useId();

  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1));
  }, [pages]);

  const visible = exercises.slice(page * perPage, page * perPage + perPage);
  const first = page * perPage + 1;
  const last = page * perPage + visible.length;

  return (
    <section className="mob-row" aria-labelledby={headingId}>
      <div className="mob-row__head">
        <div className="mob-row__titles">
          <h2 id={headingId} className="mob-row__title">
            {title}
          </h2>
          {description ? <p className="mob-row__desc">{description}</p> : null}
        </div>
        <div className="mob-row__controls">
          <Link to={seeAllTo} className="mob-textlink">
            See all {exercises.length}
            <span className="sr-only"> {title} exercises</span>
          </Link>
          <div className="mob-row__nav">
            <button
              type="button"
              className="mob-btn mob-btn--secondary mob-btn--compact"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-disabled={page === 0}
              aria-controls={trackId}
            >
              <Icon name="chevronLeft" />
              Previous
            </button>
            <button
              type="button"
              className="mob-btn mob-btn--secondary mob-btn--compact"
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              aria-disabled={page >= pages - 1}
              aria-controls={trackId}
            >
              Next
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>
      </div>

      <ul id={trackId} className="mob-row__track" data-per-page={perPage} aria-describedby={statusId}>
        {visible.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseCard exercise={exercise} currentDay={currentDay} />
          </li>
        ))}
      </ul>
      <p id={statusId} className="mob-row__status" aria-live="polite">
        Showing {first}–{last} of {exercises.length}
      </p>
    </section>
  );
}
