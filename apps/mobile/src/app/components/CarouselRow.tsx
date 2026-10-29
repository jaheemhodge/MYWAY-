import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCardsPerPage, useMediaQuery } from "../hooks";
import { Icon } from "./Icon";

/**
 * Paged picture row: a fixed number of cards per page, Previous / Next top-right, and a
 * See all link. Nothing scrolls sideways, so it works with a keyboard, at 200% zoom and at 360px.
 * With stackOnPhone, phones get every card in one vertical stack and no paging.
 */
export function CarouselRow<T>({
  title,
  description,
  items,
  renderItem,
  getKey,
  seeAll,
  stackOnPhone = false,
}: {
  title: string;
  description?: string;
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T) => string;
  seeAll: { to: string; label: string } | { label: string; expandedLabel: string };
  stackOnPhone?: boolean;
}) {
  const phone = useMediaQuery("(max-width: 37.49em)");
  const basePerPage = useCardsPerPage();
  const [expanded, setExpanded] = useState(false);
  const stacked = stackOnPhone && phone;
  const showAll = expanded || stacked;
  const perPage = showAll ? Math.max(1, items.length) : basePerPage;
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const [page, setPage] = useState(0);
  const headingId = useId();
  const statusId = useId();
  const trackId = useId();

  useEffect(() => {
    setPage((current) => Math.min(current, pages - 1));
  }, [pages]);

  const start = showAll ? 0 : page * perPage;
  const visible = items.slice(start, start + perPage);
  const paged = !showAll && pages > 1;

  return (
    <section className="mob-row" aria-labelledby={headingId}>
      <div className="mob-row__head">
        <div className="mob-row__titles">
          <h2 id={headingId} className="mob-section-title">
            {title}
          </h2>
          {description ? <p className="mob-row__desc">{description}</p> : null}
        </div>
        <div className="mob-row__controls">
          {"to" in seeAll ? (
            <Link to={seeAll.to} className="mob-textlink">
              {seeAll.label}
              <span className="sr-only">: {title}</span>
            </Link>
          ) : stacked || items.length <= basePerPage ? null : (
            <button
              type="button"
              className="mob-textlink"
              aria-expanded={expanded}
              aria-controls={trackId}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? seeAll.expandedLabel : seeAll.label}
            </button>
          )}
          {paged ? (
            <div className="mob-row__nav">
              <button
                type="button"
                className="mob-round"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-disabled={page === 0}
                aria-controls={trackId}
              >
                <Icon name="chevronLeft" />
                <span className="mob-round__label">Previous</span>
              </button>
              <button
                type="button"
                className="mob-round"
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                aria-disabled={page >= pages - 1}
                aria-controls={trackId}
              >
                <span className="mob-round__label">Next</span>
                <Icon name="chevronRight" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ul
        id={trackId}
        className={`mob-row__track${showAll ? " is-all" : ""}`}
        data-per-page={showAll ? undefined : perPage}
        aria-describedby={paged ? statusId : undefined}
      >
        {visible.map((item, i) => (
          <li key={getKey(item)}>{renderItem(item, start + i)}</li>
        ))}
      </ul>
      {paged ? (
        <p id={statusId} className="sr-only" aria-live="polite">
          Showing {start + 1} to {start + visible.length} of {items.length}
        </p>
      ) : null}
    </section>
  );
}
