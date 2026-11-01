import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { RecheckKind } from "@/lib/unlock";
import { usePageTitle } from "../../hooks";
import { useProgress } from "../../state/ProgressProvider";
import { COMPARED, DAY_TO_DAY, EASIER } from "./questions";
import { Choices, Message, PageState, StepProgress, type Notice } from "./ui";

/**
 * /app/recheck/:kind (day30 | day60) — the onboarding question style, framed as
 * "Let's see how you're feeling." Answers use the baseline's keys (./questions.ts) plus `compared`.
 * Hook API: useProgress() → { hasQuestionnaire(kind), saveQuestionnaire(kind, answers), isDayUnlocked(day) }.
 * After saving → /app/session/30 (or 60); the database only accepts that day once the re-check exists.
 */
const DAY_FOR_KIND: Record<RecheckKind, number> = { day30: 30, day60: 60 };

function isRecheckKind(value: string): value is RecheckKind {
  return value === "day30" || value === "day60";
}

type Step = "feel" | "compared" | "easier";
const STEPS: Step[] = ["feel", "compared", "easier"];

export function RecheckScreen() {
  const { kind = "" } = useParams();
  const navigate = useNavigate();
  const { ready, status, error, refresh, hasQuestionnaire, saveQuestionnaire, isDayUnlocked, isDayCompleted } = useProgress();
  const [feel, setFeel] = useState("");
  const [compared, setCompared] = useState("");
  const [easier, setEasier] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  usePageTitle(kind === "day60" ? "Day 60 re-check" : "Day 30 re-check");

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  if (!isRecheckKind(kind)) return <Navigate to="/app/home" replace />;
  if (status === "error") {
    return (
      <PageState
        kind="error"
        title="We couldn't load your progress"
        action={
          <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
            Try again
          </button>
        }
      >
        {error ?? "Please check your connection and try again."}
      </PageState>
    );
  }
  if (!ready) return <PageState kind="loading" title="Loading your re-check…" />;
  const day = DAY_FOR_KIND[kind];
  // Not there yet: the re-check only opens once the day before it is done.
  if (!isDayUnlocked(day)) return <Navigate to="/app/home" replace />;
  if (hasQuestionnaire(kind) || isDayCompleted(day)) return <Navigate to={`/app/session/${day}`} replace />;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const onNext = async (e: FormEvent) => {
    e.preventDefault();
    if ((step === "feel" && !feel) || (step === "compared" && !compared)) {
      setNotice({ tone: "error", text: "Choose the answer that fits best." });
      return;
    }
    setNotice(null);
    if (!last) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    try {
      await saveQuestionnaire(kind, { day_to_day: feel, compared, easier });
      navigate(`/app/session/${day}`, { replace: true });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "We couldn't save that. Please try again." });
      setBusy(false);
    }
  };

  const title: Record<Step, string> = {
    feel: "How does your body feel day to day?",
    compared: "Compared with when you started, how do everyday movements feel?",
    easier: "What would you still like to do more easily?",
  };
  const help: Record<Step, string> = {
    feel: "The same question you answered on Day 1, so you can see the difference.",
    compared: "Think about the stairs, getting up, bending down.",
    easier: "Choose any that apply, or skip this one.",
  };

  return (
    <div className="o-wrap c-page">
      <form className="c-quiz" onSubmit={onNext} aria-labelledby="q-title">
        <div className="c-head" style={{ marginBottom: 0 }}>
          <p className="c-small">Day {day} re-check</p>
          <p className="c-head__title" style={{ fontSize: "2rem" }}>
            Let's see how you're feeling.
          </p>
          <p className="c-line">Three short questions before today's session. Your answers sit next to your Day 1 answers on Progress.</p>
        </div>

        <StepProgress step={index + 1} total={STEPS.length} />

        <fieldset aria-labelledby="q-title" aria-describedby="q-help">
          <h1 id="q-title" ref={headingRef} tabIndex={-1} className="c-quiz__q">
            {title[step]}
          </h1>
          <p id="q-help" className="c-line c-quiz__help">
            {help[step]}
          </p>
          {step === "feel" ? <Choices name="feel" options={DAY_TO_DAY} value={feel} onChange={(v) => setFeel(v as string)} /> : null}
          {step === "compared" ? <Choices name="compared" options={COMPARED} value={compared} onChange={(v) => setCompared(v as string)} /> : null}
          {step === "easier" ? <Choices name="easier" options={EASIER} value={easier} onChange={(v) => setEasier(v as string[])} multiple columns={2} /> : null}
        </fieldset>

        <Message notice={notice} />

        <div className="c-quiz__nav">
          {index > 0 ? (
            <button type="button" className="o-pill o-pill--outline" disabled={busy} onClick={() => setIndex(index - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy} aria-busy={busy}>
            {last ? (busy ? "Saving…" : `Save and start Day ${day}`) : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
