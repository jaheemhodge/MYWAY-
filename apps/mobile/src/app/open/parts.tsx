import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../components/Icon";
import { imageFor, PLACEHOLDER_WORD } from "../data/images";
import { displayName, POSITION_LABEL, type Exercise } from "../data/library";
import { opensOnDay } from "../data/plan";
import { minutesFor, useSaved } from "./data";

/** Square (or given ratio) picture with sharp 4px corners; a quiet word tile when there is no still. */
export function OMedia({ exercise, children, ratio = "square" }: { exercise: Exercise; children?: ReactNode; ratio?: "square" | "portrait" }) {
  const src = imageFor(exercise);
  return (
    <div className={`o-media o-media--${ratio}${src ? "" : " is-tile"}`}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="o-media__word">{PLACEHOLDER_WORD[exercise.position]}</span>}
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

export function OCard({ exercise, currentDay, meta }: { exercise: Exercise; currentDay: number; meta?: string }) {
  const link = useOverlayLink()(exercise.id);
  const opens = opensOnDay(exercise.phase, currentDay);
  const titleId = `o-${exercise.id}-${useId().replace(/:/g, "")}`;
  return (
    <article className="o-card" aria-labelledby={titleId}>
      <OMedia exercise={exercise}>{opens ? <span className="o-lock">Opens Day {opens}</span> : null}</OMedia>
      <div className="o-card__row">
        <div className="o-card__text">
          <h3 className="o-card__title" id={titleId}>
            <Link {...link} className="o-card__link">
              {displayName(exercise)}
            </Link>
          </h3>
          <p className="o-meta">{meta ?? `${POSITION_LABEL[exercise.position]} · ${minutesFor(exercise)} min`}</p>
        </div>
        <Heart id={exercise.id} name={exercise.name} />
      </div>
    </article>
  );
}

/** Horizontal row: heading, one grey line, See all pill and arrows; the track bleeds off the right edge. */
export function ORow<T>({
  title,
  line,
  seeAll,
  items,
  getKey,
  renderItem,
  wide = false,
}: {
  title: string;
  line: string;
  seeAll?: string;
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, i: number) => ReactNode;
  wide?: boolean;
}) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const headingId = useId();
  const trackId = useId();

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16) * 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="o-row" aria-labelledby={headingId}>
      <div className="o-wrap o-row__head">
        <div className="o-row__titles">
          <h2 id={headingId} className="o-row__title">
            {title}
          </h2>
          <p className="o-row__line">{line}</p>
        </div>
        <div className="o-row__controls">
          <div className="o-row__arrows">
            <button type="button" className="o-pill o-pill--outline o-pill--icon" aria-controls={trackId} aria-disabled={atStart} onClick={() => !atStart && step(-1)}>
              <Icon name="chevronLeft" />
              <span className="sr-only">Scroll back: {title}</span>
            </button>
            <button type="button" className="o-pill o-pill--outline o-pill--icon" aria-controls={trackId} aria-disabled={atEnd} onClick={() => !atEnd && step(1)}>
              <Icon name="chevronRight" />
              <span className="sr-only">Scroll on: {title}</span>
            </button>
          </div>
          {seeAll ? (
            <Link to={seeAll} className="o-pill o-pill--outline o-caps">
              See all →<span className="sr-only">: {title}</span>
            </Link>
          ) : null}
        </div>
      </div>
      <ol id={trackId} ref={trackRef} className={`o-track${wide ? " o-track--wide" : ""}`} aria-label={title} onScroll={update}>
        {items.map((item, i) => (
          <li key={getKey(item)}>{renderItem(item, i)}</li>
        ))}
      </ol>
    </section>
  );
}
