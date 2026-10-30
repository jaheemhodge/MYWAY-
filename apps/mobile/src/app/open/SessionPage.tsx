import { useNavigate, useParams } from "react-router-dom";
import { SessionPlayer } from "../components/SessionPlayer";
import { getExercise } from "../data/library";
import { getSession } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";

/** Session player route: /app/session (today's session) or /app/session/:id (one exercise). */
export function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentDay, markFinished } = useDay();
  const single = id ? getExercise(id.toUpperCase()) : undefined;
  const exercises = single ? [single] : getSession(currentDay);
  usePageTitle(single ? single.name : "Today's session");
  return (
    <div className="o-wrap o-session">
      <SessionPlayer
        exercises={exercises}
        title={single ? single.name : "Today's session"}
        onExit={() => (window.history.length > 1 ? navigate(-1) : navigate("/app/home"))}
        onFinish={() => {
          if (!single) markFinished(currentDay);
        }}
      />
    </div>
  );
}
