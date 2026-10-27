import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { loadSafetyScreen, saveSafetyScreen } from "./storage";
import { usePageTitle } from "./WebLayout";

export function SafetyScreen() {
  usePageTitle("Safety check · Mobility");
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<SafetyAnswers>(() => loadSafetyScreen()?.answers ?? emptySafetyAnswers());
  const outcome = safetyOutcome(answers);

  const choose = (id: keyof SafetyAnswers, value: SafetyAnswer) => {
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const submit = () => {
    if (outcome === "incomplete") return;
    saveSafetyScreen({
      schemaVersion: 1,
      answeredAt: new Date().toISOString(),
      answers,
      outcome,
    });
    navigate(outcome === "continue" ? `${routes.checkIn}/intro` : routes.safetyPause);
  };

  return (
    <section className="web-flow">
      <div className="web-wrap web-flow-narrow">
        <p className="web-kicker">Before the check-in</p>
        <h1>A short safety screen.</h1>
        <p className="web-intro">
          Six questions. Answer each one. Yes, or I’m not sure, means we stop here and ask you to check with
          your doctor first.
        </p>
        <aside className="web-callout">
          <strong>This is not medical advice.</strong>
          <p>
            These questions do not diagnose you, clear you to exercise, or replace a clinician. Answering no is
            not a medical clearance. If you might be having an emergency, contact local emergency services.
            Mobility does not monitor emergencies.
          </p>
        </aside>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {SAFETY_QUESTIONS.map((question) => (
            <fieldset key={question.id} className="web-q">
              <legend id={`safety-${question.id}`}>{question.prompt}</legend>
              <p>{question.help}</p>
              <ChoiceButtons
                legendId={`safety-${question.id}`}
                options={SAFETY_CHOICES}
                selected={answers[question.id]}
                onSelect={(id) => choose(question.id, id as SafetyAnswer)}
              />
            </fieldset>
          ))}
          <p className="web-hint" aria-live="polite">
            {outcome === "incomplete" ? "Answer each question to continue." : ""}
          </p>
          <div className="web-actions">
            <button type="submit" className="web-btn web-btn-primary" disabled={outcome === "incomplete"}>
              {outcome === "pause" ? "See what to do next" : "Continue to the check-in"}
            </button>
            <button type="button" className="web-btn web-btn-secondary" onClick={() => navigate(routes.landing)}>
              Back to the start
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
