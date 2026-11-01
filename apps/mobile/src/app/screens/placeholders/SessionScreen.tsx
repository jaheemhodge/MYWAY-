import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { displayName } from "../../data/library";
import { usePageTitle } from "../../hooks";
import { cleanCopyList } from "../../open/copy";
import { toneFor } from "../../open/data";
import { useSession, type UseSessionResult } from "../../state/useSession";
import "./session.css";

/**
 * /app/session/:day — the day's guided session, video first.
 * Every piece of state and every action comes from useSession(day) (src/app/state/useSession.ts).
 * SessionScreen wires the hook and the keyboard; SessionView only renders what the hook returns
 * and forwards clicks to `actions`.
 *
 * Look: a dark, rounded 16:9 stage with the clip (or still) filling it, a gradient overlay and
 * translucent black controls that fade out while the session runs and the pointer is idle.
 * Text is kept to one line under the stage; instructions and safety notes sit in a Details panel.
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

const IDLE_MS = 2500;

/** True after IDLE_MS without pointer, touch, key or focus activity on the stage, while `enabled`. */
function useIdle(enabled: boolean) {
  const [idle, setIdle] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(timer.current);
    if (enabled) timer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, [enabled]);
  useEffect(() => {
    wake();
    return () => window.clearTimeout(timer.current);
  }, [wake]);
  return { idle: enabled && idle, wake };
}

