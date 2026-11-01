import { Navigate, useNavigate, useParams } from "react-router-dom";
import { SessionPlayer } from "../components/SessionPlayer";
import { getExercise } from "../data/library";
import { usePageTitle } from "../hooks";
import { SessionScreen } from "../screens/placeholders/SessionScreen";
import { useProgress } from "../state/ProgressProvider";

/**
 * Session player route.
 *   /app/session            → today's session (redirects to /app/session/:currentDay)
 *   /app/session/:day       → that day's session, driven by useSession(day) (placeholder screen;
 *                             locked days redirect to the current day, Day 30/60 go to the re-check)
 *   /app/session/:exerciseId → one exercise in the legacy player, no completion recorded
 */
export function SessionPage() {
  const { id } = useParams();
  const { currentDay, ready } = useProgress();

  if (!id && !ready) return <p role="status">Loading your plan…</p>;
  if (!id) return <Navigate to={`/app/session/${currentDay}`} replace />;
  if (/^\d+$/.test(id)) return <SessionScreen key={id} day={Number(id)} />;

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
