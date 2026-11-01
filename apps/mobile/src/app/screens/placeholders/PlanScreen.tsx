import { Link } from "react-router-dom";
import { getAllDayPlans, PHASE_INFO } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useProfile } from "../../state/ProfileProvider";
import { useProgress } from "../../state/ProgressProvider";

/**
 * PLACEHOLDER (unstyled) — /app/plan
 * Hook API: useProfile().focusArea, useProgress() → { currentDay, isDayCompleted(day), isDayUnlocked(day) },
 * getAllDayPlans(focusArea) for the 60 entries (day, phase, phaseName, exercises, estimatedMinutes, isRecheckDay).
 */
export function PlanScreen() {
  usePageTitle("My plan");
  const { focusArea } = useProfile();
  const { currentDay, isDayCompleted, isDayUnlocked } = useProgress();
  const days = focusArea ? getAllDayPlans(focusArea) : [];

  return (
    <main>
      <h1>My plan</h1>
      <p>Day {currentDay} of 60</p>
      {([1, 2, 3] as const).map((phase) => (
        <section key={phase}>
          <h2>
            Phase {phase} · {PHASE_INFO[phase].name} · Days {PHASE_INFO[phase].startDay}–{PHASE_INFO[phase].endDay}
          </h2>
          <ol start={PHASE_INFO[phase].startDay}>
            {days
              .filter((d) => d.phase === phase)
              .map((d) => {
                const done = isDayCompleted(d.day);
                const open = isDayUnlocked(d.day);
                const state = done ? "done" : d.day === currentDay ? "today" : open ? "open" : "locked";
                return (
                  <li key={d.day} data-state={state}>
                    {open ? <Link to={`/app/session/${d.day}`}>Day {d.day}</Link> : <span>Day {d.day}</span>} · {d.exercises.length} exercises ·
                    about {d.estimatedMinutes} min{d.isRecheckDay ? " · re-check" : ""} · {state}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </main>
  );
}
