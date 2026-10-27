import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChoiceButtons } from "./Choices";
import {
  SAFETY_CHOICES,
  SAFETY_QUESTIONS,
  emptySafetyAnswers,
  safetyOutcome,
  type SafetyAnswer,
  type SafetyAnswers,
} from "./model";
import { routes } from "./routes";
import { loadLandingAnswer, loadSafetyScreen, saveSafetyScreen } from "./storage";
import { usePageTitle } from "./WebLayout";

const TOTAL = SAFETY_QUESTIONS.length;

/** `?q=1…6` is the question on screen; no `q` is the short intro. Browser Back steps through them. */
function readStep(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL ? n : 0;
}

/**
 * The safety screen, one question per screen, in the same layout as the check-in.
 * Yes, or I’m not sure, on any question stops here and opens /safety/pause.
 * Six answers of No continue to the check-in.
 */
export function SafetyScreen() {
  usePageTitle("Safety check · Mobility");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const step = readStep(searchParams.get("q"));
  const [answers, setAnswers] = useState<SafetyAnswers>(() => loadSafetyScreen()?.answers ?? emptySafetyAnswers());
  const [carried] = useState(() => loadLandingAnswer());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const goTo = (next: number) => setSearchParams(next ? { q: String(next) } : {});

  const finish = (final: SafetyAnswers) => {
    const outcome = safetyOutcome(final);
    if (outcome === "incomplete") return;
    saveSafetyScreen({ schemaVersion: 1, answeredAt: new Date().toISOString(), answers: final, outcome });
    navigate(outcome === "continue" ? `${routes.checkIn}/intro` : routes.safetyPause);
  };

  if (step === 0) {
    return (
      <section className="web-flow">
        <div className="web-wrap web-flow-narrow">
          <p className="web-kicker">Before the check-in</p>
          <h1 ref={headingRef} tabIndex={-1}>
            A short safety screen.
          </h1>
          <p className="web-intro">
            Six questions, one at a time. Yes, or I’m not sure, means we stop and ask you to check with your doctor
            first.
          </p>
          <aside className="web-callout">
            <strong>This is not medical advice.</strong>
            <p>
              These questions do not diagnose you, clear you to exercise, or replace a clinician. Answering no is not a
              medical clearance. If you might be having an emergency, contact local emergency services. Mobility does
              not monitor emergencies.
            </p>
          </aside>
          {carried ? (
            <p className="web-carried">
              Your answer from the first page is saved. These safety questions come first, then the check-in
              continues without asking it again.
            </p>
          ) : null}
          <div className="web-actions">
            <button type="button" className="web-btn web-btn-primary" onClick={() => goTo(1)}>
              Start the safety questions
            </button>
            <button type="button" className="web-btn web-btn-secondary" onClick={() => navigate(routes.landing)}>
              Back to the start
            </button>
          </div>
        </div>
      </section>
    );
  }

  const question = SAFETY_QUESTIONS[step - 1];
  const answer = answers[question.id];
  const isLast = step === TOTAL;
  const stops = answer === "yes" || answer === "not_sure";

  const choose = (value: SafetyAnswer) => setAnswers((current) => ({ ...current, [question.id]: value }));

  const next = () => {
    if (!answer) return;
    if (stops || isLast) finish(answers);
    else goTo(step + 1);
  };

  return (
    <section className="web-flow">
      <div className="web-wrap web-flow-narrow">
        <p className="web-kicker">Safety screen</p>
        <div
          className="web-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step}
          aria-valuetext={`Question ${step} of ${TOTAL}`}
        >
          <span style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
        <p className="web-step-count">
          Question {step} of {TOTAL}
        </p>
        <h1 id="safety-question" ref={headingRef} tabIndex={-1}>
          {question.prompt}
        </h1>
        <p className="web-intro">{question.help}</p>
        <ChoiceButtons
          legendId="safety-question"
          options={SAFETY_CHOICES}
          selected={answer}
          onSelect={(id) => choose(id as SafetyAnswer)}
        />
        <p className="web-hint" aria-live="polite">
          {!answer
            ? "Choose an answer to continue."
            : stops
              ? "We’ll stop here and show you what to do next."
              : ""}
        </p>
        <div className="web-actions">
          <button type="button" className="web-btn web-btn-primary" disabled={!answer} onClick={next}>
            {stops ? "See what to do next" : isLast ? "Continue to the check-in" : "Continue"}
          </button>
          <button type="button" className="web-btn web-btn-secondary" onClick={() => goTo(step - 1)}>
            Back
          </button>
        </div>
        <p className="web-fine">Not a diagnosis. Not medical advice. Not a medical clearance.</p>
      </div>
    </section>
  );
}
