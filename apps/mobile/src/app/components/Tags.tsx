import { POSITION_LABEL, type Exercise } from "../data/library";
import { PHASE_INFO, opensOnDay } from "../data/plan";

export function Tag({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brass" | "forest" }) {
  return <span className={`mob-tag mob-tag--${tone}`}>{children}</span>;
}

/** Position and phase tags, plus the Brass "Opens Day N" tag for a later phase. */
export function ExerciseTags({
  exercise,
  currentDay,
  showPhase = true,
}: {
  exercise: Exercise;
  currentDay: number;
  showPhase?: boolean;
}) {
  const opens = opensOnDay(exercise.phase, currentDay);
  const phase = PHASE_INFO[exercise.phase];
  return (
    <ul className="mob-tags" aria-label="Details">
      <li>
        <Tag>{POSITION_LABEL[exercise.position]}</Tag>
      </li>
      {showPhase ? (
        <li>
          <Tag>
            Phase {phase.number} · {phase.name}
          </Tag>
        </li>
      ) : null}
      {opens ? (
        <li>
          <Tag tone="brass">Opens Day {opens}</Tag>
        </li>
      ) : null}
    </ul>
  );
}