export function SessionView({
  s,
  feeling,
  onFeeling,
}: {
  s: UseSessionResult;
  feeling: number | null;
  onFeeling: (n: number) => void;
}) {
  const running = s.status === "in-progress" && s.timer.running && !s.readyToFinish;
  const { idle, wake } = useIdle(running);
  const [pulse, setPulse] = useState(0);
  const day = s.day;

  if (s.status === "loading") {
    return (
      <Shell>
        <div className="sp2-stage sp2-stage--quiet" aria-busy="true">
          <span className="sp2-spin" aria-hidden="true" />
          <p className="sp2-quiet__line" role="status">
            Loading your plan…
          </p>
        </div>
      </Shell>
    );
  }

  if (s.status === "locked") {
    return (
      <Shell>
        <div className="sp2-stage sp2-stage--quiet">
          <span className="sp2-quiet__icon" aria-hidden="true">
            <LockIcon />
          </span>
          <h1 className="sp2-quiet__title">Day {day} isn't open yet</h1>
          <p className="sp2-quiet__line" role="status">
            Taking you to Day {s.currentDay}.
          </p>
        </div>
        <Navigate to={`/app/session/${s.currentDay}`} replace />
      </Shell>
    );
  }

  if (s.status === "recheck-required" && s.recheckRoute) {
    return (
      <Shell>
        <div className="sp2-stage sp2-stage--quiet">
          <span className="sp2-quiet__icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <h1 className="sp2-quiet__title">A quick check-in first</h1>
          <p className="sp2-quiet__line" role="status">
            Two short questions, then Day {day}.
          </p>
        </div>
        <Navigate to={s.recheckRoute} replace />
      </Shell>
    );
  }

  const { exercise, timer, actions, plan } = s;
  const paused = s.status === "paused";
  const ready = s.status === "ready";
  const busy = s.status === "finishing";
  const failed = s.status === "error";
  const resting = timer.mode === "rest" && !s.readyToFinish && !ready;
  const betweenExercises = resting && timer.segment === "rest-exercise";
  const nextUp = betweenExercises ? plan?.exercises[s.index + 1] : undefined;
  const fraction = timer.totalSeconds > 0 ? Math.min(1, Math.max(0, timer.secondsLeft / timer.totalSeconds)) : 1;
  const elapsed = 1 - fraction;
  const timerLabel = betweenExercises ? "Next up" : resting ? "Rest" : "Set";
  const doseLine = [
    `Set ${s.currentSet} of ${s.totalSets}`,
    s.repsTarget !== null ? `${s.repsTarget} reps` : null,
    s.holdSeconds !== null ? `hold ${s.holdSeconds} s` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const steps = exercise ? cleanCopyList([exercise.setup, ...exercise.cues]) : [];
  const safety = exercise ? cleanCopyList(exercise.safetyNotes) : [];
  const still = s.media.imageUrl;
  const showVideo = Boolean(s.media.videoUrl) && !(s.reducedMotion && still);

  const playPause = () => {
    setPulse((n) => n + 1);
    if (ready) actions.start();
    else actions.togglePause();
  };

  return (
    <Shell reduced={s.reducedMotion}>
      {/* The day and phase for screen readers (the stage shows "Day N · Exercise X of Y"). */}
      <h1 className="sr-only">
        Day {day}
        {plan ? ` · ${plan.phaseName}` : ""}
        {s.isReplay ? " (replay)" : ""}
      </h1>

      <div
        className={`sp2-stage${idle ? " is-idle" : ""}${running ? " is-running" : ""}${paused ? " is-paused" : ""}${s.readyToFinish ? " is-finish" : ""}`}
        data-state={s.status}
        onPointerMove={wake}
        onPointerDown={wake}
        onFocusCapture={wake}
        onKeyDown={wake}
      >
        {/* ---------- Media ---------- */}
        <div className="sp2-media" aria-hidden="true">
          {showVideo ? (
            <StageVideo src={s.media.videoUrl!} poster={still} playing={running && !s.reducedMotion} still={s.reducedMotion} />
          ) : still ? (
            <img className={`sp2-media__img sp2-kb${running ? " is-on" : ""}`} src={still} alt="" />
          ) : exercise ? (
            <span className="sp2-media__tone" style={{ backgroundColor: toneFor(exercise.id) }} />
          ) : null}
        </div>
        <div className="sp2-shade" aria-hidden="true" />

        {/* ---------- Top ---------- */}
        <div className="sp2-bar sp2-bar--top">
          <div className="sp2-where">
            <p className="sp2-where__text">
              <span>Day {day}</span>
              <span aria-hidden="true"> · </span>
              <span>
                Exercise {Math.min(s.index + 1, s.total)} of {s.total}
              </span>
            </p>
            <ol className="sp2-segs" aria-label={`${s.exercisesDone.filter(Boolean).length} of ${s.total} exercises done`}>
              {Array.from({ length: s.total }, (_, i) => {
                const rec = s.exercisesDone[i];
                const cls = rec ? (rec.status === "skipped" ? "is-skipped" : "is-done") : i === s.index && !s.readyToFinish ? "is-current" : "";
                return (
                  <li key={plan?.exercises[i]?.id ?? i} className={`sp2-segs__seg ${cls}`}>
                    <span className="sr-only">
                      {plan?.exercises[i] ? displayName(plan.exercises[i]) : `Exercise ${i + 1}`}:{" "}
                      {rec ? (rec.status === "skipped" ? "skipped" : "done") : i === s.index ? "now" : "to do"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="sp2-bar__end">
            <button
              type="button"
              className={`sp2-btn sp2-btn--icon${s.cues.enabled ? " is-on" : ""}`}
              aria-pressed={s.cues.enabled}
              aria-label="Sound cues"
              onClick={() => s.cues.setEnabled(!s.cues.enabled)}
            >
              <SoundIcon on={s.cues.enabled} />
            </button>
            <button type="button" className="sp2-btn sp2-btn--pill" onClick={actions.exit}>
              Save and exit
            </button>
          </div>
        </div>

        {/* ---------- Centre ---------- */}
        {s.readyToFinish ? (
          <FinishPanel s={s} feeling={feeling} onFeeling={onFeeling} busy={busy} failed={failed} />
        ) : ready ? (
          <div className="sp2-center">
            <button type="button" className="sp2-start" onClick={playPause}>
              <PlayIcon />
              Start
            </button>
          </div>
        ) : (
          <div className="sp2-center sp2-center--cluster">
            <button type="button" className="sp2-btn sp2-btn--round" aria-label="Back" onClick={actions.back}>
              <ChevronIcon dir="left" />
            </button>

            {resting ? (
              <div className="sp2-rest" aria-live="polite">
                <p className="sp2-rest__title">Rest</p>
                {nextUp ? <p className="sp2-rest__next">Next: {displayName(nextUp)}</p> : null}
                <button type="button" className="sp2-btn sp2-btn--pill" onClick={actions.skipRest}>
                  Skip rest
                </button>
              </div>
            ) : (
              <button type="button" className={`sp2-play${paused ? " is-paused" : ""}`} onClick={playPause}>
                <span className="sp2-play__icons" aria-hidden="true">
                  <PlayIcon className="sp2-play__i sp2-play__i--play" />
                  <PauseIcon className="sp2-play__i sp2-play__i--pause" />
                </span>
                {pulse ? <span key={pulse} className="sp2-play__pulse" aria-hidden="true" /> : null}
                <span className="sr-only">{paused ? "Resume" : "Pause"}</span>
              </button>
            )}

            <button
              type="button"
              className="sp2-btn sp2-btn--round"
              aria-label={s.isLast ? "Done with this exercise" : "Next exercise"}
              onClick={actions.next}
            >
              <ChevronIcon dir="right" />
            </button>
          </div>
        )}

        {/* ---------- Bottom ---------- */}
        {!s.readyToFinish ? (
          <div className="sp2-bar sp2-bar--bottom">
            <div className="sp2-now">
              <h2 className="sp2-now__name">{exercise ? displayName(exercise) : ""}</h2>
              <p className="sp2-now__dose">{doseLine}</p>
            </div>
            <div className={`sp2-timer${resting ? " is-rest" : ""}`}>
              <svg viewBox="0 0 48 48" className="sp2-timer__ring" aria-hidden="true">
                <circle className="sp2-timer__track" cx="24" cy="24" r="21" />
                <circle
                  className="sp2-timer__fill"
                  cx="24"
                  cy="24"
                  r="21"
                  strokeDasharray={2 * Math.PI * 21}
                  strokeDashoffset={2 * Math.PI * 21 * (1 - fraction)}
                />
              </svg>
              <output className="sp2-timer__secs">{timer.secondsLeft}</output>
              <span className="sp2-timer__label">{timerLabel}</span>
            </div>
          </div>
        ) : null}

        {/* Thin line for the current segment (not a seek bar). */}
        {!s.readyToFinish && !ready ? (
          <div className="sp2-line" aria-hidden="true">
            <span style={{ transform: `scaleX(${elapsed})` }} />
          </div>
        ) : null}

        {paused ? (
          <span className="sp2-chip" aria-hidden="true">
            Paused
          </span>
        ) : null}
      </div>

      {s.error && !s.readyToFinish ? (
        <p className="sp2-error sp2-error--page" role="alert">
          <AlertIcon />
          {s.error}
        </p>
      ) : null}

      {/* ---------- The one line under the stage ---------- */}
      {exercise && !s.readyToFinish ? (
        <details className="sp2-details">
          <summary className="sp2-details__sum">
            <AlertIcon />
            <span className="sp2-details__warn">Stop if this causes pain</span>
            <span className="sp2-details__toggle">
              Details
              <ChevronIcon dir="down" />
            </span>
          </summary>
          <div className="sp2-details__body">
            {steps.length ? (
              <section>
                <h3 className="sp2-details__h">How to do it</h3>
                <ol className="sp2-details__list">
                  {steps.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
              </section>
            ) : null}
            {safety.length ? (
              <section>
                <h3 className="sp2-details__h">Safety</h3>
                <ul className="sp2-details__list sp2-details__list--dots">
                  {safety.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {!ready ? (
              <div className="sp2-details__actions">
                {!resting ? (
                  <button type="button" className="sp2-quiet" onClick={actions.markSetDone}>
                    Set done
                  </button>
                ) : null}
                <button type="button" className="sp2-quiet" onClick={actions.restartExercise}>
                  Restart exercise
                </button>
                <button type="button" className="sp2-quiet" onClick={actions.skipExercise}>
                  Skip exercise
                </button>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {s.cues.last ? (
        <p className="sr-only" data-testid="last-cue" aria-live="polite">
          Last cue: {s.cues.last.type}
        </p>
      ) : null}
    </Shell>
  );
}

function Shell({ children, reduced }: { children: ReactNode; reduced?: boolean }) {
  return (
    <div className="sp2" data-reduced-motion={reduced || undefined}>
      {children}
    </div>
  );
}

function FinishPanel({
  s,
  feeling,
  onFeeling,
  busy,
  failed,
}: {
  s: UseSessionResult;
  feeling: number | null;
  onFeeling: (n: number) => void;
  busy: boolean;
  failed: boolean;
}) {
  return (
    <section className="sp2-finish" aria-label="Finish">
      <p className="sp2-finish__title" role="status">
        All exercises done.
      </p>
      <fieldset className="sp2-feel" disabled={busy}>
        <legend className="sp2-feel__legend">How did that feel? (optional)</legend>
        <div className="sp2-feel__row">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`sp2-feel__pill${feeling === n ? " is-on" : ""}`}>
              <input type="radio" name="feeling" value={n} checked={feeling === n} onChange={() => onFeeling(n)} />
              {n}
            </label>
          ))}
        </div>
        <p className="sp2-feel__ends" aria-hidden="true">
          <span>Hard</span>
          <span>Easy</span>
        </p>
      </fieldset>
      {s.error ? (
        <p className="sp2-error" role="alert">
          <AlertIcon />
          {s.error}
        </p>
      ) : null}
      <button
        type="button"
        className="sp2-finish__go"
        disabled={busy}
        aria-busy={busy || undefined}
        onClick={() => void s.actions.finishDay(feeling)}
      >
        {busy ? (
          <>
            <span className="sp2-spin sp2-spin--small" aria-hidden="true" />
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
 * The exercise clip, with no browser controls: the session's play/pause drives it.
 * It plays while the session runs and pauses otherwise. Under reduced motion it never plays and
 * shows its still frame (the photo is used instead when the exercise has one).
 */
function StageVideo({ src, poster, playing, still }: { src: string; poster?: string; playing: boolean; still: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // play() returns a promise in modern browsers but nothing in some older ones (and in tests).
    try {
      if (playing && !still) void el.play()?.catch(() => {});
      else el.pause();
    } catch {
      /* playback not available: the poster or first frame stays */
    }
  }, [playing, still, src]);
  return (
    <video
      ref={ref}
      className="sp2-media__video"
      src={still && !poster ? `${src}#t=0.1` : src}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={!still}
      preload={still ? "metadata" : "auto"}
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
    />
  );
}

/* ---------- Inline icons (no icon package) ---------- */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6Z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="6" y="5" width="4.2" height="14" rx="1.2" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.2" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" | "down" }) {
  const d = dir === "left" ? "M15 5l-7 7 7 7" : dir === "right" ? "M9 5l7 7-7 7" : "M6 9l6 6 6-6";
  return (
    <svg className="sp2-chev" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6m0-6-5 6" />}
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="sp2-alert" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
