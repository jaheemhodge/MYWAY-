import { Navigate, useParams } from "react-router-dom";
import { SessionScreen } from "../screens/placeholders/SessionScreen";
import { useProgress } from "../state/ProgressProvider";

/**
 * Session player route.
 *   /app/session        → today's session (redirects to /app/session/:currentDay)
 *   /app/session/:day   → that day's session, driven by useSession(day) (placeholder screen;
 *                         locked days redirect to the current day, Day 30/60 go to the re-check)
 * Anything that is not a day number goes to the current day.
 */
export function SessionPage() {
  const { day } = useParams();
  const { currentDay, ready } = useProgress();

  if (day && /^\d+$/.test(day)) return <SessionScreen key={day} day={Number(day)} />;
  if (!ready) return <p role="status">Loading your plan…</p>;
  return <Navigate to={`/app/session/${currentDay}`} replace />;
}
