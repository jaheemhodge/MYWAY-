import { useId, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { imageFor } from "../data/images";
import { AREA_LABEL, displayName, type Area, type Exercise } from "../data/library";
import { opensOnDay } from "../data/plan";
import { minutesFor, toneFor, useSaved, type TileShape } from "./data";

type Ratio = TileShape | "portrait";

/**
 * The exercise's own photo, cropped to the tile shape. Exercises without a photo get a soft solid
 * tone from the palette: never another exercise's photo, never text over the tile.
 */
export function OMedia({ exercise, children, ratio = "square" }: { exercise: Exercise; children?: ReactNode; ratio?: Ratio }) {
  const src = imageFor(exercise);
  return (
    <div className={`o-media o-media--${ratio}`} style={src ? undefined : { backgroundColor: toneFor(exercise.id) }}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
      {children}
    </div>
  );
}

export function Heart({ id, name }: { id: string; name: string }) {
  const { isSaved, toggle } = useSaved();
  const on = isSaved(id);
  return (
    <button type="button" className="o-heart" aria-pressed={on} onClick={() => toggle(id)}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">Save {name}</span>
    </button>
  );
}

/** Link to the exercise overlay, keeping the current page behind it. */
export function useOverlayLink() {
  const location = useLocation();
  // From inside the panel, keep the original page behind it.
  const background = (location.state as { background?: unknown } | null)?.background ?? location;
  return (id: string) => ({ to: `/app/exercise/${id}`, state: { background } });
}

/**
 * Open's library tile: picture, then title + heart on one line, source line, duration.
 * The source line is the focus area (there are no instructors). Locked exercises add "Opens Day N".
 */
export function OCard({ exercise, currentDay, shape = "square", area }: { exercise: Exercise; currentDay: number; shape?: TileShape; area?: Area }) {
  const link = useOverlayLink()(exercise.id);
  const opens = opensOnDay(exercise.phase, currentDay);
  const titleId = `o-${exercise.id}-${useId().replace(/:/g, "")}`;
  return (
    <article className="o-card" aria-labelledby={titleId}>
      <OMedia exercise={exercise} ratio={shape} />
      <div className="o-card__row">
        <h3 className="o-card__title" id={titleId}>
          <Link {...link} className="o-card__link">
            {displayName(exercise)}
          </Link>
        </h3>
        <Heart id={exercise.id} name={exercise.name} />
      </div>
      <p className="o-card__meta">{AREA_LABEL[area ?? exercise.primaryArea]}</p>
      <p className="o-card__meta">
        {minutesFor(exercise)} min{opens ? ` · Opens Day ${opens}` : ""}
      </p>
    </article>
  );
}

/** Row head shared by Home rows and the See all page: big title, SEE ALL pill, one line under it. */
export function OHead({ id, title, line, seeAll, as: Tag = "h2" }: { id: string; title: string; line: string; seeAll?: string; as?: "h1" | "h2" }) {
  return (
    <div className="o-wrap o-head">
      <Tag id={id} className="o-head__title">
        {title}
      </Tag>
      {seeAll ? (
        <Link to={seeAll} className="o-pill o-pill--outline o-caps o-head__all">
          See all
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span className="sr-only">: {title}</span>
        </Link>
      ) : null}
      <p className="o-head__line">{line}</p>
    </div>
  );
}

/** Horizontal row: the track lines up with the page padding and bleeds off the right edge. */
export function ORow({
  title,
  line,
  seeAll,
  items,
  currentDay,
  shape,
  area,
}: {
  title: string;
  line: string;
  seeAll?: string;
  items: readonly Exercise[];
  currentDay: number;
  shape: TileShape;
  /** Focus area of the row, used as every tile's source line. */
  area?: Area;
}) {
  const headingId = useId();
  return (
    <section className="o-row" aria-labelledby={headingId}>
      <OHead id={headingId} title={title} line={line} seeAll={seeAll} />
      <ol className={`o-track o-track--${shape}`} aria-label={title}>
        {items.map((e) => (
          <li key={e.id}>
            <OCard exercise={e} currentDay={currentDay} shape={shape} area={area} />
          </li>
        ))}
      </ol>
    </section>
  );
}
