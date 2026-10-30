import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventThumb } from "../components/EventCard";
import { Icon } from "../components/Icon";
import { CATEGORY_LABEL, getEvent, whenLong } from "../data/events";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { useCity } from "../LocationState";

export function EventDetail() {
  const { id = "" } = useParams();
  const event = getEvent(id);
  const { currentDay } = useDay();
  const { city } = useCity();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle(event ? event.title : "Event not found");

  if (!event) {
    return (
      <div className="mob-wrap mob-page mob-stub">
        <h1 className="mob-title">We couldn't find that event</h1>
        <Link to="/app/events" className="mob-pill">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <article className="mob-wrap mob-page mob-edetail" aria-labelledby="event-title">
      <button
        type="button"
        className="mob-btn mob-btn--text mob-btn--inline mob-back"
        onClick={() => (location.key !== "default" ? navigate(-1) : navigate("/app/events"))}
      >
        <Icon name="chevronLeft" />
        Back
      </button>

      <div className="mob-edetail__grid">
        <EventThumb event={event} large />
        <div className="mob-edetail__text">
          <p className="mob-muted">
            {event.organizer} · {CATEGORY_LABEL[event.category]}
          </p>
          <h1 id="event-title" className="mob-title">
            {event.title}
          </h1>

          <dl className="mob-facts mob-facts--plain">
            <div>
              <dt>When</dt>
              <dd>{whenLong(event, currentDay)}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {event.place}
                {city ? `, ${city}` : ""}
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{event.price}</dd>
            </div>
          </dl>

          <h2 className="mob-h3">What to expect</h2>
          <p>{event.whatToExpect}</p>

          <div className="mob-edetail__cta">
            <button type="button" className="mob-cta" aria-disabled="true" aria-describedby="details-note">
              Get details
            </button>
            <p id="details-note" className="mob-muted">
              Sample listing. Real event details are coming soon.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
