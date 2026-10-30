import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { SessionPlayer } from "../components/SessionPlayer";
import { imageFor, PLACEHOLDER_WORD } from "../data/images";
import { AREA_LABEL, displayName, type Area, type Exercise } from "../data/library";
import {
  FOCUS_AREA,
  MINUTES_PER_EXERCISE,
  PHASE_INFO,
  TOTAL_DAYS,
  clampDay,
  dateForDay,
  formatWeekday,
  getSession,
  phaseForDay,
  sessionMinutes,
} from "../data/plan";
import { SAMPLE_FIRST_NAME } from "../data/profile";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";

const BASE = import.meta.env.BASE_URL;

/** Decorative photo behind each phase panel (our own exercise stills). */
const PHASE_IMAGES: Record<number, string> = {
  1: `${BASE}exercises/heel-raises.jpg`,
  2: `${BASE}exercises/wall-calf-stretch.jpg`,
  3: `${BASE}exercises/clamshell.jpg`,
};

const WORKOUTS: { to: string; label: string; icon: IconName }[] = [
  ...(["knees", "lower-back", "hips-balance"] as Area[]).map((area) => ({
    to: `/app/library?area=${area}`,
    label: AREA_LABEL[area],
    icon: (area === "knees" ? "knee" : area === "lower-back" ? "back" : "balance") as IconName,
  })),
  { to: "/app/library", label: "All exercises", icon: "library" },
];

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

