import { Link } from "react-router-dom";
import { FOCUS_AREA_LABEL, getAllDayPlans, PHASE_INFO, TOTAL_DAYS, type DayPlan } from "@/lib/plan";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { useProfile } from "../../state/ProfileProvider";
import { useProgress } from "../../state/ProgressProvider";
import { PageHead, PageState } from "./ui";

/**
 * /app/plan — the 60 days in three phase sections. Each day is Done (replay), Today (start) or
 * Locked (not a link).
 * Hook API: useProfile().focusArea, getAllDayPlans(focusArea),
 * useProgress() → { currentDay, isDayCompleted(day), isDayUnlocked(day) }.
 */
const PHASES = [1, 2, 3] as const;

export function PlanScreen() {
  usePageTitle("My plan");
  const { focusArea, status: profileStatus } = useProfile();
  const { currentDay, ready, status, error, refresh, completedDays, isDayCompleted, isDayUnlocked, isDayPaywalled } = useProgress();

  if (status === "error") {
    return (
      <PageState
        kind="error"
        title="We couldn't load your plan"
        action={
          <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
            Try again
          </button>
        }
      >
        {error ?? "Please check your connection and try again."}
      </PageState>
    );
  }
  if (!ready || profileStatus === "loading" || profileStatus === "idle") return <PageState kind="loading" title="Loading your plan…" />;
  if (!focusArea) {
    return (
      <PageState
        kind="empty"
        title="Your plan isn't set up yet"
        action={
          <Link to="/onboarding" className="o-pill o-pill--solid">
            Set up my plan
          </Link>
        }
      >
        Answer a few short questions and choose a focus area, and your 60 days will appear here.
      </PageState>
    );
  }

  const days = getAllDayPlans(focusArea);
  const todayDone = isDayCompleted(currentDay);

  return (
    <div className="o-wrap c-page">
      <PageHead
        title="My plan"
        line={`${FOCUS_AREA_LABEL[focusArea]} · ${completedDays.length} of ${TOTAL_DAYS} days done · about ${days[0]?.estimatedMinutes ?? 15} minutes a day`}
      >
        <div className="c-plan__bar">
          <p className="c-small">Done days can be played again. Locked days open once the day before is done.</p>
          {todayDone ? null : (
            <a href={`#day-${currentDay}`} className="o-pill o-pill--outline">
              Go to Day {currentDay}
            </a>
          )}
        </div>
      </PageHead>

      {PHASES.map((phase) => {
        const info = PHASE_INFO[phase];
        return (
          <section key={phase} className="c-phase" aria-labelledby={`phase-${phase}`}>
            <div className="c-phase__head">
              <h2 id={`phase-${phase}`} className="c-phase__title">
                {info.name}
              </h2>
              <p className="c-small">
                Phase {phase} · Days {info.startDay}–{info.endDay}
              </p>
            </div>
            <ol className="c-days">
              {days
                .filter((d) => d.phase === phase)
                .map((d) => {
                  const paywalled = !isDayCompleted(d.day) && isDayPaywalled(d.day);
                  return (
                    <DayTile
                      key={d.day}
                      plan={d}
                      state={isDayCompleted(d.day) ? "done" : paywalled || !isDayUnlocked(d.day) ? "locked" : "today"}
                      note={paywalled ? "Full access" : undefined}
                    />
                  );
                })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function DayTile({ plan, state, note }: { plan: DayPlan; state: "done" | "today" | "locked"; note?: string }) {
  const meta = `${plan.exercises.length} exercises · ${plan.estimatedMinutes} min`;
  const metaEl = (
    <span className="c-day__meta">
      {plan.estimatedMinutes} min<span className="c-day__more"> · {plan.exercises.length} exercises</span>
    </span>
  );
  const top = (
    <span className="c-day__top">
      <span className="c-day__num">Day {plan.day}</span>
      {state === "done" ? (
        <span className="c-day__check" aria-hidden="true">
          <Icon name="check" size={16} />
        </span>
      ) : state === "locked" ? (
        <Icon name="lock" size={20} />
      ) : null}
    </span>
  );
  const recheck = plan.isRecheckDay ? <span className="c-day__meta">Re-check first</span> : null;

  if (state === "locked") {
    return (
      <li className="c-day" id={`day-${plan.day}`}>
        <div className="c-day__box c-day__box--locked">
          {top}
          {metaEl}
          {recheck}
          <span className="c-day__state">Locked</span>
          {note ? <span className="c-day__meta">{note}</span> : null}
        </div>
      </li>
    );
  }

  const today = state === "today";
  return (
    <li className="c-day" id={`day-${plan.day}`}>
      <Link
        to={`/app/session/${plan.day}`}
        className={`c-day__box ${today ? "c-day__box--today" : "c-day__box--done c-glass"}`}
        aria-label={`Day ${plan.day}, ${today ? "today. Start" : "done. Replay"}. ${meta}`}
        aria-current={today ? "step" : undefined}
      >
        {top}
        {metaEl}
        {recheck}
        <span className="c-day__state">
          {today ? (
            <>
              Today · Start <Icon name="play" size={16} />
            </>
          ) : (
            <>Done · Replay</>
          )}
        </span>
      </Link>
    </li>
  );
}
