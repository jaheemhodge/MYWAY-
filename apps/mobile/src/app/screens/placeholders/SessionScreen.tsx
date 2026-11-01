import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { displayName } from "../../data/library";
import { usePageTitle } from "../../hooks";
import { useSession } from "../../state/useSession";

/**
 * PLACEHOLDER (unstyled) — /app/session/:day
 * Every piece of state and every action comes from useSession(day) (src/app/state/useSession.ts).
 * This component only renders what the hook returns and forwards clicks/keys to `actions`.
 */
export function SessionScreen({ day }: { day: number }) {
  const s = useSession(day);
  const [feeling, setFeeling] = useState<number | null>(null);
  usePageTitle(`Day ${day}`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => s.handleKeyDown(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.handleKeyDown]);

  if (s.status === "loading") return <p role="status">Loading your plan…</p>;
  if (s.status === "locked") return <Navigate to={`/app/session/${s.currentDay}`} replace />;
  if (s.status === "recheck-required" && s.recheckRoute) return <Navigate to={s.recheckRoute} replace />;

  const { exercise, timer, actions, plan } = s;
  const paused = s.status === "paused";
  const notStarted = s.status === "ready";
  const busy = s.status === "finishing";

  return (
    <main data-reduced-motion={s.reducedMotion || undefined}>
      <header>
        <h1>
          Day {day}
          {plan ? ` · ${plan.phaseName}` : ""}
          {s.isReplay ? " (replay)" : ""}
        </h1>
        <p>
          Exercise {s.index + 1} of {s.total}
        </p>
        <button type="button" onClick={actions.exit}>
          Exit (keeps your place)
        </button>
      </header>

      {exercise ? (
        <section aria-labelledby="session-exercise-name">
          <h2 id="session-exercise-name">{displayName(exercise)}</h2>
          {s.media.videoUrl ? (
            <video src={s.media.videoUrl} poster={s.media.imageUrl} muted loop playsInline autoPlay={!s.reducedMotion} controls />
          ) : s.media.imageUrl ? (
            <img src={s.media.imageUrl} alt="" />
          ) : null}
          <p>{exercise.setup}</p>
          <ul>
            {exercise.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {!s.readyToFinish ? (
        <section aria-live="polite">
          <p>
            Set {s.currentSet} of {s.totalSets}
            {s.repsTarget !== null ? ` · ${s.repsTarget} reps` : ""}
            {s.holdSeconds !== null ? ` · hold ${s.holdSeconds} s` : ""}
            {s.usedDefaults ? " (suggested)" : ""}
          </p>
          <p>
            {timer.mode === "rest" ? "Rest" : timer.mode === "hold" ? "Hold" : `Lift ${s.rhythm.liftSeconds} · hold ${s.rhythm.holdSeconds} · lower ${s.rhythm.lowerSeconds}`}
            {" — "}
            <output>{timer.secondsLeft}s</output>
            {paused ? " (paused)" : ""}
          </p>
        </section>
      ) : (
        <p role="status">All exercises done. Finish the day when you are ready.</p>
      )}

      <section aria-label="Controls">
        {notStarted ? (
          <button type="button" onClick={actions.start}>
            Start
          </button>
        ) : null}
        {s.status === "in-progress" && timer.running ? (
          <button type="button" onClick={actions.pause}>
            Pause
          </button>
        ) : null}
        {paused ? (
          <button type="button" onClick={actions.resume}>
            Resume
          </button>
        ) : null}
        {!notStarted && !s.readyToFinish && timer.mode !== "rest" ? (
          <button type="button" onClick={actions.markSetDone}>
            Set done
          </button>
        ) : null}
        {!notStarted && timer.mode === "rest" ? (
          <button type="button" onClick={actions.skipRest}>
            Skip rest
          </button>
        ) : null}
        {!notStarted && !s.readyToFinish ? (
          <>
            <button type="button" onClick={actions.next}>
              {s.isLast ? "Done with this exercise" : "Next exercise"}
            </button>
            <button type="button" onClick={actions.skipExercise}>
              Skip exercise
            </button>
            <button type="button" onClick={actions.restartExercise}>
              Restart exercise
            </button>
          </>
        ) : null}
        {!notStarted ? (
          <button type="button" onClick={actions.back}>
            Back
          </button>
        ) : null}
      </section>

      {s.readyToFinish ? (
        <section aria-label="Finish">
          <fieldset>
            <legend>How did that feel? (optional)</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n}>
                <input type="radio" name="feeling" value={n} checked={feeling === n} onChange={() => setFeeling(n)} />
                {n}
              </label>
            ))}
          </fieldset>
          <button type="button" disabled={busy} onClick={() => void actions.finishDay(feeling)}>
            {busy ? "Saving…" : s.status === "error" ? "Try again" : "Finish day"}
          </button>
        </section>
      ) : null}

      {s.error ? <p role="alert">{s.error}</p> : null}

      <footer>
        <label>
          <input type="checkbox" checked={s.cues.enabled} onChange={(e) => s.cues.setEnabled(e.target.checked)} />
          Sound / voice cues
        </label>
        {s.cues.last ? <p data-testid="last-cue">Last cue: {s.cues.last.type}</p> : null}
        <ul>
          {s.keyBindings.map((b) => (
            <li key={b.key}>{b.label}</li>
          ))}
        </ul>
        {s.exercisesDone.some(Boolean) ? (
          <ol aria-label="Progress">
            {s.exercisesDone.map((r, i) => (
              <li key={plan?.exercises[i]?.id ?? i}>
                {plan?.exercises[i] ? displayName(plan.exercises[i]) : i + 1}: {r ? `${r.status} (${r.setsDone} sets)` : i === s.index ? "current" : "pending"}
              </li>
            ))}
          </ol>
        ) : null}
        <Link to="/app/home">Home</Link>
      </footer>
    </main>
  );
}
