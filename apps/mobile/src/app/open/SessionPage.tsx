import { Navigate, useParams } from "react-router-dom";
import { PaywallScreen } from "../screens/placeholders/PaywallScreen";
import { SessionScreen } from "../screens/placeholders/SessionScreen";
import { useProgress } from "../state/ProgressProvider";

/**
 * Session player route.
 *   /app/session        → today's session (redirects to /app/session/:currentDay)
 *   /app/session/:day   → that day's session, driven by useSession(day) (placeholder screen;
 *                         locked days redirect to the current day, Day 30/60 go to the re-check)
 * Anything that is not a day number goes to the current day.
 *
 * Days past the free beta render the paywall instead of the player. complete_day() is the real
 * gate (it raises PAYWALL). Files in public/ — coach stills and the Day 1 clips — are not protected.
 */
export function SessionPage() {
  const { day } = useParams();
  const { currentDay, ready, isDayPaywalled } = useProgress();

  if (day && /^\d+$/.test(day)) {
    const n = Number(day);
    if (!ready) return <p role="status">Loading your plan…</p>;
    if (isDayPaywalled(n)) return <PaywallScreen day={n} />;
    return <SessionScreen key={day} day={n} />;
  }
  if (!ready) return <p role="status">Loading your plan…</p>;
  return <Navigate to={`/app/session/${currentDay}`} replace />;
}
