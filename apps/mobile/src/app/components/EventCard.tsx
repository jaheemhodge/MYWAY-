import { Link } from "react-router-dom";
import { whenShort, type LocalEvent } from "../data/events";

/** Picture tile for an event: its photo when one exists, otherwise a soft tint with a word. */
export function EventThumb({ event, large = false }: { event: LocalEvent; large?: boolean }) {
  return (
    <div className={`mob-thumb mob-ethumb is-${event.category}${large ? " is-large" : ""}`}>
      {event.image ? (
        <img src={event.image} alt="" loading="lazy" decoding="async" className="is-loaded" />
      ) : (
        <span className="mob-thumb__word" aria-hidden="true">
          {event.tileWord}
        </span>
      )}
      <span className="mob-sample">Sample</span>
    </div>
  );
}

/** Event card: picture, organizer, title, when and price, place. The whole card is one link. */
export function EventCard({ event, currentDay, city }: { event: LocalEvent; currentDay: number; city: string | null }) {
  const titleId = `event-${event.id}-title`;
  return (
    <article className="mob-card mob-ecard" aria-labelledby={titleId}>
      <EventThumb event={event} />
      <div className="mob-card__body">
        <p className="mob-card__eyebrow">{event.organizer}</p>
        <h3 className="mob-card__title" id={titleId}>
          <Link to={`/app/events/${event.id}`} className="mob-card__link">
            {event.title}
          </Link>
        </h3>
        <p className="mob-ecard__when">
          {whenShort(event, currentDay)} · {event.price}
        </p>
        <p className="mob-card__eyebrow">
          {event.place}
          {city ? `, ${city}` : ""}
        </p>
      </div>
    </article>
  );
}
