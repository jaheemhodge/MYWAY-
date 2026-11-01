import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { FocusArea } from "@/lib/database.types";
import { FOCUS_AREA_LABEL, FOCUS_AREAS } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { useProfile } from "../../state/ProfileProvider";
import { takeReturnTo } from "../../state/returnTo";

/**
 * PLACEHOLDER (unstyled) — /onboarding
 * Hook API: useProfile() → { profile, status, onboarded, saveOnboarding(answers, focusArea, { firstName?, ageRange? }) }.
 * `answers` is free-form JSON stored as the "baseline" questionnaire; the design decides the questions.
 * On success, navigate to takeReturnTo() (the page the user was heading to, or /app/home).
 */
const AGE_RANGES = ["Under 50", "50–59", "60–70", "Over 70"] as const;

export function OnboardingScreen() {
  usePageTitle("Set up your plan");
  const { user } = useAuth();
  const { profile, status, onboarded, saveOnboarding } = useProfile();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(profile?.firstName ?? (user?.user_metadata?.first_name as string | undefined) ?? "");
  const [ageRange, setAgeRange] = useState<string>(profile?.ageRange ?? "");
  const [goal, setGoal] = useState("");
  const [focusArea, setFocusArea] = useState<FocusArea | "">("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "idle" || status === "loading") return <p role="status">Loading…</p>;
  if (onboarded) return <Navigate to={takeReturnTo()} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!focusArea) {
      setMessage("Choose the one area you'd like to work on.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await saveOnboarding({ age_range: ageRange || null, goal: goal.trim() || null }, focusArea, { firstName, ageRange });
      navigate(takeReturnTo(), { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Set up your plan</h1>
      <form onSubmit={onSubmit}>
        <label>
          First name
          <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <fieldset>
          <legend>Your age</legend>
          {AGE_RANGES.map((range) => (
            <label key={range}>
              <input type="radio" name="ageRange" value={range} checked={ageRange === range} onChange={() => setAgeRange(range)} />
              {range}
            </label>
          ))}
        </fieldset>
        <label>
          What would you like to feel easier day to day? (optional)
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} />
        </label>
        <fieldset>
          <legend>Pick one focus area</legend>
          {FOCUS_AREAS.map((area) => (
            <label key={area}>
              <input type="radio" name="focusArea" value={area} checked={focusArea === area} onChange={() => setFocusArea(area)} required />
              {FOCUS_AREA_LABEL[area]}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={busy}>
          Start my 60 days
        </button>
      </form>
      {message ? <p role="alert">{message}</p> : null}
    </main>
  );
}
