import { Link, Navigate, useParams } from "react-router-dom";
import { TOTAL_DAYS } from "@/lib/plan";
import { isValidDay } from "@/lib/unlock";
import { usePageTitle } from "../../hooks";
import { useDayPlan } from "../../state/useDayPlan";
import { useProgress } from "../../state/ProgressProvider";

/**
 * PLACEHOLDER (unstyled) — /app/session/:day/done
 * Hook API: useProgress() → { isDayCompleted(day), isDayUnlocked(day), recheckDue }, useDayPlan(day + 1).
 * Offers "Start Day N+1" (unlocked immediately after completing Day N) or "Back home".
 */
export function SessionDoneScreen() {
  const { day: dayParam = "" } = useParams();
  const day = Number(dayParam);
  usePageTitle(`Day ${day} done`);
  const { ready, isDayCompleted, isDayUnlocked, hasQuestionnaire } = useProgress();
  const nextDay = day + 1;
  const nextPlan = useDayPlan(Math.min(nextDay, TOTAL_DAYS));

  if (!isValidDay(day)) return <Navigate to="/app/home" replace />;
  if (!ready) return <p role="status">Loading…</p>;
  // Landing here without having finished the day: send them to do it.
  if (!isDayCompleted(day)) return <Navigate to={`/app/session/${day}`} replace />;

  const hasNext = nextDay <= TOTAL_DAYS && isDayUnlocked(nextDay);
  const nextNeedsRecheck = nextPlan?.recheckKind && !hasQuestionnaire(nextPlan.recheckKind);
  const nextHref = nextNeedsRecheck ? `/app/recheck/${nextPlan.recheckKind}` : `/app/session/${nextDay}`;

  return (
    <main>
      <h1>Day {day} done</h1>
      {nextPlan && hasNext ? (
        <p>
          Next up: Day {nextDay} · {nextPlan.phaseName} · {nextPlan.exercises.length} exercises · about {nextPlan.estimatedMinutes} min
          {nextNeedsRecheck ? " (short re-check first)" : ""}
        </p>
      ) : (
        <p>That was the last day of the plan.</p>
      )}
      {hasNext ? <Link to={nextHref}>Start Day {nextDay}</Link> : null}
      <Link to="/app/home">Back home</Link>
    </main>
  );
}
