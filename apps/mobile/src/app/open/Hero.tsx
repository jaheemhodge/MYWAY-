import { Link } from "react-router-dom";
import { imageFor, PLACEHOLDER_WORD } from "../data/images";
import type { Exercise } from "../data/library";
import { useOverlayLink } from "./parts";

/**
 * Featured split card: the exercise picture on the left, the same picture blurred under a warm
 * tint on the right holding the words and two pills. Stacks on phones.
 */
export function OHero({
  exercise,
  kicker,
  title,
  meta,
  line,
  startTo,
  startLabel = "Start",
}: {
  exercise: Exercise;
  kicker: string;
  title: string;
  meta: string;
  line: string;
  startTo?: string;
  startLabel?: string;
}) {
  const src = imageFor(exercise);
  const details = useOverlayLink()(exercise.id);
  return (
    <section className="o-wrap" aria-labelledby="o-hero-title">
      <div className="o-hero">
        <div className={`o-hero__pic${src ? "" : " is-tile"}`}>
          {src ? <img src={src} alt="" /> : <span className="o-media__word">{PLACEHOLDER_WORD[exercise.position]}</span>}
        </div>
        <div className="o-hero__side">
          {src ? <img className="o-hero__blur" src={src} alt="" aria-hidden="true" /> : null}
          <div className="o-hero__body">
            <p className="o-kicker">{kicker}</p>
            <h1 id="o-hero-title" className="o-hero__title">
              {title}
            </h1>
            <p className="o-hero__meta">{meta}</p>
            <p className="o-hero__line">{line}</p>
            <div className="o-hero__actions">
              {startTo ? (
                <Link to={startTo} className="o-pill o-pill--solid">
                  {startLabel} →
                </Link>
              ) : null}
              <Link {...details} className="o-pill o-pill--outline">
                See details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
