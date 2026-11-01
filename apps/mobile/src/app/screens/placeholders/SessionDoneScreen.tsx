import { Link, Navigate, useParams } from "react-router-dom";
import { FOCUS_AREA_LABEL, TOTAL_DAYS } from "@/lib/plan";
import { isValidDay } from "@/lib/unlock";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { useDayPlan } from "../../state/useDayPlan";
import { useProgress } from "../../state/ProgressProvider";
import { ExerciseList, PageState } from "./ui";

/**
 * /app/session/:day/done — "Day N done. Day N+1 is ready whenever you are." with a Next up
 * preview, Start Day N+1 and Back home. After Day 60 (or with nothing left) a calm finish screen.
 * Hook API: useProgress() → { isDayCompleted(day), isDayUnlocked(day), hasQuestionnaire(kind), progress.allDone },
 * useDayPlan(day + 1).
 */
export function SessionDoneScreen() {
  const { day: dayParam = "" } = useParams();
  const day = Number(dayParam);
  usePageTitle(`Day ${day} done`);
  const { ready, status, error, refresh, progress, isDayCompleted, isDayUnlocked, hasQuestionnaire } = useProgress();
  const nextDay = day + 1;
  const nextPlan = useDayPlan(Math.min(nextDay, TOTAL_DAYS));

  if (!isValidDay(day)) return <Navigate to="/app/home" replace />;
  if (status === "error") {
    return (
      <PageState
        kind="error"
        title="We couldn't load your progress"
        action={
          <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
            Try again
          </button>
        }
      >
        {error ?? "Your session was saved if you saw no error. Please check your connection and try again."}
      </PageState>
    );
  }
  if (!ready) return <PageState kind="loading" title="Saving your day…" />;
  // Landing here without having finished the day: send them to do it.
  if (!isDayCompleted(day)) return <Navigate to={`/app/session/${day}`} replace />;

  const hasNext = nextDay <= TOTAL_DAYS && isDayUnlocked(nextDay);

  if (day === TOTAL_DAYS || progress.allDone || !hasNext) {
    return (
      <div className="o-wrap c-page">
        <div className="c-done">
          <div className="c-stack">
            <span className="c-done__mark" aria-hidden="true">
              <Icon name="check" size={30} />
            </span>
            <h1 className="c-done__title">That's all 60 days.</h1>
            <p className="c-done__lede">You showed up for yourself, one session at a time.</p>
            <p className="c-line">
              Every exercise stays open in the library, so you can keep any of them in your week. Your Day 1, Day 30 and Day 60 answers are side by side on
              Progress.
            </p>
            <div className="c-actions">
              <Link to="/app/progress" className="o-pill o-pill--solid o-pill--big">
                See your progress
              </Link>
              <Link to="/app/home" className="o-pill o-pill--outline o-pill--big">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextNeedsRecheck = Boolean(nextPlan?.recheckKind && !hasQuestionnaire(nextPlan.recheckKind));
  const nextHref = nextNeedsRecheck && nextPlan?.recheckKind ? `/app/recheck/${nextPlan.recheckKind}` : `/app/session/${nextDay}`;
  const newPhase = nextPlan && nextPlan.phaseInfo.startDay === nextDay;

  return (
    <div className="o-wrap c-page">
      <div className="c-done">
        <div className="c-stack">
          <span className="c-done__mark" aria-hidden="true">
            <Icon name="check" size={30} />
          </span>
          <h1 className="c-done__title">Day {day} done.</h1>
          <p className="c-done__lede">Day {nextDay} is ready whenever you are.</p>
          <p className="c-line">Today, tomorrow or later this week: it's your pace. Your place in the plan is saved.</p>
          <div className="c-actions">
            <Link to={nextHref} className="o-pill o-pill--solid o-pill--big">
              Start Day {nextDay}
            </Link>
            <Link to="/app/home" className="o-pill o-pill--outline o-pill--big">
              Back home
            </Link>
          </div>
        </div>

        <section className="c-next c-glass" aria-labelledby="next-title">
          {nextPlan ? (
            <>
              <div className="c-next__head">
                <p className="c-small">Next up</p>
                <h2 id="next-title" className="c-next__title">
                  Day {nextDay} · {nextPlan.phaseName}
                </h2>
                <p className="c-small">
                  {FOCUS_AREA_LABEL[nextPlan.focusArea]} · {nextPlan.exercises.length} exercises · about {nextPlan.estimatedMinutes} min
                </p>
              </div>
              {newPhase ? (
                <p className="c-tag" style={{ justifySelf: "start" }}>
                  New phase starts: {nextPlan.phaseName}
                </p>
              ) : null}
              {nextNeedsRecheck ? (
                <p className="c-msg">
                  <Icon name="today" size={22} />
                  <span>Before Day {nextDay}, three short questions about how you're feeling.</span>
                </p>
              ) : null}
              <ExerciseList exercises={nextPlan.exercises} />
            </>
          ) : (
            <h2 id="next-title" className="c-next__title">
              Day {nextDay}
            </h2>
          )}
        </section>
      </div>
    </div>
  );
}
