import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AREA_LABEL } from "../data/library";
import { imageFor } from "../data/images";
import {
  FOCUS_AREA,
  MINUTES_PER_EXERCISE,
  PHASE_INFO,
  RECHECK_DAYS,
  TOTAL_DAYS,
  clampDay,
  formatMonthDay,
  formatWeekday,
  getSession,
  phaseForDay,
  sessionMinutes,
} from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { CarouselRow } from "../components/CarouselRow";
import { ExerciseCard } from "../components/ExerciseCard";
import { Icon } from "../components/Icon";
import { SessionPlayer } from "../components/SessionPlayer";
import { VideoSlot } from "../components/VideoSlot";

const STRIP_SIZE = 7;

function windowStartFor(day: number) {
  return Math.min(Math.max(1, day - 3), TOTAL_DAYS - STRIP_SIZE + 1);
}

export function Today() {
  usePageTitle("Today");
  const [params] = useSearchParams();
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

  const session = getSession(selected);
  const first = session[0];
  const isToday = selected === currentDay;
  const selectedDone = isDone(selected);
  const phase = phaseForDay(currentDay);

  return (
    <div className="mob-today">
      <header className="mob-wrap mob-today__head">
        <h1 className="mob-title">
          {formatWeekday(currentDay)}, {formatMonthDay(currentDay, "long")}
        </h1>
        <div className="mob-phaseline">
          <p>
            Phase {phase.number} · {phase.name} · Day {currentDay} of {TOTAL_DAYS}
          </p>
          <div className="mob-phaseline__bar" aria-hidden="true">
            <span style={{ width: `${(currentDay / TOTAL_DAYS) * 100}%` }} />
          </div>
        </div>
      </header>

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

      <div className="mob-wrap mob-today__main">
        <section className="mob-hero" aria-labelledby="session-title">
          <VideoSlot poster={imageFor(first)} ratio="hero" />
          <div className="mob-hero__caption">
            <h2 id="session-title" className="mob-section-title">
              {isToday ? "Today's session" : `Day ${selected} session`}
            </h2>
            <p className="mob-muted">
              {session.length} exercises · about {sessionMinutes(session.length)} min · {AREA_LABEL[FOCUS_AREA]}. First
              up: {first.name.toLowerCase()}.
            </p>
          </div>
          {isToday ? (
            <button ref={startRef} type="button" className="mob-cta" onClick={() => setPlaying(true)}>
              <Icon name="play" />
              {selectedDone ? "Do today's session again" : "Start today's session"}
            </button>
          ) : (
            <div className="mob-hero__other">
              <p className="mob-muted">
                {selectedDone
                  ? `You finished Day ${selected}.`
                  : `This session opens on Day ${selected}, ${formatWeekday(selected)} ${formatMonthDay(selected)}.`}
              </p>
              <button type="button" className="mob-pill" onClick={() => setSelected(currentDay)}>
                Back to today
              </button>
            </div>
          )}
        </section>

        <UpNext currentDay={currentDay} onPreview={(day) => setSelected(day)} />
      </div>

      <div className="mob-wrap mob-today__row">
        <CarouselRow
          title={isToday ? "In today's session" : `In the Day ${selected} session`}
          items={session}
          getKey={(exercise) => exercise.id}
          seeAll={{ label: `See all ${session.length}`, expandedLabel: "Show fewer" }}
          stackOnPhone
          renderItem={(exercise, i) => (
            <ExerciseCard
              exercise={exercise}
              currentDay={currentDay}
              showPhase={false}
              index={i + 1}
              meta={`about ${MINUTES_PER_EXERCISE} min`}
            />
          )}
        />
      </div>

      {params.get("dev") === "1" ? (
        <div className="mob-wrap">
          <DevDayControl />
        </div>
      ) : null}
    </div>
  );
}