/**
 * Home: one tight stack of soft panels on a warm page.
 * Desktop: left 2/3 (Today, More workouts, Challenges), right 1/3 (Up next, This week).
 * Phones: one column in the order greeting, Today, More workouts, Up next, Challenges, This week.
 */
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
  const done = isDone(currentDay);
  const heroImg = imageFor(session[0]);

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
      <h1 className="mob-greeting">
        {greeting()}, {SAMPLE_FIRST_NAME}
      </h1>
      <h2 className="mob-home__label">Today</h2>

      <div className="mob-home__grid">
        <div className="mob-home__col mob-home__col--main">
          {/* Today hero */}
          <section className="mob-hero3" aria-label="Today's session" style={{ order: 1 }}>
            {/* The picture is a mouse shortcut; the Start button is the control. */}
            <div className="mob-hero3__media" onClick={() => setPlaying(true)}>
              {heroImg ? <img src={heroImg} alt="" /> : null}
            </div>
            <p className="mob-frost-chip">
              Phase {phase.number} · Day {currentDay} of {TOTAL_DAYS}
            </p>
            <div className="mob-hero3__strip">
              <div className="mob-hero3__text">
                <p className="mob-hero3__title">
                  Day {currentDay} · {AREA_LABEL[FOCUS_AREA]}
                </p>
                <p className="mob-hero3__meta">
                  {session.length} exercises · {sessionMinutes(session.length)} min
                </p>
              </div>
              <button ref={startRef} type="button" className="mob-hero3__start" onClick={() => setPlaying(true)}>
                <Icon name="play" />
                {done ? "Do today's session again" : "Start today's session"}
              </button>
            </div>
          </section>

          {/* More workouts */}
          <section className="mob-glass mob-more" aria-labelledby="more-title" style={{ order: 2 }}>
            <h2 id="more-title" className="mob-glass__title">
              More workouts
            </h2>
            <ul className="mob-more__row">
              {WORKOUTS.map((w) => (
                <li key={w.to}>
                  <Link to={w.to} className="mob-area">
                    <span className="mob-area__circle" aria-hidden="true">
                      <Icon name={w.icon} size={30} />
                    </span>
                    <span className="mob-area__label">{w.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Challenges */}
          <section className="mob-home__challenges" aria-labelledby="ch-title" style={{ order: 4 }}>
            <h2 id="ch-title" className="mob-home__label">
              Challenges
            </h2>
            <ChallengePanel currentDay={currentDay} isDone={isDone} />
            <div className="mob-later">
              {([2, 3] as const)
                .map((n) => PHASE_INFO[n])
                .filter((p) => p.number > phase.number)
                .map((p) => (
                  <div key={p.number} className="mob-glass mob-later__panel">
                    <p className="mob-later__name">{p.name}</p>
                    <p className="mob-muted">Opens Day {p.startDay}</p>
                  </div>
                ))}
            </div>
          </section>
        </div>

        <div className="mob-home__col mob-home__col--side">
          {/* Up next */}
          <section className="mob-glass mob-next" aria-labelledby="next-title" style={{ order: 3 }}>
            <h2 id="next-title" className="mob-glass__title">
              Up next
            </h2>
            <ol className="mob-next__list">
              {session.map((exercise, i) => (
                <li key={exercise.id}>
                  <Link to={`/app/library/${exercise.id}`} className="mob-next__row">
                    <NextThumb exercise={exercise} />
                    <span className="mob-next__name">
                      <span className="sr-only">{i + 1}. </span>
                      {displayName(exercise)}
                    </span>
                    <span className="mob-next__min">{MINUTES_PER_EXERCISE} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* This week */}
          <section className="mob-glass mob-week" aria-labelledby="week-title" style={{ order: 5 }}>
            <h2 id="week-title" className="mob-glass__title">
              This week
            </h2>
            <div className="mob-week__row">
              <span className={`mob-status${done ? " is-done" : ""}`} aria-hidden="true">
                {done ? <Icon name="check" size={20} /> : null}
              </span>
              <div>
                <p className="mob-week__name">
                  {formatWeekday(currentDay)} · Day {currentDay} session
                </p>
                <p className="mob-muted">{done ? "Done" : "Not started yet"}</p>
              </div>
            </div>
            <div className="mob-week__actions">
              <Link to="/app/plan" className="mob-pill">
                Edit schedule
              </Link>
              <Link to="/app/progress" className="mob-pill">
                View history
              </Link>
            </div>
          </section>
        </div>
      </div>

      {params.get("dev") === "1" ? <DevDayControl /> : null}
    </div>
  );
}

function NextThumb({ exercise }: { exercise: Exercise }) {
  const src = imageFor(exercise);
  return (
    <span className={`mob-next__thumb${src ? "" : " is-placeholder"}`} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <span>{PLACEHOLDER_WORD[exercise.position]}</span>}
    </span>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ChallengePanel({ currentDay, isDone }: { currentDay: number; isDone: (d: number) => boolean }) {
  const phase = phaseForDay(currentDay);
  const span = phase.endDay - phase.startDay + 1;
  const daysIn = currentDay - phase.startDay + 1;
  const left = phase.endDay - currentDay;
  // Plan days for this calendar week, Monday to Sunday.
  const dow = (dateForDay(currentDay).getDay() + 6) % 7;
  const week = DOW.map((label, i) => ({ label, day: currentDay - dow + i }));

  return (
    <div className="mob-challenge">
      <img className="mob-challenge__bg" src={PHASE_IMAGES[phase.number]} alt="" aria-hidden="true" />
      <div className="mob-challenge__frost">
        <div className="mob-challenge__top">
          <div>
            <p className="mob-challenge__title">{phase.name}</p>
            <p className="mob-challenge__meta">
              {left} {left === 1 ? "day" : "days"} left · {daysIn} of {span} days done
            </p>
          </div>
          <Ring value={daysIn / span} />
        </div>
        <ol className="mob-weekstrip" aria-label="This week">
          {week.map(({ label, day }) => {
            const inPlan = day >= 1 && day <= TOTAL_DAYS;
            const state = day === currentDay ? "today" : inPlan && isDone(day) ? "done" : "upcoming";
            return (
              <li key={label} className={`is-${state}`}>
                <span className="mob-weekstrip__dow" aria-hidden="true">
                  {label}
                </span>
                <span className="mob-weekstrip__dot" aria-hidden="true">
                  {state === "done" ? <Icon name="check" size={18} /> : null}
                </span>
                <span className="sr-only">
                  {label}: {state === "today" ? "today" : state === "done" ? "done" : "coming up"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg className="mob-ring" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(26 46 36 / 0.12)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#c9a45c"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${c * value} ${c}`}
        transform="rotate(-90 32 32)"
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
