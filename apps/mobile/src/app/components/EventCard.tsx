import { Story } from "@/components/ui/stories-carousel";
import { EVENTS, whenShort, type LocalEvent } from "../data/events";
import { TILE_TONES } from "../open/data";
import { Heart } from "../open/parts";

/** Same flat palette tone as Home's exercise tiles, rotated by the event's place in the list. */
export function eventTone(event: LocalEvent) {
  const i = Math.max(0, EVENTS.findIndex((e) => e.id === event.id));
  return TILE_TONES[i % TILE_TONES.length];
}

/**
 * Picture for the event detail page: its photo, or the flat palette tile with the event's name
 * centred on it (as on Home). Carries the light "Sample" tag.
 */
export function EventThumb({ event, large = false }: { event: LocalEvent; large?: boolean }) {
  return (
    <div
      className={`ev-thumb${large ? " is-large" : ""}${event.image ? "" : " is-flat"}`}
      style={event.image ? undefined : { backgroundColor: eventTone(event) }}
    >
      {event.image ? (
        <img src={event.image} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="ev-thumb__flat" aria-hidden="true">
          {event.title}
        </span>
      )}
      <span className="story__badge">Sample</span>
    </div>
  );
}

/**
 * Event card, built from Home's exercise tile: 3D box picture, then title + heart on one line,
 * then organizer, when · price, and place underneath. Opens the event page.
 */
export function EventCard({
  event,
  currentDay,
  city,
  as = "li",
}: {
  event: LocalEvent;
  currentDay: number;
  city: string | null;
  as?: "li" | "div";
}) {
  return (
    <Story
      as={as}
      to={`/app/events/${event.id}`}
      title={event.title}
      meta={event.organizer}
      note={`${whenShort(event, currentDay)} · ${event.price}`}
      extra={[`${event.place}${city ? `, ${city}` : ""}`]}
      image={event.image}
      tone={eventTone(event)}
      badge="Sample"
      action={<Heart id={`event:${event.id}`} name={event.title} />}
    />
  );
}
