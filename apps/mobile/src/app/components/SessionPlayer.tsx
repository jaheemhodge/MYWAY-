import { useEffect, useRef, useState } from "react";
import { POSITION_LABEL, type Exercise } from "../data/library";
import { Icon } from "./Icon";
import { StopNotice } from "./StopNotice";
import { Tag } from "./Tags";
import { VideoSlot } from "./VideoSlot";
import { imageFor, PLACEHOLDER_WORD } from "../data/images";

/**
 * Simple local step-through: one exercise per screen, its clip, setup and cues,
 * then "Done – next exercise". Nothing is timed or saved.
 */
export function SessionPlayer({
  exercises,
  title,
  onExit,
  onFinish,
}: {
  exercises: readonly Exercise[];
  title: string;
  onExit: () => void;
  onFinish?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, [index, finished]);

  if (finished) {
    return (
      <section className="mob-player mob-player--done" aria-labelledby="player-done">
        <div className="mob-player__done-mark" aria-hidden="true">
          <Icon name="check" size={40} />
        </div>
        <h1 id="player-done" ref={headingRef} tabIndex={-1} className="mob-title">
          That's {title.toLowerCase()} done
        </h1>
        <p className="mob-lede">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"} finished. Rest, have some water, and
          come back tomorrow.
        </p>
        <button type="button" className="mob-btn mob-btn--primary" onClick={onExit}>
          Back to Today
        </button>
      </section>
    );
  }

  const exercise = exercises[index];
  const isLast = index === exercises.length - 1;

  return (
    <section className="mob-player" aria-labelledby="player-title">
      <div className="mob-player__bar">
        <p className="mob-player__count">
          <span className="mob-player__title">{title}</span>
          <span>
            Exercise {index + 1} of {exercises.length}
          </span>
        </p>
        <button type="button" className="mob-btn mob-btn--secondary mob-btn--compact" onClick={onExit}>
          <Icon name="close" />
          Exit session
        </button>
      </div>
      <ol className="mob-player__steps" aria-label="Session progress">
        {exercises.map((item, i) => (
          <li
            key={item.id}
            className={i < index ? "is-done" : i === index ? "is-current" : undefined}
            aria-current={i === index ? "step" : undefined}
          >
            <span className="sr-only">
              {item.name}
              {i < index ? ", done" : i === index ? ", current" : ""}
            </span>
          </li>
        ))}
      </ol>

      <div className="mob-player__grid">
        <div className="mob-player__media">
          <VideoSlot poster={imageFor(exercise)} placeholderWord={PLACEHOLDER_WORD[exercise.position]} ratio="hero" />
          <StopNotice />
        </div>
        <div className="mob-player__text">
          <h1 id="player-title" ref={headingRef} tabIndex={-1} className="mob-title">
            {exercise.name}
          </h1>
          {exercise.subtitle ? <p className="mob-lede">{exercise.subtitle}</p> : null}
          <ul className="mob-tags" aria-label="Details">
            <li>
              <Tag>{POSITION_LABEL[exercise.position]}</Tag>
            </li>
            <li>
              <Tag>{exercise.equipment}</Tag>
            </li>
          </ul>
          <h2 className="mob-h3">Get set</h2>
          <p>{exercise.setup}</p>
          <h2 className="mob-h3">How to do it</h2>
          <ol className="mob-cues">
            {exercise.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mob-player__actions">
        {index > 0 ? (
          <button type="button" className="mob-btn mob-btn--secondary" onClick={() => setIndex((i) => i - 1)}>
            <Icon name="chevronLeft" />
            Previous exercise
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="mob-btn mob-btn--primary mob-btn--big"
          onClick={() => {
            if (isLast) {
              setFinished(true);
              onFinish?.();
            } else {
              setIndex((i) => i + 1);
            }
          }}
        >
          {isLast ? "Done – finish session" : "Done – next exercise"}
          <Icon name="arrowRight" />
        </button>
      </div>
    </section>
  );
}
