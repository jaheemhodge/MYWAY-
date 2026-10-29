import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AREA_LABEL, POSITION_LABEL } from "../data/library";
import {
  FOCUS_AREA,
  PHASE_INFO,
  RECHECK_DAYS,
  TOTAL_DAYS,
  clampDay,
  formatMonthDay,
  formatWeekday,
  getSession,
  phaseForDay,
  phaseLabel,
  sessionMinutes,
} from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { Icon } from "../components/Icon";
import { SessionPlayer } from "../components/SessionPlayer";
import { VideoSlot } from "../components/VideoSlot";

const STRIP_SIZE = 7;

function windowStartFor(day: number) {
  return Math.min(Math.max(1, day - 3), TOTAL_DAYS - STRIP_SIZE + 1);
}

export function Today() {
  usePageTitle("Today");
  const { currentDay, isDone, markFinished } = useDay();
  const [selected, setSelected] = useState(currentDay);
  const [stripStart, setStripStart] = useState(() => windowStartFor(currentDay));
  const [playing, setPlaying] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    setSelected(currentDay);
    setStripStart(windowStartFor(currentDay));
  }, [currentDay]);

  useEffect(() => {
    if (!playing && returnFocus.current) {
      returnFocus.current = false;
      startRef.current?.focus();
    }
  }, [playing]);

  const session = getSession(selected);

  if (playing) {
    return (
      <div className="mob-wrap mob-page">
        <SessionPlayer
          exercises={getSession(currentDay)}
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

  const isToday = selected === currentDay;
  const selectedDone = isDone(selected);

  return (
    <div className="mob-today">
      <header className="mob-haze">
        <div className="mob-wrap mob-haze__inner">
          <div className="mob-haze__text">
            <h1 className="mob-display">
              {formatWeekday(currentDay)}, {formatMonthDay(currentDay, "long")}
            </h1>
            <p className="mob-lede">
              Day {currentDay} of {TOTAL_DAYS} · {AREA_LABEL[FOCUS_AREA]} plan
            </p>
          </div>
          <PhaseRail day={currentDay} />
        </div>

        <div className="mob-wrap">
          <DayStrip
            start={stripStart}
            selected={selected}
            currentDay={currentDay}
            isDone={isDone}
            onSelect={setSelected}
            onShift={(delta) => setStripStart((s) => windowStartFor(s + 3 + delta))}
          />
          <DayStepper selected={selected} currentDay={currentDay} isDone={isDone} onSelect={setSelected} />
        </div>
      </header>

      <div className="mob-wrap mob-today__grid">
        <section className="mob-session" aria-labelledby="session-title">
          <div className="mob-session__head">
            <h2 id="session-title" className="mob-h2">
              {isToday ? "Today's session" : `Day ${selected} session`}
            </h2>
            <p className="mob-meta">
              <span className="mob-nowrap">{session.length} exercises</span> ·{" "}
              <span className="mob-nowrap">about {sessionMinutes(session.length)} min</span>
              <span className="mob-meta__sep" aria-hidden="true">
                ·
              </span>
              <span className="mob-nowrap">{phaseForDay(selected).name}</span>
            </p>
          </div>

          <VideoSlot label={`${session[0].name}, first exercise`} size="hero" />

          <ol className="mob-session__list">
            {session.map((exercise, i) => (
              <li key={exercise.id}>
                <Link to={`/app/library/${exercise.id}`} className="mob-session__row">
                  <span className="mob-session__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="mob-session__name">{exercise.name}</span>
                  <span className="mob-tag mob-tag--plain">{POSITION_LABEL[exercise.position]}</span>
                  <Icon name="chevronRight" />
                </Link>
              </li>
            ))}
          </ol>

          {isToday ? (
            <div className="mob-session__start">
              <button
                ref={startRef}
                type="button"
                className="mob-btn mob-btn--primary mob-btn--big mob-btn--block"
                onClick={() => setPlaying(true)}
              >
                <Icon name="play" />
                {selectedDone ? "Do today's session again" : "Start today's session"}
              </button>
              {selectedDone ? <p className="mob-meta">You finished today's session.</p> : null}
            </div>
          ) : (
            <div className="mob-session__start">
              <p className="mob-note">
                {selectedDone
                  ? `You finished Day ${selected}.`
                  : `This session opens on Day ${selected}, ${formatWeekday(selected)} ${formatMonthDay(selected)}.`}
              </p>
              <button type="button" className="mob-btn mob-btn--secondary mob-btn--block" onClick={() => setSelected(currentDay)}>
                Back to today
              </button>
            </div>
          )}
        </section>

        <UpNext currentDay={currentDay} onPreview={(day) => setSelected(day)} />
      </div>

      <div className="mob-wrap">
        <DevDayControl />
      </div>
    </div>
  );
}

function PhaseRail({ day }: { day: number }) {
  const current = phaseForDay(day);
  return (
    <div className="mob-rail">
      <p className="mob-rail__now">{phaseLabel(current)}</p>
      <ol className="mob-rail__list" aria-label="Your three phases">
        {([1, 2, 3] as const).map((n) => {
          const phase = PHASE_INFO[n];
          const state = n < current.number ? "done" : n === current.number ? "current" : "next";
          const span = phase.endDay - phase.startDay + 1;
          const fill = state === "done" ? 100 : state === "current" ? ((day - phase.startDay + 1) / span) * 100 : 0;
          return (
            <li key={n} className={`mob-rail__seg is-${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="mob-rail__bar" aria-hidden="true">
                <span style={{ width: `${fill}%` }} />
              </span>
              <span className="mob-rail__name">{phase.name}</span>
              <span className="mob-rail__days">
                Days {phase.startDay}–{phase.endDay}
                {state === "current" ? <span className="sr-only">, you are here</span> : null}
                {state === "done" ? <span className="sr-only">, finished</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function dayState(day: number, currentDay: number, isDone: (d: number) => boolean) {
  if (day === currentDay) return isDone(day) ? "today is-finished" : "today";
  if (isDone(day)) return "done";
  return "upcoming";
}

function DayStrip({
  start,
  selected,
  currentDay,
  isDone,
  onSelect,
  onShift,
}: {
  start: number;
  selected: number;
  currentDay: number;
  isDone: (d: number) => boolean;
  onSelect: (day: number) => void;
  onShift: (delta: number) => void;
}) {
  const days = Array.from({ length: STRIP_SIZE }, (_, i) => start + i);
  const atStart = start <= 1;
  const atEnd = start + STRIP_SIZE - 1 >= TOTAL_DAYS;
  return (
    <div className="mob-strip" role="group" aria-label="Choose a day">
      <button
        type="button"
        className="mob-btn mob-btn--secondary mob-strip__arrow"
        aria-disabled={atStart}
        onClick={() => !atStart && onShift(-STRIP_SIZE)}
      >
        <Icon name="chevronLeft" />
        <span>Earlier</span>
      </button>
      <ul className="mob-strip__days">
        {days.map((day) => {
          const state = dayState(day, currentDay, isDone);
          const done = isDone(day);
          return (
            <li key={day}>
              <button
                type="button"
                className={`mob-daychip is-${state}`}
                aria-pressed={day === selected}
                aria-current={day === currentDay ? "date" : undefined}
                onClick={() => onSelect(day)}
              >
                <span className="mob-daychip__date">
                  {formatWeekday(day, "short")} {formatMonthDay(day).split(" ")[1]}
                </span>
                <span className="mob-daychip__day">Day {day}</span>
                <span className="mob-daychip__state">
                  {day === currentDay ? (
                    "Today"
                  ) : done ? (
                    <>
                      <Icon name="check" size={18} />
                      Done
                    </>
                  ) : (
                    "Upcoming"
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="mob-btn mob-btn--secondary mob-strip__arrow"
        aria-disabled={atEnd}
        onClick={() => !atEnd && onShift(STRIP_SIZE)}
      >
        <span>Later</span>
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}

function DayStepper({
  selected,
  currentDay,
  isDone,
  onSelect,
}: {
  selected: number;
  currentDay: number;
  isDone: (d: number) => boolean;
  onSelect: (day: number) => void;
}) {
  const state = selected === currentDay ? "Today" : isDone(selected) ? "Done" : "Upcoming";
  return (
    <div className="mob-stepper" role="group" aria-label="Choose a day">
      <button
        type="button"
        className="mob-btn mob-btn--secondary mob-btn--compact"
        aria-label="Previous day"
        aria-disabled={selected <= 1}
        onClick={() => selected > 1 && onSelect(selected - 1)}
      >
        <Icon name="chevronLeft" />
        Prev
      </button>
      <p className="mob-stepper__day" aria-live="polite">
        <span className="mob-stepper__date">
          {formatWeekday(selected)} {formatMonthDay(selected)}
        </span>
        <span className="mob-stepper__meta">
          Day {selected} · {state}
        </span>
      </p>
      <button
        type="button"
        className="mob-btn mob-btn--secondary mob-btn--compact"
        aria-label="Next day"
        aria-disabled={selected >= TOTAL_DAYS}
        onClick={() => selected < TOTAL_DAYS && onSelect(selected + 1)}
      >
        Next
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}

function UpNext({ currentDay, onPreview }: { currentDay: number; onPreview: (day: number) => void }) {
  const tomorrow = currentDay < TOTAL_DAYS ? currentDay + 1 : null;
  const tomorrowSession = tomorrow ? getSession(tomorrow) : [];
  const nextPhase = ([2, 3] as const).map((n) => PHASE_INFO[n]).find((p) => p.startDay > currentDay);
  const nextRecheck = RECHECK_DAYS.find((d) => d > currentDay);

  const inDays = (day: number) => {
    const n = day - currentDay;
    return n === 1 ? "tomorrow" : `in ${n} days`;
  };

  return (
    <section className="mob-upnext" aria-labelledby="upnext-title">
      <h2 id="upnext-title" className="mob-h2">
        Up next
      </h2>
      <ul className="mob-upnext__list">
        {tomorrow ? (
          <li className="mob-upnext__item">
            <p className="mob-upnext__when">
              Tomorrow · {formatWeekday(tomorrow)} {formatMonthDay(tomorrow)}
            </p>
            <h3 className="mob-h3">Day {tomorrow} session</h3>
            <p className="mob-meta">
              {tomorrowSession.length} exercises · about {sessionMinutes(tomorrowSession.length)} min, starting with{" "}
              {tomorrowSession[0].name.toLowerCase()}
            </p>
            <button type="button" className="mob-btn mob-btn--text mob-btn--inline" onClick={() => onPreview(tomorrow)}>
              Preview Day {tomorrow}
            </button>
          </li>
        ) : null}
        {nextPhase ? (
          <li className="mob-upnext__item">
            <p className="mob-upnext__when">
              Day {nextPhase.startDay} · {inDays(nextPhase.startDay)}
            </p>
            <h3 className="mob-h3">
              Phase {nextPhase.number} starts: {nextPhase.name}
            </h3>
            <p className="mob-meta">
              Days {nextPhase.startDay}–{nextPhase.endDay}. New exercises open in the Library.
            </p>
          </li>
        ) : null}
        {nextRecheck ? (
          <li className="mob-upnext__item">
            <p className="mob-upnext__when">
              Day {nextRecheck} · {inDays(nextRecheck)}
            </p>
            <h3 className="mob-h3">Day {nextRecheck} re-check</h3>
            <p className="mob-meta">
              {formatWeekday(nextRecheck)} {formatMonthDay(nextRecheck)}. The same short check you did at the start.
            </p>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

/** Prototype-only control for moving the sample plan's current day. */
function DevDayControl() {
  const { currentDay, setCurrentDay } = useDay();
  return (
    <aside className="mob-dev" aria-labelledby="dev-title">
      <h2 id="dev-title" className="mob-dev__title">
        Prototype control
      </h2>
      <p className="mob-meta">Sample Knees plan and draft exercise data. Changing the day is not saved.</p>
      <div className="mob-dev__row">
        <button type="button" className="mob-btn mob-btn--secondary mob-btn--compact" onClick={() => setCurrentDay(currentDay - 1)}>
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
        <button type="button" className="mob-btn mob-btn--secondary mob-btn--compact" onClick={() => setCurrentDay(currentDay + 1)}>
          Day +1
        </button>
      </div>
    </aside>
  );
}