function dayState(day: number, currentDay: number, isDone: (d: number) => boolean) {
  if (day === currentDay) return "today";
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
      <button type="button" className="mob-round" aria-disabled={atStart} onClick={() => !atStart && onShift(-STRIP_SIZE)}>
        <Icon name="chevronLeft" />
        <span className="mob-round__label">Earlier</span>
        <span className="sr-only"> days</span>
      </button>
      <ul className="mob-strip__days">
        {days.map((day) => {
          const state = dayState(day, currentDay, isDone);
          return (
            <li key={day}>
              <button
                type="button"
                className={`mob-daypill is-${state}`}
                aria-pressed={day === selected}
                aria-current={day === currentDay ? "date" : undefined}
                onClick={() => onSelect(day)}
              >
                <span className="mob-daypill__date">
                  {formatWeekday(day, "short")} {formatMonthDay(day).split(" ")[1]}
                </span>
                <span className="mob-daypill__day">
                  {state === "done" ? <Icon name="check" size={18} /> : null}
                  Day {day}
                  {state === "done" ? <span className="sr-only">, done</span> : null}
                  {state === "today" ? <span className="sr-only">, today</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="mob-round" aria-disabled={atEnd} onClick={() => !atEnd && onShift(STRIP_SIZE)}>
        <span className="mob-round__label">Later</span>
        <span className="sr-only"> days</span>
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
  const state = dayState(selected, currentDay, isDone);
  return (
    <div className="mob-stepper" role="group" aria-label="Choose a day">
      <button
        type="button"
        className="mob-round"
        aria-disabled={selected <= 1}
        onClick={() => selected > 1 && onSelect(selected - 1)}
      >
        <Icon name="chevronLeft" />
        <span className="sr-only">Previous day</span>
      </button>
      <p className={`mob-stepper__day is-${state}`} aria-live="polite">
        <span className="mob-stepper__date">
          {formatWeekday(selected)} {formatMonthDay(selected)}
        </span>
        <span className="mob-stepper__meta">
          {state === "done" ? <Icon name="check" size={18} /> : null}
          Day {selected}
          {state === "today" ? " · Today" : null}
          {state === "done" ? <span className="sr-only">, done</span> : null}
        </span>
      </p>
      <button
        type="button"
        className="mob-round"
        aria-disabled={selected >= TOTAL_DAYS}
        onClick={() => selected < TOTAL_DAYS && onSelect(selected + 1)}
      >
        <Icon name="chevronRight" />
        <span className="sr-only">Next day</span>
      </button>
    </div>
  );
}

function UpNext({ currentDay, onPreview }: { currentDay: number; onPreview: (day: number) => void }) {
  const tomorrow = currentDay < TOTAL_DAYS ? currentDay + 1 : null;
  const tomorrowSession = tomorrow ? getSession(tomorrow) : [];
  const nextPhase = ([2, 3] as const).map((n) => PHASE_INFO[n]).find((p) => p.startDay > currentDay);
  const nextRecheck = RECHECK_DAYS.find((d) => d > currentDay);
  const inDays = (day: number) => (day - currentDay === 1 ? "tomorrow" : `in ${day - currentDay} days`);

  return (
    <section className="mob-upnext" aria-labelledby="upnext-title">
      <h2 id="upnext-title" className="mob-section-title">
        Up next
      </h2>
      <ul className="mob-upnext__list">
        {tomorrow ? (
          <li>
            <p className="mob-upnext__when">
              Tomorrow · {formatWeekday(tomorrow)} {formatMonthDay(tomorrow)}
            </p>
            <h3 className="mob-upnext__title">Day {tomorrow} session</h3>
            <p className="mob-muted">
              {tomorrowSession.length} exercises · about {sessionMinutes(tomorrowSession.length)} min
            </p>
            <button type="button" className="mob-textlink" onClick={() => onPreview(tomorrow)}>
              Preview Day {tomorrow}
            </button>
          </li>
        ) : null}
        {nextPhase ? (
          <li>
            <p className="mob-upnext__when">
              Day {nextPhase.startDay} · {inDays(nextPhase.startDay)}
            </p>
            <h3 className="mob-upnext__title">
              Phase {nextPhase.number} starts: {nextPhase.name}
            </h3>
            <p className="mob-muted">
              Days {nextPhase.startDay}–{nextPhase.endDay}. New exercises open in the Library.
            </p>
          </li>
        ) : null}
        {nextRecheck ? (
          <li>
            <p className="mob-upnext__when">
              Day {nextRecheck} · {inDays(nextRecheck)}
            </p>
            <h3 className="mob-upnext__title">Day {nextRecheck} re-check</h3>
            <p className="mob-muted">
              {formatWeekday(nextRecheck)} {formatMonthDay(nextRecheck)}. The same short check you did at the start.
            </p>
          </li>
        ) : null}
      </ul>
    </section>
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
