import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExerciseThumb } from "../components/ExerciseThumb";
import { Icon, type IconName } from "../components/Icon";
import { SessionPlayer } from "../components/SessionPlayer";
import { imageFor } from "../data/images";
import { AREA_LABEL, displayName, type Area } from "../data/library";
import {
  FOCUS_AREA,
  MINUTES_PER_EXERCISE,
  PHASE_INFO,
  TOTAL_DAYS,
  clampDay,
  getSession,
  phaseForDay,
  sessionMinutes,
  type PhaseInfo,
} from "../data/plan";
import { SAMPLE_FIRST_NAME } from "../data/profile";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";

const BASE = import.meta.env.BASE_URL;

/** Decorative photos for the three phase cards (our own exercise stills). */
const PHASE_IMAGES: Record<number, string> = {
  1: `${BASE}exercises/heel-raises.jpg`,
  2: `${BASE}exercises/wall-calf-stretch.jpg`,
  3: `${BASE}exercises/clamshell.jpg`,
};

const AREA_BUTTONS: { area: Area; icon: IconName }[] = [
  { area: "knees", icon: "knee" },
  { area: "lower-back", icon: "back" },
  { area: "hips-balance", icon: "balance" },
];

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export function Home() {
  usePageTitle("Home");
  const [params] = useSearchParams();
  const { currentDay, isDone, markFinished } = useDay();
  const [playing, setPlaying] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (!playing && returnFocus.current) {
      returnFocus.current = false;
      startRef.current?.focus();
    }
  }, [playing]);

  const session = getSession(currentDay);
  const phase = phaseForDay(currentDay);
  const first = session[0];
  const done = isDone(currentDay);

  if (playing) {
    return (
      <div className="mob-wrap mob-page">
        <SessionPlayer
          exercises={session}
          title="Today's session"
          onExit={() => {
            returnFocus.current = true;
            setPlaying(false);
          }}
          onFinish={() => markFinished(currentDay)}
        />
      </div>
    );
  }

  return (
    <div className="mob-wrap mob-home">
      <header className="mob-home__head">
        <h1 className="mob-greeting">
          {greeting()}, {SAMPLE_FIRST_NAME}
        </h1>
        <p className="mob-muted">
          Phase {phase.number} · Day {currentDay} of {TOTAL_DAYS}
        </p>
      </header>

      <section className="mob-home__today" aria-labelledby="today-title">
        <h2 id="today-title" className="mob-section-title">
          Today
        </h2>
        <div className="mob-home__todaygrid">
          <div className="mob-hero2">
            {/* Mouse convenience: the whole picture starts the session. Keyboard and screen readers use the button below. */}
            <div className="mob-hero2__card" onClick={() => setPlaying(true)}>
              {imageFor(first) ? <img src={imageFor(first)} alt="" /> : null}
              <div className="mob-hero2__shade" aria-hidden="true" />
              <div className="mob-hero2__text">
                <p className="mob-hero2__title">
                  Day {currentDay} · {AREA_LABEL[FOCUS_AREA]}
                </p>
                <p className="mob-hero2__meta">
                  {session.length} exercises · {sessionMinutes(session.length)} min
                </p>
              </div>
            </div>
            <button ref={startRef} type="button" className="mob-cta mob-hero2__start" onClick={() => setPlaying(true)}>
              <Icon name="play" />
              {done ? "Do today's session again" : "Start today's session"}
            </button>
          </div>

          <div className="mob-upnext2">
            <h3 className="mob-upnext2__title">Up next</h3>
            <ol className="mob-upnext2__list">
              {session.map((exercise, i) => (
                <li key={exercise.id}>
                  <Link to={`/app/library/${exercise.id}`} className="mob-upnext2__row">
                    <span className="mob-upnext2__thumb">
                      <ExerciseThumb exercise={exercise} />
                    </span>
                    <span className="mob-upnext2__name">
                      <span className="sr-only">{i + 1}. </span>
                      {displayName(exercise)}
                    </span>
                    <span className="mob-upnext2__min">{MINUTES_PER_EXERCISE} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mob-panel mob-home__more" aria-labelledby="more-title">
        <h2 id="more-title" className="mob-panel__title">
          More workouts
        </h2>
        <ul className="mob-areas">
          {AREA_BUTTONS.map(({ area, icon }) => (
            <li key={area}>
              <Link to={`/app/library?area=${area}`} className="mob-area">
                <span className="mob-area__circle" aria-hidden="true">
                  <Icon name={icon} size={32} />
                </span>
                <span className="mob-area__label">{AREA_LABEL[area]}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/app/library" className="mob-area">
              <span className="mob-area__circle" aria-hidden="true">
                <Icon name="library" size={30} />
              </span>
              <span className="mob-area__label">All exercises</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="mob-home__challenges" aria-labelledby="ch-title">
        <h2 id="ch-title" className="mob-section-title">
          Challenges
        </h2>
        <ul className="mob-challenges">
          {([1, 2, 3] as const).map((n) => (
            <li key={n}>
              <PhaseCard phase={PHASE_INFO[n]} currentDay={currentDay} />
            </li>
          ))}
        </ul>
      </section>

      {params.get("dev") === "1" ? <DevDayControl /> : null}
    </div>
  );
}

function PhaseCard({ phase, currentDay }: { phase: PhaseInfo; currentDay: number }) {
  const current = phaseForDay(currentDay).number;
  const state = phase.number < current ? "done" : phase.number === current ? "current" : "next";
  const span = phase.endDay - phase.startDay + 1;
  const daysIn = Math.min(span, Math.max(0, currentDay - phase.startDay + 1));
  const title = `${phase.name} · Days ${phase.startDay}–${phase.endDay}`;

  const inner = (
    <>
      <img src={PHASE_IMAGES[phase.number]} alt="" loading="lazy" />
      <div className="mob-hero2__shade" aria-hidden="true" />
      <div className="mob-phase__text">
        <p className="mob-phase__title">{title}</p>
        <p className="mob-phase__meta">
          {state === "current"
            ? `${daysIn} of ${span} days`
            : state === "done"
              ? "Done"
              : `Opens Day ${phase.startDay}`}
        </p>
      </div>
      {state === "current" ? <Ring value={daysIn / span} /> : null}
      {state === "done" ? (
        <span className="mob-phase__check" aria-hidden="true">
          <Icon name="check" size={28} />
        </span>
      ) : null}
    </>
  );

  if (state === "current") {
    return (
      <Link to="/app/plan" className={`mob-phase is-${state}`}>
        {inner}
      </Link>
    );
  }
  return <div className={`mob-phase is-${state}`}>{inner}</div>;
}

function Ring({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg className="mob-ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="#c9a45c"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        transform="rotate(-90 28 28)"
      />
    </svg>
  );
}

/** Prototype-only control for moving the sample plan's current day. Shown with ?dev=1. */
function DevDayControl() {
  const { currentDay, setCurrentDay } = useDay();
  return (
    <aside className="mob-dev" aria-labelledby="dev-title">
      <h2 id="dev-title" className="mob-dev__title">
        Prototype control
      </h2>
      <p className="mob-muted">Sample Knees plan and draft exercise data. Changing the day is not saved.</p>
      <div className="mob-dev__row">
        <button type="button" className="mob-pill" onClick={() => setCurrentDay(currentDay - 1)}>
          Day −1
        </button>
        <label className="mob-dev__field">
          <span>Current day</span>
          <input
            type="number"
            min={1}
            max={TOTAL_DAYS}
            value={currentDay}
            onChange={(event) => setCurrentDay(clampDay(Number(event.target.value)))}
            className="mob-input mob-input--number"
          />
        </label>
        <button type="button" className="mob-pill" onClick={() => setCurrentDay(currentDay + 1)}>
          Day +1
        </button>
      </div>
    </aside>
  );
}
