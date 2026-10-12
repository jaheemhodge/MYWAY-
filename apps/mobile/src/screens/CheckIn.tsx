import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, ChoiceRow, Field } from "../components/ui/Primitives";
import { evaluateCheckIn } from "../lib/safety";
import { completeSession, useApp } from "../store/AppState";

export function CheckIn() {
  const { day = "1" } = useParams();
  const dayNum = Number(day);
  const { state, dispatch, plan } = useApp();
  const session = plan.find((item) => item.day === dayNum);
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<"too_easy" | "comfortable" | "too_difficult">("comfortable");
  const [compared, setCompared] = useState<"better" | "same" | "worse">("same");
  const [notes, setNotes] = useState("");
  const [concerning, setConcerning] = useState(false);

  const evaluation = evaluateCheckIn({
    difficulty,
    comparedWithBefore: compared,
    newOrConcerningSymptoms: concerning,
  });

  const nextCopy = () => {
    if (evaluation.action === "pause_and_seek_assessment" || evaluation.action === "hold_no_progression_review_symptoms") {
      return "We'll pause the next session so you can decide whether to check in with a clinician.";
    }
    if (evaluation.action === "consider_easier_candidate_after_review") {
      return "We'll keep things gentle. Nothing gets harder automatically.";
    }
    if (evaluation.action === "eligible_for_review_of_next_level_not_auto_progress") {
      return "You may be ready for a reviewer to consider the next level. The app will not advance it on its own.";
    }
    return "You'll stay at this level for now. It's working well for you.";
  };

  return (
    <section className="screen lavender">
      <p className="muted">{session?.title ?? "Session"}, done</p>
      <h1 className="display">How did that feel?</h1>
      <p className="lede">
        Two quick questions{state.profile?.firstName ? `, ${state.profile.firstName}` : ""}. There are no right answers.
      </p>
      <h2>How difficult was today's session?</h2>
      <div className="triple">
        {[
          ["too_easy", "Too easy"],
          ["comfortable", "Comfortable"],
          ["too_difficult", "Too difficult"],
        ].map(([id, label]) => (
          <button key={id} className={`choice ${difficulty === id ? "is-dark" : ""}`} onClick={() => setDifficulty(id as typeof difficulty)}>
            {label}
          </button>
        ))}
      </div>
      <h2>How do you feel compared with before?</h2>
      <div className="triple">
        {[
          ["better", "Better"],
          ["same", "About the same"],
          ["worse", "Worse"],
        ].map(([id, label]) => (
          <button key={id} className={`choice ${compared === id ? "is-dark" : ""}`} onClick={() => setCompared(id as typeof compared)}>
            {label}
          </button>
        ))}
      </div>
      <ChoiceRow selected={concerning} onClick={() => setConcerning((value) => !value)} multi>
        I noticed new or concerning symptoms
      </ChoiceRow>
      <Field label="Optional notes">
        <textarea className="text-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
      <div className="card">
        <strong>What happens next</strong>
        <p>{nextCopy()}</p>
        <p className="muted">Your answers guide the next appropriate step, within the program's reviewed rules.</p>
      </div>
      <Button
        onClick={() => {
          completeSession(dispatch, state, dayNum, {
            difficulty,
            comparedWithBefore: compared,
            notes,
            newOrConcerningSymptoms: concerning,
          });
          if (evaluation.blockNextSession) {
            navigate("/hold");
            return;
          }
          if (dayNum === 14 && !state.seenMilestones.includes("foundation")) {
            dispatch({ type: "SEEN_MILESTONE", id: "foundation" });
            navigate("/milestone/foundation");
            return;
          }
          navigate("/app/home");
        }}
      >
        Save and continue
      </Button>
    </section>
  );
}
