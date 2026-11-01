import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FillUpButton } from "@/components/ui/fill-up-button";
import { FlowIconButton } from "@/components/ui/flow-button";
import { Stories } from "@/components/ui/stories-carousel";
import { EventCard } from "../components/EventCard";
import { Icon } from "../components/Icon";
import { OHead } from "../open/parts";
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
import "./events.css";

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
    <div className="o-page ev-page">
      <div className="o-wrap o-head ev-head">
        <h1 className="o-head__title">Things to do near you</h1>
        <div className="o-head__controls">
          <LocationPill />
        </div>
        <p className="o-head__line">Example listings — real local events coming soon.</p>
      </div>

      <div className="o-wrap">
        <div className="o-cats ev-chips" role="group" aria-label="When">
          {DATE_FILTERS.map((f) => (
            <FillUpButton key={f.id} className="o-cat" pressed={date === f.id} onClick={() => setDate(f.id)}>
              {f.label}
            </FillUpButton>
          ))}
          <span className="ev-chips__sep" aria-hidden="true" />
          {CATEGORIES.map((c) => (
            <FillUpButton
              key={c}
              className="o-cat"
              pressed={cats.includes(c)}
              onClick={() => setCats((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}
            >
              {CATEGORY_LABEL[c]}
            </FillUpButton>
          ))}
        </div>
      </div>

      {filtering ? (
        <section className="ev-results" aria-labelledby="ev-results">
          <div className="o-wrap o-head">
            <h2 id="ev-results" className="o-head__title">
              {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </h2>
            <div className="o-head__controls">
              <FillUpButton
                className="o-cat"
                onClick={() => {
                  setDate("any");
                  setCats([]);
                }}
              >
                Clear
              </FillUpButton>
            </div>
          </div>
          <p className="sr-only" role="status">
            {filtered.length} events shown
          </p>
          {filtered.length ? (
            <ul className="o-wrap o-grid">
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} currentDay={currentDay} city={city} />
              ))}
            </ul>
          ) : (
            <p className="o-wrap o-meta">Nothing on those days yet. Try “Any day”.</p>
          )}
        </section>
      ) : (
        <div className="o-rows ev-rows">
          {ROWS.map((row) => (
            <EventRow key={row.title} title={row.title} items={row.pick(all)} currentDay={currentDay} city={city} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One sideways row of event cards with Home's flow arrows beside the heading. */
function EventRow({
  title,
  items,
  currentDay,
  city,
}: {
  title: string;
  items: LocalEvent[];
  currentDay: number;
  city: string | null;
}) {
  const headingId = useId();
  const trackRef = useRef<HTMLOListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    const tile = el?.querySelector("li");
    if (!el || !tile) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (tile.getBoundingClientRect().width + 16), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="o-row" aria-labelledby={headingId}>
      <OHead
        id={headingId}
        title={title}
        controls={
          <span className="o-row__arrows">
            <FlowIconButton direction="left" aria-label={`Previous: ${title}`} aria-disabled={atStart} onClick={() => !atStart && step(-1)} />
            <FlowIconButton aria-label={`Next: ${title}`} aria-disabled={atEnd} onClick={() => !atEnd && step(1)} />
          </span>
        }
      />
      <Stories ref={trackRef} label={title} onScroll={update}>
        {items.map((e) => (
          <EventCard key={e.id} event={e} currentDay={currentDay} city={city} />
        ))}
      </Stories>
    </section>
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
      <FillUpButton className="o-cat ev-loc__pill" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <Icon name="pin" />
        {label}
      </FillUpButton>
      {open ? (
        <div id={panelId} className="mob-loc__panel">
          <FillUpButton className="o-cat ev-loc__use" onClick={useMyLocation}>
            <Icon name="pin" />
            Use my location
          </FillUpButton>
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
