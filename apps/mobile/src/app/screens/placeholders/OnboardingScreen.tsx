import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { FocusArea } from "@/lib/database.types";
import { FOCUS_AREA_LABEL, FOCUS_AREAS, toLibraryArea } from "@/lib/plan";
import { Icon } from "../../components/Icon";
import { imageFor } from "../../data/images";
import { getExercise } from "../../data/library";
import { usePageTitle } from "../../hooks";
import { COLLECTION_LINE } from "../../open/data";
import { useAuth } from "../../state/AuthProvider";
import { peekFocusIntent, takeFocusIntent } from "../../state/focusIntent";
import { useProfile } from "../../state/ProfileProvider";
import { takeReturnTo } from "../../state/returnTo";
import { AGE_RANGES, DAY_TO_DAY, EASIER } from "./questions";
import { Choices, Field, Frame, Message, StateBlock, StepProgress, type Notice } from "./ui";

/**
 * /onboarding — one question per screen, big tap choices, then the focus-area picker.
 * Hook API: useProfile() → { profile, status, onboarded, saveOnboarding(answers, focusArea, { firstName?, ageRange? }) }.
 * Answers are saved as the "baseline" questionnaire (shape in ./questions.ts) so Progress can compare
 * them with the Day 30 and Day 60 re-checks. Afterwards → takeReturnTo() (intended page or /app/home).
 */

/** Each area's card uses a real photo of one of its own exercises. */
const AREA_PHOTO: Record<FocusArea, string> = {
  knees: "K04", // Sit to stand from a chair
  lower_back: "G01", // Clamshell
  hips_balance: "K07", // Heel raises
};
const AREA_ICON: Record<FocusArea, "knee" | "back" | "balance"> = { knees: "knee", lower_back: "back", hips_balance: "balance" };

type Step = "name" | "feel" | "age" | "easier" | "area";

