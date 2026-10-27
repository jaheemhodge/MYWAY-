import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChoiceButtons } from "./Choices";
import {
  ACTIVITY_OPTIONS,
  CHECKIN_STEPS,
  COMFORT_OPTIONS,
  CONFIDENCE_OPTIONS,
  EQUIPMENT_OPTIONS,
  GOAL_OPTIONS,
  TIME_OPTIONS,
  adjacentStep,
  checkInStep,
  continueHint,
  continueLabel,
  createMovementCheckIn,
  isStepComplete,
  parseOccasion,
  toggleSelection,
  type ConfidenceAnswer,
  type EquipmentId,
  type GoalId,
  type MovementCheckInRecord,
} from "./model";
import { checkInPath, routes } from "./routes";
import { loadMovementCheckIn, saveMovementCheckIn, safetyAllowsCheckIn, submitMovementCheckIn } from "./storage";

export function MovementCheckIn() {
  const [searchParams] = useSearchParams();
  const occasion = parseOccasion(searchParams.get("occasion")) ?? "baseline";
  if (!safetyAllowsCheckIn()) return <Navigate to={routes.safety} replace />;
  return <MovementCheckInFlow key={occasion} occasion={occasion} />;
}

function MovementCheckInFlow({ occasion }: { occasion: NonNullable<ReturnType<typeof parseOccasion>> }) {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const step = checkInStep(stepId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [record, setRecord] = useState<MovementCheckInRecord>(
    () => loadMovementCheckIn(occasion) ?? createMovementCheckIn(occasion),
  );
  const [storageNote, setStorageNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Free movement check-in · Mobility";
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepId]);

  if (!step) return <Navigate to={checkInPath("intro", occasion)} replace />;

  const index = CHECKIN_STEPS.findIndex((item) => item.id === step.id);
  const ready = isStepComplete(record, step);
  const hint = continueHint(step, ready);

  const persist = (next: MovementCheckInRecord) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    const saved = saveMovementCheckIn(stamped);
    setRecord(stamped);
    setStorageNote(saved ? "" : "We couldn’t store this on the device. You can continue, but a refresh may clear it.");
    return stamped;
  };

  const goNext = async () => {
    if (!ready || saving) return;
    const nextStep = adjacentStep(step.id, 1);
    if (!nextStep) {
      setSaving(true);
      const completed = persist({ ...record, completedAt: new Date().toISOString() });
      await submitMovementCheckIn(completed);
      navigate(routes.plan, { state: { checkIn: completed } });
      return;
    }
    persist(record.startedAt ? record : createMovementCheckIn(occasion));
    navigate(checkInPath(nextStep.id, occasion));
  };

  const goBack = () => {
    const previous = adjacentStep(step.id, -1);
    navigate(previous ? checkInPath(previous.id, occasion) : routes.safety);
  };

  return (
    <section className="web-flow">
      <div className="web-wrap web-flow-narrow">
        <p className="web-kicker">Free movement check-in</p>
        <div
          className="web-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={CHECKIN_STEPS.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Step ${index + 1} of ${CHECKIN_STEPS.length}`}
        >
          <span style={{ width: `${((index + 1) / CHECKIN_STEPS.length) * 100}%` }} />
        </div>
        <p className="web-step-count">
          Step {index + 1} of {CHECKIN_STEPS.length}
        </p>
        <h1 id="checkin-question" ref={headingRef} tabIndex={-1}>
          {step.title}
        </h1>
        {step.kind === "intro" ? (
          <div className="web-prose-stack">
            {step.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="web-intro">{step.help}</p>
        )}
        {step.kind === "confidence" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={CONFIDENCE_OPTIONS}
            selected={record.confidence[step.id]}
            onSelect={(id) =>
              persist({
                ...record,
                confidence: { ...record.confidence, [step.id]: id as ConfidenceAnswer },
              })
            }
          />
        ) : null}
        {step.kind === "comfort" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={COMFORT_OPTIONS}
            selected={record.comfortToday}
            onSelect={(id) => persist({ ...record, comfortToday: id as MovementCheckInRecord["comfortToday"] })}
          />
        ) : null}
        {step.kind === "activity" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={ACTIVITY_OPTIONS}
            selected={record.activityLevel}
            onSelect={(id) => persist({ ...record, activityLevel: id as MovementCheckInRecord["activityLevel"] })}
          />
        ) : null}
        {step.kind === "goals" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={GOAL_OPTIONS}
            selected={record.goals}
            multi
            onSelect={(id) => persist({ ...record, goals: toggleSelection(record.goals, id as GoalId) })}
          />
        ) : null}
        {step.kind === "equipment" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={EQUIPMENT_OPTIONS}
            selected={record.equipment}
            multi
            onSelect={(id) =>
              persist({
                ...record,
                equipment: toggleSelection(record.equipment, id as EquipmentId, "none_yet"),
              })
            }
          />
        ) : null}
        {step.kind === "time" ? (
          <ChoiceButtons
            legendId="checkin-question"
            options={TIME_OPTIONS}
            selected={record.sessionMinutes}
            onSelect={(id) => persist({ ...record, sessionMinutes: id as MovementCheckInRecord["sessionMinutes"] })}
          />
        ) : null}
        {storageNote ? <p className="web-hint">{storageNote}</p> : null}
        <p className="web-hint" aria-live="polite">
          {hint}
        </p>
        <div className="web-actions">
          <button type="button" className="web-btn web-btn-primary" disabled={!ready || saving} onClick={() => void goNext()}>
            {saving ? "Saving…" : continueLabel(step)}
          </button>
          <button type="button" className="web-btn web-btn-secondary" onClick={goBack}>
            Back
          </button>
        </div>
        <p className="web-fine">
          Not a diagnosis. Not medical advice. Your answers are not compared with a normal range.
        </p>
      </div>
    </section>
  );
}
