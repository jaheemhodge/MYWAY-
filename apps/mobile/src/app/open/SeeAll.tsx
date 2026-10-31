import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { getExercise } from "../data/library";
import { phaseForDay } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { applyOpen, collection, COLLECTION_LINE, COLLECTION_SHAPE, COLLECTION_TITLE, isSlug, openActiveCount, openFiltersFromParams } from "./data";
import { OCard, OHead } from "./parts";

/** /app/library/:slug — Open's See all: the row head, then every tile in a grid. Filters and search come from the URL. */
export function SeeAll() {
  const { slug = "all" } = useParams();
  const [params] = useSearchParams();
  const { currentDay } = useDay();
  const exerciseFromOldLink = getExercise(slug.toUpperCase());
  const valid = isSlug(slug);
  usePageTitle(valid ? (slug === "today" ? "Today" : COLLECTION_TITLE[slug]) : "Library");

  // Old /app/library/K01 links now open the exercise panel.
  if (!valid && exerciseFromOldLink) return <Navigate to={`/app/exercise/${exerciseFromOldLink.id}`} replace />;
  if (!valid) return <Navigate to="/app/library/all" replace />;

  const filters = openFiltersFromParams(params);
  const q = params.get("q") ?? "";
  const items = applyOpen(collection(slug, currentDay), filters, q);
  const filtering = openActiveCount(filters) > 0 || q.trim().length > 0;
  const shape = COLLECTION_SHAPE[slug];
  const title = slug === "today" ? "Today" : COLLECTION_TITLE[slug];
  const line = slug === "today" ? `Day ${currentDay} · ${phaseForDay(currentDay).name}` : COLLECTION_LINE[slug];

  return (
    <section className="o-page" aria-labelledby="o-grid-title">
      <OHead id="o-grid-title" as="h1" title={title} line={line} />
      {filtering ? (
        <div className="o-wrap o-results">
          <p role="status">
            {items.length} {items.length === 1 ? "exercise" : "exercises"}
            {q.trim() ? ` matching “${q.trim()}”` : ""}
            {openActiveCount(filters) ? " with your filters" : ""}
          </p>
          <Link to={`/app/library/${slug}`} className="o-pill o-pill--outline o-caps">
            Clear
          </Link>
        </div>
      ) : null}
      {items.length ? (
        <ul className={`o-wrap o-grid o-grid--${shape}`}>
          {items.map((e) => (
            <li key={e.id}>
              <OCard exercise={e} currentDay={currentDay} shape={shape} area={slug === "knees" || slug === "lower-back" || slug === "hips-balance" ? slug : undefined} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="o-wrap o-empty">Nothing matches. Try fewer filters, or a simpler word like “chair”.</p>
      )}
    </section>
  );
}