export function OnboardingScreen() {
  usePageTitle("Set up your plan");
  const { user } = useAuth();
  const { profile, status, error, onboarded, saveOnboarding, refresh } = useProfile();
  const navigate = useNavigate();
  const knownName = profile?.firstName ?? (user?.user_metadata?.first_name as string | undefined) ?? "";
  const [firstName, setFirstName] = useState(knownName);
  const [askName] = useState(() => !knownName.trim());
  const [feel, setFeel] = useState("");
  const [ageRange, setAgeRange] = useState<string>(profile?.ageRange ?? "");
  const [easier, setEasier] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState<FocusArea | "">(() => peekFocusIntent() ?? "");
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const steps: Step[] = [...(askName ? (["name"] as Step[]) : []), "feel", "age", "easier", "area"];
  const step = steps[index];

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo?.(0, 0);
  }, [index]);

  if (status === "idle" || status === "loading") {
    return (
      <Frame>
        <StateBlock kind="loading" title="Getting things ready…" />
      </Frame>
    );
  }
  if (status === "error") {
    return (
      <Frame>
        <StateBlock
          kind="error"
          title="We couldn't load your details"
          action={
            <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
              Try again
            </button>
          }
        >
          {error ?? "Please check your connection and try again."}
        </StateBlock>
      </Frame>
    );
  }
  if (onboarded) return <Navigate to={takeReturnTo()} replace />;

  const answered = (s: Step) =>
    s === "name" ? firstName.trim().length > 0 : s === "feel" ? !!feel : s === "age" ? !!ageRange : s === "easier" ? true : !!focusArea;

  const NEED: Record<Step, string> = {
    name: "Please tell us your first name.",
    feel: "Choose the answer that fits best.",
    age: "Choose your age range.",
    easier: "",
    area: "Choose the one area you'd like to work on.",
  };

  const onNext = async (e: FormEvent) => {
    e.preventDefault();
    if (!answered(step)) {
      setNotice({ tone: "error", text: NEED[step] });
      return;
    }
    setNotice(null);
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    try {
      await saveOnboarding({ day_to_day: feel, age_range: ageRange, easier }, focusArea as FocusArea, {
        firstName: firstName.trim() || undefined,
        ageRange,
      });
      takeFocusIntent();
      navigate(takeReturnTo(), { replace: true });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "We couldn't save that. Please try again." });
      setBusy(false);
    }
  };

  const back = () => {
    setNotice(null);
    setIndex((i) => Math.max(0, i - 1));
  };

  const name = firstName.trim();
  const title: Record<Step, string> = {
    name: "What should we call you?",
    feel: name ? `${name}, how does your body feel day to day?` : "How does your body feel day to day?",
    age: "What's your age range?",
    easier: "What would you like to do more easily?",
    area: "Which area would you like to work on?",
  };
  const help: Record<Step, string> = {
    name: "Just your first name is fine.",
    feel: "There's no right answer. This is where you're starting from.",
    age: "It helps us keep the pace right for you.",
    easier: "Choose any that apply, or skip this one.",
    area: "Your 60-day plan is built around one area. You'll still see the whole library.",
  };

  return (
    <Frame aside={<p className="c-small">Setting up your plan</p>}>
      <form className={`c-quiz${step === "area" ? " c-quiz--wide" : ""}`} onSubmit={onNext} aria-labelledby="q-title">
        <StepProgress step={index + 1} total={steps.length} />

        <fieldset aria-labelledby="q-title" aria-describedby="q-help">
          <h1 id="q-title" ref={headingRef} tabIndex={-1} className="c-quiz__q">
            {title[step]}
          </h1>
          <p id="q-help" className="c-line c-quiz__help">
            {help[step]}
          </p>

          {step === "name" ? (
            <div style={{ maxWidth: 480 }}>
              <Field label="First name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          ) : null}
          {step === "feel" ? <Choices name="feel" options={DAY_TO_DAY} value={feel} onChange={(v) => setFeel(v as string)} /> : null}
          {step === "age" ? <Choices name="ageRange" options={AGE_RANGES} value={ageRange} onChange={(v) => setAgeRange(v as string)} columns={2} /> : null}
          {step === "easier" ? <Choices name="easier" options={EASIER} value={easier} onChange={(v) => setEasier(v as string[])} multiple columns={2} /> : null}
          {step === "area" ? <AreaCards value={focusArea} onChange={setFocusArea} /> : null}
        </fieldset>

        <Message notice={notice} />

        <div className="c-quiz__nav">
          {index > 0 ? (
            <button type="button" className="o-pill o-pill--outline" onClick={back} disabled={busy}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy} aria-busy={busy}>
            {step === "area" ? (busy ? "Saving your plan…" : "Start my 60 days") : step === "easier" && easier.length === 0 ? "Skip for now" : "Continue"}
          </button>
        </div>
      </form>
    </Frame>
  );
}

function AreaCards({ value, onChange }: { value: FocusArea | ""; onChange: (a: FocusArea) => void }) {
  return (
    <div className="c-areas">
      {FOCUS_AREAS.map((area) => {
        const exercise = getExercise(AREA_PHOTO[area]);
        const src = exercise ? imageFor(exercise) : undefined;
        return (
          <label key={area} className="c-area c-glass">
            <input
              type="radio"
              name="focusArea"
              value={area}
              checked={value === area}
              onChange={() => onChange(area)}
              aria-labelledby={`area-${area}`}
              aria-describedby={`area-${area}-line`}
            />
            <span className="c-area__media" style={src ? undefined : { backgroundColor: "#DCE3E8" }}>
              {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <Icon name={AREA_ICON[area]} size={56} />}
            </span>
            <span className="c-area__text">
              <span className="c-area__name">
                <span id={`area-${area}`}>{FOCUS_AREA_LABEL[area]}</span>
                <span className="c-choice__mark" aria-hidden="true">
                  <Icon name="check" size={18} />
                </span>
              </span>
              <span id={`area-${area}-line`} className="c-small">{COLLECTION_LINE[toLibraryArea(area)]}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
