import type { ReactNode } from "react";
import { imageFor, PLACEHOLDER_WORD } from "../data/images";
import type { Exercise } from "../data/library";

/**
 * 4:5 picture with 24px corners. The exercise's own still, or a soft sage-to-cream tile with the
 * position word until a still exists. An optional badge sits on the bottom-left corner.
 */
export function ExerciseThumb({ exercise, badge }: { exercise: Exercise; badge?: ReactNode }) {
  const src = imageFor(exercise);
  return (
    <div className={`mob-thumb${src ? "" : " is-placeholder"}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="mob-thumb__word" aria-hidden="true">
          {PLACEHOLDER_WORD[exercise.position]}
        </span>
      )}
      {badge ? <span className="mob-thumb__badge">{badge}</span> : null}
    </div>
  );
}
