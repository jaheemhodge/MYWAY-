import { useId, useMemo, useState } from "react";
import { EventCard } from "../components/EventCard";
import { Icon } from "../components/Icon";
import { ScrollRow } from "../components/ScrollRow";
import {
  CATEGORY_LABEL,
  DATE_FILTERS,
  EVENTS,
  matchesDate,
  sortBySoonest,
  type DateFilter,
  type EventCategory,
  type LocalEvent,
} from "../data/events";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { useCity } from "../LocationState";

const ROWS: { title: string; pick: (events: LocalEvent[]) => LocalEvent[] }[] = [
  { title: "This week", pick: (e) => e.filter((x) => x.dayOffset <= 7) },
  { title: "Walking & running clubs", pick: (e) => e.filter((x) => x.category === "walking") },
  { title: "Pétanque, tai chi & more", pick: (e) => e.filter((x) => x.category === "gentle") },
  { title: "Social clubs", pick: (e) => e.filter((x) => x.category === "social") },
];

const CATEGORIES: EventCategory[] = ["walking", "gentle", "social"];

export function Events() {
  usePageTitle("Events");
  const { currentDay } = useDay();
  const { city } = useCity();
  const [date, setDate] = useState<DateFilter>("any");
  const [cats, setCats] = useState<EventCategory[]>([]);

  const all = useMemo(() => sortBySoonest(EVENTS), []);
  const filtered = all.filter((e) => matchesDate(e, date, currentDay) && (!cats.length || cats.includes(e.category)));
  const filtering = date !== "any" || cats.length > 0;

  return (
    <div className="mob-wrap mob-page mob-events">
      <header className="mob-events__head">
        <h1 className="mob-title">Things to do near you</h1>
        <LocationPill />
      </header>

      <p className="mob-banner">Example listings — real local events coming soon.</p>

      <div className="mob-toolbar__chips mob-events__chips" role="group" aria-label="When">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="mob-chip mob-chip--plain"
            aria-pressed={date === f.id}
            onClick={() => setDate(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="mob-chips__sep" aria-hidden="true" />
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className="mob-chip mob-chip--plain"
            aria-pressed={cats.includes(c)}
            onClick={() => setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      {filtering ? (
        <section className="mob-section" aria-labelledby="ev-results">
          <div className="mob-results__head">
            <h2 id="ev-results" className="mob-section-title">
              {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </h2>
            <button
              type="button"
              className="mob-btn mob-btn--text"
              onClick={() => {
                setDate("any");
                setCats([]);
              }}
            >
              Clear
            </button>
          </div>
          <p className="sr-only" role="status">
            {filtered.length} events shown
          </p>
          {filtered.length ? (
            <ul className="mob-grid">
              {filtered.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} currentDay={currentDay} city={city} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mob-muted mob-empty-line">Nothing on those days yet. Try “Any day”.</p>
          )}
        </section>
      ) : (
        <div className="mob-rows">
          {ROWS.map((row) => (
            <ScrollRow
              key={row.title}
              title={row.title}
              label={row.title}
              items={row.pick(all)}
              getKey={(e) => e.id}
              renderItem={(e) => <EventCard event={e} currentDay={currentDay} city={city} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Shows the user's city. Location is only used after the user asks for it; if it is refused or
 * unavailable, they type their city instead. Nothing is guessed.
 */
function LocationPill() {
  const { city, setCity, located, setLocated } = useCity();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(city ?? "");
  const [message, setMessage] = useState("");
  const fieldId = useId();
  const panelId = useId();

  const label = city ?? (located ? "Near your location" : "Set your city");

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setMessage("Location isn't available here. Type your city instead.");
      return;
    }
    setMessage("Asking your browser for permission…");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocated(true);
        // TODO(location): turn coordinates into a city name once a lookup service is chosen.
        setMessage("Location on. Type your city name too if you want it shown.");
      },
      () => setMessage("Location was not shared. Type your city instead."),
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <div className="mob-loc">
      <button type="button" className="mob-pill mob-loc__pill" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <Icon name="pin" />
        {label}
      </button>
      {open ? (
        <div id={panelId} className="mob-loc__panel">
          <button type="button" className="mob-pill" onClick={useMyLocation}>
            <Icon name="pin" />
            Use my location
          </button>
          <form
            className="mob-loc__form"
            onSubmit={(e) => {
              e.preventDefault();
              const v = draft.trim();
              setCity(v || null);
              setOpen(false);
              setMessage("");
            }}
          >
            <label htmlFor={fieldId} className="mob-search__label">
              Or type your city
            </label>
            <div className="mob-loc__row">
              <input
                id={fieldId}
                className="mob-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="For example: Lyon"
                autoComplete="address-level2"
              />
              <button type="submit" className="mob-btn mob-btn--primary">
                Save
              </button>
            </div>
          </form>
          {message ? (
            <p className="mob-muted" role="status">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
