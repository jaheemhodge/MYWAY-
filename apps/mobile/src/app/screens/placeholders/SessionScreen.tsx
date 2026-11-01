import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { displayName } from "../../data/library";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { cleanCopyList } from "../../open/copy";
import { toneFor } from "../../open/data";
import { useSession, type UseSessionResult } from "../../state/useSession";
import "./session.css";

/**
 * /app/session/:day — the day's guided session, full screen.
 * Every piece of state and every action comes from useSession(day) (src/app/state/useSession.ts).
 * SessionScreen wires the hook and the keyboard; SessionView only renders what the hook returns
 * and forwards clicks to `actions`. The look reuses the exercise panel: the same light sheet,
 * type, outlined pills, black Start pill and "Stop if this causes pain" block.
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

  return <SessionView s={s} feeling={feeling} onFeeling={setFeeling} />;
}

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

export function SessionView({
  s,
  feeling,
  onFeeling,
}: {
  s: UseSessionResult;
  feeling: number | null;
  onFeeling: (n: number) => void;
}) {
  const day = s.day;

  if (s.status === "loading") {
    return (
      <div className="sp sp--quiet" aria-busy="true">
        <div className="sp-sheet sp-sheet--center">
          <div className="sp-skel sp-skel--title" />
          <div className="sp-skel sp-skel--stage" />
          <p className="sp-quiet__line" role="status">
            Loading your plan…
          </p>
        </div>
      </div>
    );
  }

  if (s.status === "locked") {
    return (
      <div className="sp sp--quiet">
        <div className="sp-sheet sp-sheet--center">
          <span className="sp-quiet__icon" aria-hidden="true">
            <Icon name="lock" size={28} />
          </span>
          <h1 className="sp-quiet__title">Day {day} isn't open yet</h1>
          <p className="sp-quiet__line" role="status">
            Taking you to Day {s.currentDay}, your next session.
          </p>
        </div>
        <Navigate to={`/app/session/${s.currentDay}`} replace />
      </div>
    );
  }

  if (s.status === "recheck-required" && s.recheckRoute) {
    return (
      <div className="sp sp--quiet">
        <div className="sp-sheet sp-sheet--center">
          <span className="sp-quiet__icon" aria-hidden="true">
            <Icon name="check" size={28} />
          </span>
          <h1 className="sp-quiet__title">A quick check-in first</h1>
          <p className="sp-quiet__line" role="status">
            Day {day} starts with two short questions about how you're moving.
          </p>
        </div>
        <Navigate to={s.recheckRoute} replace />
      </div>
    );
  }

  const { exercise, timer, actions, plan } = s;
  const paused = s.status === "paused";
  const notStarted = s.status === "ready";
  const busy = s.status === "finishing";
  const failed = s.status === "error";
  const resting = timer.mode === "rest";
  const betweenExercises = timer.segment === "rest-exercise";
  const nextUp = betweenExercises ? plan?.exercises[s.index + 1] : undefined;
  const doneCount = s.exercisesDone.filter(Boolean).length;

  const timerLabel = betweenExercises ? "Next up" : resting ? "Rest" : "Your set";
  const fraction = timer.totalSeconds > 0 ? Math.min(1, Math.max(0, timer.secondsLeft / timer.totalSeconds)) : 1;

  const doseLine = [
    `Set ${s.currentSet} of ${s.totalSets}`,
    s.repsTarget !== null ? `${s.repsTarget} reps` : null,
    s.holdSeconds !== null ? `hold ${s.holdSeconds} s` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const steps = exercise ? cleanCopyList([exercise.setup, ...exercise.cues]) : [];
  const safety = exercise ? cleanCopyList(exercise.safetyNotes) : [];
  const stageImage = s.media.imageUrl;

  return (
    <div className="sp" data-reduced-motion={s.reducedMotion || undefined} data-state={s.status}>
      <div className="sp-sheet">
        {/* ---------- Top bar ---------- */}
        <header className="sp-top">
          <div className="sp-top__titles">
            <h1 className="sp-top__day">
              Day {day}
              {plan ? ` · ${plan.phaseName}` : ""}
              {s.isReplay ? " (replay)" : ""}
            </h1>
            <p className="sp-top__count">
              Exercise {Math.min(s.index + 1, s.total)} of {s.total}
            </p>
          </div>
          <ol className="sp-steps" aria-label={`${doneCount} of ${s.total} exercises done`}>
            {Array.from({ length: s.total }, (_, i) => {
              const rec = s.exercisesDone[i];
              const state = rec ? (rec.status === "skipped" ? "is-skipped" : "is-done") : i === s.index && !s.readyToFinish ? "is-current" : "";
              const name = plan?.exercises[i] ? displayName(plan.exercises[i]) : `Exercise ${i + 1}`;
              return (
                <li key={plan?.exercises[i]?.id ?? i} className={`sp-steps__seg ${state}`}>
                  <span className="sr-only">
                    {name}: {rec ? (rec.status === "skipped" ? "skipped" : "done") : i === s.index ? "now" : "to do"}
                  </span>
                </li>
              );
            })}
          </ol>
          <button type="button" className="o-pill o-pill--outline sp-top__exit" onClick={actions.exit}>
            Save and exit
          </button>
        </header>

        <div className={`sp-body${s.readyToFinish ? " sp-body--finish" : ""}`}>
          {/* ---------- Stage, timer and controls ---------- */}
          <section className="sp-main" aria-label="Player">
            <div className="sp-stage">
              {s.media.videoUrl && !(s.reducedMotion && stageImage) ? (
                <StageVideo
                  src={s.media.videoUrl}
                  poster={stageImage}
                  playing={s.status === "in-progress" && !s.reducedMotion}
                  still={s.reducedMotion}
                />
              ) : stageImage ? (
                <>
                  <img className="sp-stage__backdrop" src={stageImage} alt="" aria-hidden="true" />
                  <img className="sp-stage__media" src={stageImage} alt="" />
                </>
              ) : exercise ? (
                <span className="sp-stage__flat" style={{ backgroundColor: toneFor(exercise.id) }} aria-hidden="true">
                  {displayName(exercise)}
                </span>
              ) : null}
              {paused ? (
                <span className="sp-stage__chip" aria-hidden="true">
                  Paused
                </span>
              ) : null}
            </div>

            {s.error && !s.readyToFinish ? (
              <p className="sp-error" role="alert">
                <Icon name="alert" />
                {s.error}
              </p>
            ) : null}

            {s.readyToFinish ? (
              <FinishCard s={s} feeling={feeling} onFeeling={onFeeling} busy={busy} failed={failed} doneCount={doneCount} />
            ) : (
              <div className="sp-dock">
                <div className={`sp-timer${resting ? " is-rest" : ""}${paused ? " is-paused" : ""}`} aria-live="polite">
                  <svg className="sp-timer__ring" viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="sp-timer__track" cx="60" cy="60" r={RING_R} />
                    <circle
                      className="sp-timer__fill"
                      cx="60"
                      cy="60"
                      r={RING_R}
                      strokeDasharray={RING_C}
                      strokeDashoffset={RING_C * (1 - fraction)}
                    />
                  </svg>
                  <div className="sp-timer__inside">
                    <span className="sp-timer__label">{timerLabel}</span>
                    <output className="sp-timer__secs">
                      {timer.secondsLeft}
                      <span className="sp-timer__unit">s</span>
                    </output>
                    <span className="sp-timer__state">{paused ? "Paused" : notStarted ? "Ready" : ""}</span>
                  </div>
                  {nextUp ? <p className="sp-timer__next">{displayName(nextUp)}</p> : null}
                </div>

                <div className="sp-ctrl">
                  <div className="sp-ctrl__main">
                    <button
                      type="button"
                      className="o-pill o-pill--outline sp-ctrl__side"
                      aria-label="Back"
                      aria-disabled={notStarted || undefined}
                      onClick={() => !notStarted && actions.back()}
                    >
                      <Icon name="chevronLeft" />
                      <span className="sp-ctrl__sidetext" aria-hidden="true">
                        Back
                      </span>
                    </button>

                    {notStarted ? (
                      <button type="button" className="o-pill o-pill--solid o-pill--big sp-ctrl__play" onClick={actions.start}>
                        <Icon name="play" />
                        Start
                      </button>
                    ) : paused ? (
                      <button type="button" className="o-pill o-pill--solid o-pill--big sp-ctrl__play" onClick={actions.resume}>
                        <Icon name="play" />
                        Resume
                      </button>
                    ) : (
                      <button type="button" className="o-pill o-pill--solid o-pill--big sp-ctrl__play" onClick={actions.pause}>
                        <PauseIcon />
                        Pause
                      </button>
                    )}

                    <button
                      type="button"
                      className="o-pill o-pill--outline sp-ctrl__side"
                      aria-label={s.isLast ? "Done with this exercise" : "Next exercise"}
                      aria-disabled={notStarted || undefined}
                      onClick={() => !notStarted && actions.next()}
                    >
                      <span className="sp-ctrl__sidetext" aria-hidden="true">
                        {s.isLast ? "Done" : "Next"}
                      </span>
                      <Icon name="chevronRight" />
                    </button>
                  </div>

                  {!notStarted ? (
                    <div className="sp-ctrl__text">
                      {!resting ? (
                        <button type="button" className="sp-link" onClick={actions.markSetDone}>
                          Set done
                        </button>
                      ) : (
                        <button type="button" className="sp-link" onClick={actions.skipRest}>
                          Skip rest
                        </button>
                      )}
                      <button type="button" className="sp-link" onClick={actions.restartExercise}>
                        Restart exercise
                      </button>
                      <button type="button" className="sp-link" onClick={actions.skipExercise}>
                        Skip exercise
                      </button>
                    </div>
                  ) : (
                    <p className="sp-ctrl__hint">Get into position, then press Start.</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ---------- Info panel ---------- */}
          {exercise && !s.readyToFinish ? (
            <aside className="sp-info" aria-labelledby="session-exercise-name">
              <h2 id="session-exercise-name" className="sp-info__name">
                {displayName(exercise)}
              </h2>
              <>
                  <p className="sp-info__dose">
                    {doseLine}
                    {s.usedDefaults ? <span className="sp-info__tag">Suggested</span> : null}
                  </p>
                  {timer.mode === "reps" ? (
                    <p className="sp-info__rhythm">
                      Lift {s.rhythm.liftSeconds} · Hold {s.rhythm.holdSeconds} · Lower {s.rhythm.lowerSeconds}
                      <span className="sr-only"> seconds</span>
                    </p>
                  ) : null}
              </>

              {steps.length ? (
                <>
                  <h3 className="o-h3">How to do it</h3>
                  <ol className="o-cues">
                    {steps.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ol>
                </>
              ) : null}

              {safety.length ? (
                <details className="o-safety" open>
                  <summary>
                    <Icon name="alert" />
                    Stop if this causes pain
                  </summary>
                  <ul>
                    {safety.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </aside>
          ) : null}
        </div>

        {/* ---------- Settings strip ---------- */}
        <footer className="sp-foot">
          <button
            type="button"
            className={`o-pill o-pill--outline sp-sound${s.cues.enabled ? " is-on" : ""}`}
            aria-pressed={s.cues.enabled}
            onClick={() => s.cues.setEnabled(!s.cues.enabled)}
          >
            <SoundIcon on={s.cues.enabled} />
            Sound cues: {s.cues.enabled ? "On" : "Off"}
          </button>
          <ul className="sp-keys" aria-label="Keyboard shortcuts">
            {s.keyBindings.map((b) => {
              const [key, what] = b.label.split(": ");
              return (
                <li key={b.key}>
                  <kbd>{key}</kbd> {what}
                </li>
              );
            })}
          </ul>
        </footer>
        {s.cues.last ? (
          <p className="sr-only" data-testid="last-cue" aria-live="polite">
            Last cue: {s.cues.last.type}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FinishCard({
  s,
  feeling,
  onFeeling,
  busy,
  failed,
  doneCount,
}: {
  s: UseSessionResult;
  feeling: number | null;
  onFeeling: (n: number) => void;
  busy: boolean;
  failed: boolean;
  doneCount: number;
}) {
  return (
    <section className="sp-finish" aria-label="Finish">
      <p className="sp-finish__title" role="status">
        All exercises done.
      </p>
      <p className="sp-finish__line">
        {doneCount} of {s.total} finished. Finish the day when you are ready.
      </p>
      <fieldset className="sp-feel" disabled={busy}>
        <legend className="sp-feel__legend">How did that feel? (optional)</legend>
        <div className="sp-feel__row">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`sp-feel__pill${feeling === n ? " is-on" : ""}`}>
              <input type="radio" name="feeling" value={n} checked={feeling === n} onChange={() => onFeeling(n)} />
              {n}
            </label>
          ))}
        </div>
        <p className="sp-feel__ends" aria-hidden="true">
          <span>Hard</span>
          <span>Easy</span>
        </p>
      </fieldset>
      {s.error ? (
        <p className="sp-error" role="alert">
          <Icon name="alert" />
          {s.error}
        </p>
      ) : null}
      <button
        type="button"
        className="o-pill o-pill--solid o-pill--big sp-finish__go"
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={() => void s.actions.finishDay(feeling)}
      >
        {busy ? (
          <>
            <span className="sp-spin" aria-hidden="true" />
            Saving…
          </>
        ) : failed ? (
          "Try again"
        ) : (
          "Finish day"
        )}
      </button>
    </section>
  );
}

/**
 * The exercise clip, with no browser controls: the session's Start / Pause button drives it.
 * It plays while the session runs and pauses otherwise. Under reduced motion it never plays and
 * shows its still frame (the photo is used instead when the exercise has one).
 */
function StageVideo({ src, poster, playing, still }: { src: string; poster?: string; playing: boolean; still: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing && !still) void el.play().catch(() => {});
    else el.pause();
  }, [playing, still, src]);
  return (
    <video
      ref={ref}
      className="sp-stage__media"
      src={still && !poster ? `${src}#t=0.1` : src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={!still}
      preload={still ? "metadata" : "auto"}
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6m0-6-5 6" />}
    </svg>
  );
}
