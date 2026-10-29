import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { SessionPlayer } from "../components/SessionPlayer";
import { StopNotice } from "../components/StopNotice";
import { ExerciseTags } from "../components/Tags";
import { VideoSlot } from "../components/VideoSlot";
import { imageFor } from "../data/images";
import { AREA_LABEL, getExercise } from "../data/library";
import { PHASE_INFO, opensOnDay } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";

export function ExerciseDetail() {
  const { id = "" } = useParams();
  const exercise = getExercise(id.toUpperCase());
  const { currentDay } = useDay();
  const navigate = useNavigate();
  const location = useLocation();
  const [playing, setPlaying] = useState(false);
  usePageTitle(exercise ? exercise.name : "Exercise not found");

  const back = () => (location.key !== "default" ? navigate(-1) : navigate("/app/library"));

  if (!exercise) {
    return (
      <div className="mob-wrap mob-page">
        <h1 className="mob-title">We couldn't find that exercise</h1>
        <p className="mob-lede">It may have been renamed. The Library has all of them.</p>
        <Link to="/app/library" className="mob-btn mob-btn--primary">
          Go to the Library
        </Link>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="mob-wrap mob-page">
        <SessionPlayer exercises={[exercise]} title={exercise.name} onExit={() => setPlaying(false)} />
      </div>
    );
  }

  const opens = opensOnDay(exercise.phase, currentDay);
  const phase = PHASE_INFO[exercise.phase];

  return (
    <article className="mob-wrap mob-page mob-detail" aria-labelledby="detail-title">
      <button type="button" className="mob-btn mob-btn--text mob-btn--inline mob-back" onClick={back}>
        <Icon name="chevronLeft" />
        Back
      </button>

      <div className="mob-detail__grid">
        <div className="mob-detail__media">
          <VideoSlot poster={imageFor(exercise)} ratio="portrait" />
          <StopNotice />
        </div>

        <div className="mob-detail__text">
          <ExerciseTags exercise={exercise} currentDay={currentDay} />
          <h1 id="detail-title" className="mob-title">
            {exercise.name}
          </h1>
          {exercise.subtitle ? <p className="mob-lede">{exercise.subtitle}</p> : null}

          {opens ? (
            <div className="mob-locked">
              <Icon name="lock" />
              <div>
                <p className="mob-locked__title">Preview only. This one opens on Day {opens}.</p>
                <p>
                  It belongs to Phase {phase.number} · {phase.name} · Days {phase.startDay}–{phase.endDay}. You can read
                  how it works now; it joins your sessions when that phase starts.
                </p>
              </div>
            </div>
          ) : (
            <button type="button" className="mob-btn mob-btn--primary mob-btn--big" onClick={() => setPlaying(true)}>
              <Icon name="play" />
              Start this exercise
            </button>
          )}

          <dl className="mob-facts">
            <div>
              <dt>You'll need</dt>
              <dd>{exercise.equipment}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>{exercise.positionDetail ?? exercise.position}</dd>
            </div>
            <div>
              <dt>Areas</dt>
              <dd>{exercise.areas.map((a) => AREA_LABEL[a]).join(", ")}</dd>
            </div>
          </dl>

          <h2 className="mob-h3">Get set</h2>
          <p>{exercise.setup}</p>

          <h2 className="mob-h3">How to do it</h2>
          <ol className="mob-cues">
            {exercise.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ol>

          <h2 className="mob-h3">Safety notes</h2>
          <ul className="mob-notes">
            {exercise.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
