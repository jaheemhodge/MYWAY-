import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon";

/**
 * One horizontal row of equal-width cards with scroll-snap. Round Previous / Next buttons sit at
 * the right of the heading and move one card at a time, so the row never relies on swiping alone.
 */
export function ScrollRow<T>({
  title,
  description,
  seeAll,
  items,
  getKey,
  renderItem,
  label,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Optional link to the full list, shown beside the arrows. */
  seeAll?: { to: string; label: string };
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
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
    if (!el) return;
    const card = el.querySelector("li");
    const gap = parseFloat(getComputedStyle(el).columnGap || "20") || 20;
    const by = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * by, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="mob-srow" aria-labelledby={headingId}>
      <div className="mob-srow__head">
        <div className="mob-srow__titles">
          <h2 id={headingId} className="mob-section-title">
            {title}
          </h2>
          {description ? <p className="mob-muted">{description}</p> : null}
        </div>
        <div className="mob-srow__nav">
          {seeAll ? (
            <Link to={seeAll.to} className="mob-textlink">
              {seeAll.label}
              <span className="sr-only">: {label}</span>
            </Link>
          ) : null}
          <button
            type="button"
            className="mob-round mob-round--icon"
            aria-controls={trackId}
            aria-disabled={atStart}
            onClick={() => !atStart && step(-1)}
          >
            <Icon name="chevronLeft" />
            <span className="sr-only">Previous: {label}</span>
          </button>
          <button
            type="button"
            className="mob-round mob-round--icon"
            aria-controls={trackId}
            aria-disabled={atEnd}
            onClick={() => !atEnd && step(1)}
          >
            <Icon name="chevronRight" />
            <span className="sr-only">Next: {label}</span>
          </button>
        </div>
      </div>
      <ol id={trackId} ref={trackRef} className="mob-srow__track" aria-label={label} onScroll={update}>
        {items.map((item, i) => (
          <li key={getKey(item)}>{renderItem(item, i)}</li>
        ))}
      </ol>
    </section>
  );
}
