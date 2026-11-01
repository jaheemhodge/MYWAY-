import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { exerciseUnlockDay, isExerciseUnlocked } from "@/lib/plan";
import { Icon } from "../components/Icon";
import { AREA_LABEL, getExercise, POSITION_LABEL } from "../data/library";
import { PHASE_INFO } from "../data/plan";
import { useProfile } from "../state/ProfileProvider";
import { useProgress } from "../state/ProgressProvider";
import { usePageTitle } from "../hooks";
import VideoPlayer from "@/components/ui/video-player";
import { Stories } from "@/components/ui/stories-carousel";
import { imageFor, videoFor } from "../data/images";
import { collection, minutesFor, toneFor } from "./data";
import { OCard } from "./parts";

/**
 * Exercise detail over the page (native modal dialog: focus stays inside, Esc closes): a wide
 * window with the video player on top and the details underneath; full screen on phones.
 */
export function ExerciseOverlay() {
  const { id = "" } = useParams();
  const exercise = getExercise(id.toUpperCase());
  const navigate = useNavigate();
  const location = useLocation();
  const { currentDay } = useProgress();
  const { focusArea } = useProfile();
  const ref = useRef<HTMLDialogElement>(null);
  const hasBackground = Boolean((location.state as { background?: unknown } | null)?.background);
  usePageTitle(exercise ? exercise.name : "Exercise");

  const close = () => (hasBackground ? navigate(-1) : navigate("/app/home"));

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    d?.querySelector<HTMLElement>(".o-overlay__close")?.focus();
    d?.querySelector(".o-overlay__scroll")?.scrollTo(0, 0);
  }, [id]);

  if (!exercise) {
    return (
      <dialog ref={ref} className="o-overlay" aria-label="Exercise not found" onCancel={(e) => { e.preventDefault(); close(); }}>
        <div className="o-overlay__panel">
          <button type="button" className="o-pill o-pill--icon o-overlay__close" onClick={close}>
            <Icon name="close" />
            <span className="sr-only">Close</span>
          </button>
          <p className="o-overlay__body">We couldn't find that exercise.</p>
        </div>
      </dialog>
    );
  }

  const opens = isExerciseUnlocked(exercise, currentDay) ? null : exerciseUnlockDay(exercise);
  const more = collection(exercise.primaryArea, currentDay, focusArea).filter((e) => e.id !== exercise.id).slice(0, 6);

  return (
    <dialog
      ref={ref}
      className="o-overlay"
      aria-labelledby="o-ex-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="o-overlay__panel">
        <div className="o-overlay__scroll">
          {/* Its own sticky strip: always reachable, never over the video or the Start button. */}
          <div className="o-overlay__topbar">
            <button type="button" className="o-pill o-pill--icon o-overlay__close" onClick={close}>
              <Icon name="close" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="o-overlay__media">
            <VideoPlayer
              key={exercise.id}
              src={videoFor(exercise)}
              poster={imageFor(exercise)}
              tone={toneFor(exercise.id)}
              label={`${exercise.name}, demonstration`}
            />
          </div>
          <div className="o-overlay__body">
            <div className="o-overlay__main">
            <h2 id="o-ex-title" className="o-overlay__title">
              {exercise.name}
            </h2>
            <p className="o-meta">
              {POSITION_LABEL[exercise.position]} · {minutesFor(exercise)} min · Phase {exercise.phase}
            </p>
            <ul className="o-tags" aria-label="Helps with">
              {exercise.areas.map((a) => (
                <li key={a}>{AREA_LABEL[a]}</li>
              ))}
              <li>{PHASE_INFO[exercise.phase].name}</li>
            </ul>

            {opens ? (
              <p className="o-note">Preview only. This one joins your sessions on Day {opens}.</p>
            ) : null}

            <h3 className="o-h3">What you'll need</h3>
            <p>{exercise.equipment}</p>

            <h3 className="o-h3">How to do it</h3>
            <ol className="o-cues">
              {exercise.cues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ol>

            </div>
            <div className="o-overlay__side">
            {!opens ? (
              <Link to={`/app/session/${currentDay}`} className="o-pill o-pill--solid o-pill--big o-overlay__start">
                Start →
              </Link>
            ) : null}
            <details className="o-safety" open>
              <summary>
                <Icon name="alert" />
                Stop if this causes pain
              </summary>
              <ul>
                {exercise.safetyNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </details>
            </div>
          </div>

            {more.length ? (
              <section className="o-more" aria-labelledby="o-more-title">
                <div className="o-more__head">
                  <h3 id="o-more-title" className="o-h3">
                    More for your {AREA_LABEL[exercise.primaryArea].toLowerCase()}
                  </h3>
                  <Link to={`/app/library/${exercise.primaryArea}`} className="o-pill o-pill--outline o-caps">
                    See all →
                  </Link>
                </div>
                <Stories label={`More for your ${AREA_LABEL[exercise.primaryArea].toLowerCase()}`} className="o-more__track">
                  {more.map((e) => (
                    <OCard key={e.id} exercise={e} currentDay={currentDay} />
                  ))}
                </Stories>
              </section>
            ) : null}
        </div>
      </div>
    </dialog>
  );
}
