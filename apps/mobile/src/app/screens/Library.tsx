import { useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CarouselRow } from "../components/CarouselRow";
import { ExerciseCard } from "../components/ExerciseCard";
import { FilterDialog } from "../components/FilterDialog";
import { Icon } from "../components/Icon";
import {
  activeCount,
  applyFilters,
  BALANCE_IDS,
  filtersFromParams,
  paramsFromFilters,
  toggleValue,
  type Filters,
} from "../data/filters";
import {
  AREA_LABEL,
  EXERCISES,
  POSITIONS,
  POSITION_LABEL,
  requireExercise,
  type Exercise,
} from "../data/library";
import { FOCUS_AREA, PHASE_INFO } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";

const byPhase = (a: Exercise, b: Exercise) => a.phase - b.phase;

const ROWS = {
  focus: () => EXERCISES.filter((e) => e.areas.includes(FOCUS_AREA)).sort(byPhase),
  chair: () => EXERCISES.filter((e) => e.position === "chair").sort(byPhase),
  balance: () => BALANCE_IDS.map(requireExercise),
};

export function Library() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentDay } = useDay();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const query = params.get("q") ?? "";
  const collection = params.get("collection") === "balance" ? "balance" : null;
  const [dialogOpen, setDialogOpen] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const searchId = useId();

  const count = activeCount(filters);
  const browsing = count === 0 && !query.trim() && !collection;
  usePageTitle(browsing ? "Library" : "Library results");

  const source = collection ? ROWS.balance() : EXERCISES;
  const results = useMemo(() => applyFilters(filters, query, source), [filters, query, source]);

  function setFilters(next: Filters) {
    setParams(paramsFromFilters(next, params), { replace: false });
  }

  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  }

  function closeDialog() {
    setDialogOpen(false);
    requestAnimationFrame(() => filtersButton.current?.focus());
  }

  return (
    <div className="mob-wrap mob-page mob-library">
      <header className="mob-pagehead">
        <h1 className="mob-display">Library</h1>
        <p className="mob-lede">
          All {EXERCISES.length} exercises. Your plan picks from these each day; here you can look at any of them.
        </p>
      </header>

      <div className="mob-toolbar">
        <form
          className="mob-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label htmlFor={searchId} className="mob-search__label">
            Search exercises
          </label>
          <div className="mob-search__field">
            <Icon name="search" />
            <input
              id={searchId}
              type="search"
              className="mob-input"
              value={query}
              placeholder="For example: chair, calf, bridge"
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </div>
        </form>

        <div className="mob-toolbar__chips" role="group" aria-label="How do you want to move">
          {POSITIONS.map((position) => (
            <button
              key={position}
              type="button"
              className="mob-chip"
              aria-pressed={filters.position.includes(position)}
              onClick={() => setFilters(toggleValue(filters, "position", position))}
            >
              <span className="mob-chip__check" aria-hidden="true">
                {filters.position.includes(position) ? <Icon name="check" size={20} /> : null}
              </span>
              {POSITION_LABEL[position]}
            </button>
          ))}
          <button
            ref={filtersButton}
            type="button"
            className="mob-btn mob-btn--secondary mob-filters-btn"
            aria-haspopup="dialog"
            onClick={() => setDialogOpen(true)}
          >
            <Icon name="filters" />
            Filters
            {count > 0 ? (
              <span className="mob-count">
                {count}
                <span className="sr-only"> on</span>
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {browsing ? (
        <div className="mob-rows">
          <CarouselRow
            title={`For your ${AREA_LABEL[FOCUS_AREA].toLowerCase()}`}
            description="Your focus area, in phase order."
            exercises={ROWS.focus()}
            seeAllTo={`/app/library?area=${FOCUS_AREA}`}
            currentDay={currentDay}
          />
          <CarouselRow
            title="Sit down and do these"
            description="Everything you can do from a sturdy chair."
            exercises={ROWS.chair()}
            seeAllTo="/app/library?position=chair"
            currentDay={currentDay}
          />
          <CarouselRow
            title="Balance practice"
            description="Standing drills. Keep a counter or chair within reach."
            exercises={ROWS.balance()}
            seeAllTo="/app/library?collection=balance"
            currentDay={currentDay}
          />
        </div>
      ) : (
        <Results
          results={results}
          filters={filters}
          query={query}
          collection={collection}
          currentDay={currentDay}
          onRemove={(next) => setFilters(next)}
          onClearAll={() => navigate("/app/library")}
          onEdit={() => setDialogOpen(true)}
        />
      )}

      <FilterDialog
        open={dialogOpen}
        initial={filters}
        query={query}
        onClose={closeDialog}
        onApply={(next) => {
          setFilters(next);
          closeDialog();
        }}
      />
    </div>
  );
}

function Results({
  results,
  filters,
  query,
  collection,
  currentDay,
  onRemove,
  onClearAll,
  onEdit,
}: {
  results: Exercise[];
  filters: Filters;
  query: string;
  collection: "balance" | null;
  currentDay: number;
  onRemove: (next: Filters) => void;
  onClearAll: () => void;
  onEdit: () => void;
}) {
  const active: { key: string; label: string; next: Filters }[] = [
    ...filters.area.map((a) => ({ key: `area-${a}`, label: AREA_LABEL[a], next: toggleValue(filters, "area", a) })),
    ...filters.position.map((p) => ({
      key: `position-${p}`,
      label: POSITION_LABEL[p],
      next: toggleValue(filters, "position", p),
    })),
    ...filters.phase.map((n) => ({
      key: `phase-${n}`,
      label: `${PHASE_INFO[n].name} · Days ${PHASE_INFO[n].startDay}–${PHASE_INFO[n].endDay}`,
      next: toggleValue(filters, "phase", n),
    })),
  ];

  const noun = results.length === 1 ? "exercise" : "exercises";
  return (
    <section className="mob-results" aria-labelledby="results-title">
      <div className="mob-results__head">
        <h2 id="results-title" className="mob-h2">
          {collection === "balance" ? `Balance practice: ${results.length} ${noun}` : `${results.length} ${noun}`}
          {query.trim() ? ` for “${query.trim()}”` : ""}
        </h2>
        <Link to="/app/library" className="mob-textlink">
          <Icon name="chevronLeft" />
          Back to all rows
        </Link>
      </div>

      <p className="sr-only" role="status">
        {results.length} {noun} shown
      </p>

      {active.length ? (
        <ul className="mob-active" aria-label="Active filters">
          {active.map((item) => (
            <li key={item.key}>
              <button type="button" className="mob-chip mob-chip--remove" onClick={() => onRemove(item.next)}>
                {item.label}
                <span className="mob-chip__x">
                  <Icon name="close" size={20} />
                  <span className="sr-only">Remove filter</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="mob-btn mob-btn--text" onClick={onClearAll}>
              Clear all
            </button>
          </li>
        </ul>
      ) : null}

      {results.length ? (
        <ul className="mob-grid">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <ExerciseCard exercise={exercise} currentDay={currentDay} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mob-empty">
          <h3 className="mob-h3">No exercises match</h3>
          <p>Try removing a filter or searching for a simpler word, like “knee” or “chair”.</p>
          <div className="mob-empty__actions">
            <button type="button" className="mob-btn mob-btn--secondary" onClick={onEdit}>
              Change filters
            </button>
            <button type="button" className="mob-btn mob-btn--text" onClick={onClearAll}>
              Clear all
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
