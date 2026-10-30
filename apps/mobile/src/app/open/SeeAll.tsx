import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { getExercise } from "../data/library";
import { sessionMinutes } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { applyOpen, collection, COLLECTION_LINE, COLLECTION_TITLE, isSlug, minutesFor, openActiveCount, openFiltersFromParams } from "./data";
import { OHero } from "./Hero";
import { OCard } from "./parts";
import { POSITION_LABEL } from "../data/library";

/** /app/library/:slug — one-item hero, then a grid of squares. Filters and search come from the URL. */
export function SeeAll() {
  const { slug = "all" } = useParams();
  const [params] = useSearchParams();
  const { currentDay } = useDay();
  const exerciseFromOldLink = getExercise(slug.toUpperCase());
  const valid = isSlug(slug);
  usePageTitle(valid ? COLLECTION_TITLE[slug] : "Library");

  // Old /app/library/K01 links now open the exercise panel.
  if (!valid && exerciseFromOldLink) return <Navigate to={`/app/exercise/${exerciseFromOldLink.id}`} replace />;
  if (!valid) return <Navigate to="/app/library/all" replace />;

  const filters = openFiltersFromParams(params);
  const q = params.get("q") ?? "";
  const base = collection(slug, currentDay);
  const items = applyOpen(base, filters, q);
  const filtering = openActiveCount(filters) > 0 || q.trim().length > 0;
  const lead = items[0] ?? base[0];

  return (
    <div className="o-page">
      {lead ? (
        <OHero
          exercise={lead}
          kicker={COLLECTION_TITLE[slug]}
          title={lead.name}
          meta={`${POSITION_LABEL[lead.position]} · ${minutesFor(lead)} min · Phase ${lead.phase}`}
          line={lead.subtitle ? `${lead.subtitle[0].toUpperCase()}${lead.subtitle.slice(1)}.` : COLLECTION_LINE[slug]}
          startTo={slug === "today" ? "/app/session" : `/app/session/${lead.id}`}
          startLabel={slug === "today" ? "Start session" : "Start"}
        />
      ) : null}

      <section className="o-wrap o-grid-section" aria-labelledby="o-grid-title">
        <div className="o-row__head">
          <div className="o-row__titles">
            <h2 id="o-grid-title" className="o-row__title">
              {COLLECTION_TITLE[slug]}
            </h2>
            <p className="o-row__line" role="status">
              {items.length} {items.length === 1 ? "exercise" : "exercises"}
              {slug === "today" ? ` · ${sessionMinutes(items.length)} min` : ""}
              {q.trim() ? ` matching “${q.trim()}”` : ""}
              {filtering ? " with your filters" : ""}
            </p>
          </div>
          {filtering ? (
            <Link to={`/app/library/${slug}`} className="o-pill o-pill--outline">
              Clear filters
            </Link>
          ) : null}
        </div>
        {items.length ? (
          <ul className="o-grid">
            {items.map((e, i) => (
              <li key={e.id}>
                <OCard
                  exercise={e}
                  currentDay={currentDay}
                  meta={slug === "today" ? `${i + 1} · ${POSITION_LABEL[e.position]} · ${minutesFor(e)} min` : undefined}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="o-empty">Nothing matches. Try fewer filters, or a simpler word like “chair”.</p>
        )}
      </section>
    </div>
  );
}
