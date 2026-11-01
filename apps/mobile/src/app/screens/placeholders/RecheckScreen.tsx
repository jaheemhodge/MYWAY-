import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { RecheckKind } from "@/lib/unlock";
import { usePageTitle } from "../../hooks";
import { useProgress } from "../../state/ProgressProvider";

/**
 * PLACEHOLDER (unstyled) — /app/recheck/:kind  (kind = day30 | day60)
 * Hook API: useProgress() → { hasQuestionnaire(kind), saveQuestionnaire(kind, answers), isDayUnlocked(day) }.
 * `answers` is free-form JSON; the design decides the questions (same shape as the baseline is sensible).
 * After saving, go to /app/session/30 (or 60): the database only accepts that day once the re-check exists.
 */
const DAY_FOR_KIND: Record<RecheckKind, number> = { day30: 30, day60: 60 };

function isRecheckKind(value: string): value is RecheckKind {
  return value === "day30" || value === "day60";
}

export function RecheckScreen() {
  const { kind = "" } = useParams();
  const navigate = useNavigate();
  const { ready, hasQuestionnaire, saveQuestionnaire, isDayUnlocked, isDayCompleted } = useProgress();
  const [feeling, setFeeling] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  usePageTitle(kind === "day60" ? "Day 60 re-check" : "Day 30 re-check");

  if (!isRecheckKind(kind)) return <Navigate to="/app/home" replace />;
  if (!ready) return <p role="status">Loading…</p>;
  const day = DAY_FOR_KIND[kind];
  // Not there yet: the re-check only opens once the day before it is done.
  if (!isDayUnlocked(day)) return <Navigate to="/app/home" replace />;
  if (hasQuestionnaire(kind) || isDayCompleted(day)) return <Navigate to={`/app/session/${day}`} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveQuestionnaire(kind, { feeling: feeling ? Number(feeling) : null, notes: notes.trim() || null });
      navigate(`/app/session/${day}`, { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Day {day} re-check</h1>
      <p>A quick look at how things are going before today's session.</p>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>How do you feel moving around these days?</legend>
          {["1", "2", "3", "4", "5"].map((v) => (
            <label key={v}>
              <input type="radio" name="feeling" value={v} checked={feeling === v} onChange={() => setFeeling(v)} required />
              {v}
            </label>
          ))}
        </fieldset>
        <label>
          Anything you'd like to note? (optional)
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Save and start Day {day}
        </button>
      </form>
      {message ? <p role="alert">{message}</p> : null}
    </main>
  );
}
