import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DemoBadge } from "../components/ui/Primitives";
import {
  DAY1_MANIFEST,
  clipIsPlayable,
  clipStatusLabel,
  day1ExerciseForMovement,
  day1IsInternalPreview,
  day1PosterUrl,
  day1Steps,
  mediaUrl,
} from "../content/day01";
import { useApp } from "../store/AppState";

const STEPS = day1Steps();

export function Day1HomeCard({
  blocked,
  completed,
  onStart,
}: {
  blocked: boolean;
  completed: boolean;
  onStart: () => void;
}) {
  const poster = day1PosterUrl();
  return (
    <article className="day1-home-card">
      <div className="day1-poster-frame">
        {poster ? <img src={poster} alt="Day 1 poster. The session video is not uploaded." /> : null}
        <span className="placeholder-tag on-light">Video not uploaded</span>
      </div>
      <span className="pill">Internal preview</span>
      <h2>{DAY1_MANIFEST.sessionTitle}</h2>
      <p>
        About {Math.round(DAY1_MANIFEST.plannedTotalDurationSec / 60)} min · {DAY1_MANIFEST.exercises.length} movements · Sturdy chair and counter
      </p>
      <Button disabled={blocked} onClick={onStart}>
        {completed ? "Review session" : "▶ Start"}
      </Button>
    </article>
  );
}

export function Day1Intro({ locked }: { locked: boolean }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const poster = day1PosterUrl();
  const firstExercise = STEPS.find((step) => step.movementId);

  return (
    <section className="screen">
      <div className="hero-media day1-hero">
        <button className="icon-btn light" onClick={() => navigate(-1)} aria-label="Close">
          ×
        </button>
        {poster ? <img className="clip-still" src={poster} alt="Day 1 poster. The introduction video is not uploaded." /> : null}
        <span className="placeholder-tag on-light">Video not uploaded</span>
      </div>
      <p className="muted" style={{ marginTop: 18 }}>
        Day 1 · Introduction
      </p>
      <h1 className="display">{DAY1_MANIFEST.sessionTitle}</h1>
      <p className="lede">
        {DAY1_MANIFEST.description}
        {state.profile?.firstName ? ` This preview is for you, ${state.profile.firstName}.` : ""}
      </p>
      <DemoBadge>{day1IsInternalPreview() ? "Internal preview · not prescribed" : "Approved session"}</DemoBadge>
      <div className="stat-pills">
        <div>
          <strong>About {Math.round(DAY1_MANIFEST.plannedTotalDurationSec / 60)} min</strong>
          <span>Planned time</span>
        </div>
        <div>
          <strong>{DAY1_MANIFEST.exercises.length}</strong>
          <span>movements</span>
        </div>
        <div>
          <strong>Chair</strong>
          <span>and a counter</span>
        </div>
      </div>
      <div className="card">
        <strong>Clips in this session</strong>
        <ul className="clip-status-list">
          {STEPS.map((step) => (
            <li key={step.sceneId}>
              <span>{step.title}</span>
              <small>{clipStatusLabel(step)}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <strong>Before you begin</strong>
        <ul>
          {DAY1_MANIFEST.generalSafetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
      <div className="grow" />
      <Button disabled={locked} onClick={() => navigate("/player/1")}>
        ▶ Begin session
      </Button>
      {firstExercise?.movementId ? (
        <Button variant="ghost" onClick={() => navigate(`/guide/${firstExercise.movementId}?day=1`)}>
          Exercise instructions
        </Button>
      ) : null}
    </section>
  );
}

export function Day1Player({ locked }: { locked: boolean }) {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const startIndex = state.sessionResume?.day === 1 ? state.sessionResume.movementIndex : 0;
  const [index, setIndex] = useState(Math.min(startIndex, STEPS.length - 1));
  const [sideIndex, setSideIndex] = useState(0);
  const [reps, setReps] = useState(state.sessionResume?.day === 1 ? state.sessionResume.completedReps : 0);
  const [report, setReport] = useState(false);
  const step = STEPS[index];

  if (locked || !step) {
    return (
      <section className="screen">
        <h1 className="display">Preview closed</h1>
        <p className="lede">Day 1 stays in internal preview and is not delivered until safety review allows it.</p>
        <Button onClick={() => navigate("/preview/home")}>Back home</Button>
      </section>
    );
  }

  const playback = clipIsPlayable(step) ? mediaUrl(step.file) : null;
  const poster = day1PosterUrl();
  const sides = step.sides ?? [];
  const side = sides[sideIndex] ?? null;
  const targetReps = step.reps ?? 0;

  const remember = (nextIndex: number, nextReps: number) => {
    dispatch({ type: "RESUME", value: { day: 1, movementIndex: nextIndex, completedReps: nextReps } });
  };

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex);
    setSideIndex(0);
    setReps(0);
    remember(nextIndex, 0);
  };

  if (report) {
    return (
      <section className="screen">
        <h1 className="display">Something doesn’t feel right?</h1>
        <p className="lede">
          Stop if you have chest pain, fainting, sudden weakness, or severe new pain. This preview cannot diagnose the cause.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            dispatch({
              type: "CHECKIN",
              record: {
                day: 1,
                action: "pause_and_seek_assessment",
                blockNextSession: true,
                newOrConcerningSymptoms: true,
              },
            });
            navigate("/hold");
          }}
        >
          Stop and get guidance
        </Button>
        <Button variant="ghost" onClick={() => setReport(false)}>
          Return to the preview
        </Button>
      </section>
    );
  }

  return (
    <section className="screen player">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="icon-btn" onClick={() => navigate("/session/1")} aria-label="Close session">
          ×
        </button>
        <span className="pill">
          {index + 1} of {STEPS.length}
        </span>
        <span className="pill">Internal preview</span>
      </div>
      <div className="hero-media day1-hero">
        {playback ? (
          <video ref={videoRef} src={playback} playsInline controls={false} poster={poster ?? undefined} />
        ) : poster ? (
          <img className="clip-still" src={poster} alt="" />
        ) : null}
        <span className={`placeholder-tag ${playback ? "" : "on-light"}`}>{playback ? "Clip ready" : "Video not uploaded"}</span>
      </div>
      <h1 className="serif" style={{ fontSize: "2rem", marginBottom: 6 }}>
        {step.title}
      </h1>
      <p className="muted">{clipStatusLabel(step)}</p>
      {step.kind === "exercise" ? (
        <p className="lede">
          Draft dose: 1 × {targetReps}
          {step.perSide ? " per side" : ""}
          {step.doseCondition ? `. ${step.doseCondition}` : ""}. {step.doseStatus}.
        </p>
      ) : (
        <p className="lede">{step.narration}</p>
      )}
      {step.kind === "exercise" && state.settings.captions ? <p className="muted">{step.narration}</p> : null}
      <p className="muted">Draft narration. It is not a completed caption track, and it is not timed to a recording.</p>
      {step.kind === "exercise" ? (
        <div className="rep-row">
          <div>
            <span className="display" style={{ fontSize: "3rem" }}>
              {reps}
            </span>
            <small>
              of {targetReps} {side ? `· ${side} side` : "repetitions"}
            </small>
          </div>
          <StepNav index={index} onPrev={() => goTo(Math.max(0, index - 1))} onNext={() => (index + 1 < STEPS.length ? goTo(index + 1) : navigate("/checkin/1"))} />
        </div>
      ) : (
        <StepNav index={index} onPrev={() => goTo(Math.max(0, index - 1))} onNext={() => (index + 1 < STEPS.length ? goTo(index + 1) : navigate("/checkin/1"))} />
      )}
      <p className="muted">
        {playback
          ? "This count is yours. It does not mark the clip approved."
          : "No clip is playing. Counting a repetition does not mark the missing video complete."}
      </p>
      {step.kind === "exercise" ? (
        <Button
          variant="quiet"
          onClick={() => {
            const nextReps = Math.min(targetReps, reps + 1);
            if (nextReps >= targetReps && step.perSide && sideIndex + 1 < sides.length) {
              setSideIndex((value) => value + 1);
              setReps(0);
              remember(index, 0);
              return;
            }
            setReps(nextReps);
            remember(index, nextReps);
          }}
        >
          I completed a repetition
        </Button>
      ) : null}
      <div className="player-actions">
        <button
          type="button"
          disabled={!playback}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = 0;
            void video.play();
          }}
        >
          Replay
        </button>
        <button
          type="button"
          disabled={!step.movementId}
          onClick={() => step.movementId && navigate(`/guide/${step.movementId}?day=1`)}
        >
          Instructions
        </button>
        <button type="button" disabled>
          No easier clip
        </button>
      </div>
      <Button variant="danger" onClick={() => setReport(true)}>
        Stop · Report discomfort
      </Button>
    </section>
  );
}

