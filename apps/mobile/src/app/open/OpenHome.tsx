import { Link } from "react-router-dom";
import { POSITION_LABEL } from "../data/library";
import { PHASE_INFO, getSession, phaseForDay, sessionMinutes, type PhaseInfo } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { AREA_SLUGS, collection, COLLECTION_LINE, COLLECTION_TITLE, minutesFor } from "./data";
import { OHero } from "./Hero";
import { OCard, ORow } from "./parts";

const BASE = import.meta.env.BASE_URL;
const PHASE_IMAGES: Record<number, string> = {
  1: `${BASE}exercises/heel-raises.jpg`,
  2: `${BASE}exercises/wall-calf-stretch.jpg`,
  3: `${BASE}exercises/clamshell.jpg`,
};

export function OpenHome() {
  usePageTitle("Today");
  const { currentDay } = useDay();
  const session = getSession(currentDay);
  const first = session[0];

  return (
    <div className="o-page">
      <OHero
        exercise={first}
        kicker={`Today · Day ${currentDay}`}
        title={`Knees, session ${currentDay}`}
        meta={`${session.length} exercises · ${sessionMinutes(session.length)} min`}
        line={`Starts with ${first.name.toLowerCase()}. Go slowly and rest whenever you need to.`}
        startTo="/app/session"
      />

      <div className="o-rows">
        <ORow
          title="Today's session"
          line="Your five for today, in the order you'll do them."
          seeAll="/app/library/today"
          items={session}
          getKey={(e) => e.id}
          renderItem={(e, i) => (
            <OCard exercise={e} currentDay={currentDay} meta={`${i + 1} · ${POSITION_LABEL[e.position]} · ${minutesFor(e)} min`} />
          )}
        />
        {AREA_SLUGS.map((slug) => (
          <ORow
            key={slug}
            title={COLLECTION_TITLE[slug]}
            line={COLLECTION_LINE[slug]}
            seeAll={`/app/library/${slug}`}
            items={collection(slug, currentDay)}
            getKey={(e) => e.id}
            renderItem={(e) => <OCard exercise={e} currentDay={currentDay} />}
          />
        ))}
        <ORow
          title={COLLECTION_TITLE.chair}
          line={COLLECTION_LINE.chair}
          seeAll="/app/library/chair"
          items={collection("chair", currentDay)}
          getKey={(e) => e.id}
          renderItem={(e) => <OCard exercise={e} currentDay={currentDay} />}
        />
        <ORow
          title="Your plan"
          line="Three 20-day phases, each a little steadier than the last."
          seeAll="/app/plan"
          wide
          items={[PHASE_INFO[1], PHASE_INFO[2], PHASE_INFO[3]]}
          getKey={(p) => String(p.number)}
          renderItem={(p) => <PlanCard phase={p} currentDay={currentDay} />}
        />
      </div>
    </div>
  );
}

function PlanCard({ phase, currentDay }: { phase: PhaseInfo; currentDay: number }) {
  const current = phaseForDay(currentDay).number;
  const state = phase.number < current ? "done" : phase.number === current ? "current" : "next";
  const span = phase.endDay - phase.startDay + 1;
  const daysIn = Math.min(span, Math.max(0, currentDay - phase.startDay + 1));
  const titleId = `plan-${phase.number}`;
  return (
    <article className={`o-plan is-${state}`} aria-labelledby={titleId}>
      <div className="o-media o-media--wide">
        <img src={PHASE_IMAGES[phase.number]} alt="" loading="lazy" />
        {state === "next" ? <span className="o-lock">Opens Day {phase.startDay}</span> : null}
      </div>
      <h3 id={titleId} className="o-card__title">
        {state === "current" ? (
          <Link to="/app/plan" className="o-card__link">
            {phase.name}
          </Link>
        ) : (
          phase.name
        )}
      </h3>
      <p className="o-meta">
        Phase {phase.number} · Days {phase.startDay}–{phase.endDay}
      </p>
      {state === "current" ? (
        <div className="o-progress">
          <div className="o-progress__bar" aria-hidden="true">
            <span style={{ width: `${(daysIn / span) * 100}%` }} />
          </div>
          <p className="o-meta">
            {daysIn} of {span} days
          </p>
        </div>
      ) : state === "done" ? (
        <p className="o-meta">Done</p>
      ) : null}
    </article>
  );
}
