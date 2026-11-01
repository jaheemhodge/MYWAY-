import { Link } from "react-router-dom";
import { TOTAL_DAYS } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useProfile } from "../../state/ProfileProvider";
import { useProgress } from "../../state/ProgressProvider";

/**
 * PLACEHOLDER (unstyled) — /app/progress
 * Hook API: useProgress() → { progress: { currentDay, completedDays, phase, phaseName, recheckDue, allDone },
 *   questionnaires: [{ kind, answers, created_at }], status, error }, useProfile().profile.planStartDate.
 * No streaks, calories or comparisons: just where the user is in the 60 days and their re-checks.
 */
export function ProgressScreen() {
  usePageTitle("Progress");
  const { profile } = useProfile();
  const { progress, questionnaires, status, error } = useProgress();

  if (status === "loading" || status === "idle") return <p role="status">Loading your progress…</p>;
  if (status === "error") return <p role="alert">{error}</p>;

  const baseline = questionnaires.find((q) => q.kind === "baseline");
  const day30 = questionnaires.find((q) => q.kind === "day30");
  const day60 = questionnaires.find((q) => q.kind === "day60");

  return (
    <main>
      <h1>Progress</h1>
      <p>
        Day {progress.currentDay} of {TOTAL_DAYS} · Phase {progress.phase} · {progress.phaseName}
      </p>
      <p>
        {progress.completedDays.length} of {TOTAL_DAYS} days done{profile?.planStartDate ? ` · started ${profile.planStartDate}` : ""}
      </p>
      {progress.recheckDue ? (
        <p>
          <Link to={`/app/recheck/${progress.recheckDue}`}>Do your {progress.recheckDue === "day30" ? "Day 30" : "Day 60"} re-check</Link>
        </p>
      ) : null}
      <h2>Re-checks</h2>
      <ul>
        <li>Start: {baseline ? `saved ${baseline.created_at}` : "not saved"}</li>
        <li>Day 30: {day30 ? `saved ${day30.created_at}` : "not yet"}</li>
        <li>Day 60: {day60 ? `saved ${day60.created_at}` : "not yet"}</li>
      </ul>
      {progress.allDone ? <p>You've finished all 60 days.</p> : null}
    </main>
  );
}