function StepNav({ index, onPrev, onNext }: { index: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="row">
      <button className="icon-btn" aria-label="Previous part" onClick={onPrev} disabled={index === 0}>
        ‹
      </button>
      <button className="icon-btn" aria-label="Next part" onClick={onNext}>
        ›
      </button>
    </div>
  );
}

export function Day1Guide({ movementId }: { movementId: string }) {
  const navigate = useNavigate();
  const exercise = day1ExerciseForMovement(movementId);
  const step = STEPS.find((item) => item.movementId === movementId);

  if (!exercise || !step) return <section className="screen">Unknown Day 1 movement.</section>;

  return (
    <section className="screen">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="muted">Exercise instructions</p>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Close">
          ×
        </button>
      </div>
      <h1 className="display">{exercise.name}</h1>
      <DemoBadge>Internal preview · draft dose</DemoBadge>
      <p className="lede">{step.narration}</p>
      <p className="muted">{clipStatusLabel(step)}</p>
      <div className="card">
        <strong>Draft dose</strong>
        <p>
          1 set × {exercise.proposedDose.reps}
          {exercise.proposedDose.perSide ? " per side" : ""} · {exercise.proposedDose.tempo}. {exercise.proposedDose.status}.
          {"condition" in exercise.proposedDose && exercise.proposedDose.condition ? ` ${exercise.proposedDose.condition}.` : ""}
        </p>
        <strong>Setup</strong>
        <ul>
          {exercise.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <strong>Safety</strong>
        <ul>
          {exercise.safetyNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <Button onClick={() => navigate("/player/1")}>Back to session</Button>
    </section>
  );
}
