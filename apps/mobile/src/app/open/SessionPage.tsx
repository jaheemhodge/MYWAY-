import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ProgressError } from "@/lib/progress";
import { isValidDay } from "@/lib/unlock";
import { SessionPlayer } from "../components/SessionPlayer";
import { getExercise } from "../data/library";
import { usePageTitle } from "../hooks";
import { useProgress } from "../state/ProgressProvider";
import { useDayPlan } from "../state/useDayPlan";

/**
 * Session player route.
 *   /app/session            → today's session (redirects to /app/session/:currentDay)
 *   /app/session/:day       → that day's plan; locked days redirect to the current day,
 *                             Day 30/60 go to the re-check first if it isn't saved yet
 *   /app/session/:exerciseId → one exercise, no completion recorded
 */
export function SessionPage() {
  const { id } = useParams();
  const { currentDay, ready } = useProgress();

  if (!id && !ready) return <p role="status">Loading your plan…</p>;
  if (!id) return <Navigate to={`/app/session/${currentDay}`} replace />;
  if (/^\d+$/.test(id)) return <DaySession day={Number(id)} />;

  const single = getExercise(id.toUpperCase());
  return <SingleExercise exerciseId={single?.id ?? id} />;
}

function SingleExercise({ exerciseId }: { exerciseId: string }) {
  const navigate = useNavigate();
  const exercise = getExercise(exerciseId);
  usePageTitle(exercise ? exercise.name : "Exercise");
  if (!exercise) return <Navigate to="/app/home" replace />;
  return (
    <div className="o-wrap o-session">
      <SessionPlayer
        exercises={[exercise]}
        title={exercise.name}
        onExit={() => (window.history.length > 1 ? navigate(-1) : navigate("/app/home"))}
      />
    </div>
  );
}

function DaySession({ day }: { day: number }) {
  const navigate = useNavigate();
  const { currentDay, ready, isDayUnlocked, isDayCompleted, hasQuestionnaire, completeDay } = useProgress();
  const plan = useDayPlan(day);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePageTitle(`Day ${day}`);

  if (!ready || !plan) return <p role="status">Loading your plan…</p>;
  if (!isValidDay(day) || !isDayUnlocked(day)) return <Navigate to={`/app/session/${currentDay}`} replace />;
  if (plan.recheckKind && !isDayCompleted(day) && !hasQuestionnaire(plan.recheckKind)) {
    return <Navigate to={`/app/recheck/${plan.recheckKind}`} replace />;
  }

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await completeDay(day, plan.exercises.map((e) => e.id));
      navigate(`/app/session/${day}/done`, { replace: true });
    } catch (err) {
      setError(err instanceof ProgressError ? err.message : "We couldn't save this day. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="o-wrap o-session">
      <SessionPlayer
        key={day}
        exercises={plan.exercises}
        title={day === currentDay ? "Today's session" : `Day ${day}`}
        onExit={() => (window.history.length > 1 ? navigate(-1) : navigate("/app/home"))}
        onFinish={() => void finish()}
      />
      {saving ? <p role="status">Saving your day…</p> : null}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void finish()}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
