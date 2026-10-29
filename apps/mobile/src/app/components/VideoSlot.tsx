import { Icon } from "./Icon";

export type MediaRatio = "hero" | "portrait" | "wide";

/**
 * Where each exercise's AI clip will play. Until clips exist it shows the exercise still
 * (or the forest placeholder when there is no image) with one round Play mark.
 * Nothing is ever written on top of the image.
 * TODO(video): pass src per exercise once clips are generated.
 */
export function VideoSlot({
  src,
  poster,
  alt = "",
  ratio = "wide",
  showPlay = true,
}: {
  src?: string;
  /** Still image shown until a clip exists. */
  poster?: string;
  /** Alt text for the still. Empty when nearby text already names the exercise. */
  alt?: string;
  ratio?: MediaRatio;
  showPlay?: boolean;
}) {
  if (src) {
    return (
      <div className={`mob-media mob-media--${ratio}`}>
        <video src={src} poster={poster} controls playsInline preload="metadata" aria-label={alt || undefined} />
      </div>
    );
  }
  return (
    <div className={`mob-media mob-media--${ratio}${poster ? "" : " is-empty"}`}>
      {poster ? <img src={poster} alt={alt} loading="lazy" decoding="async" /> : null}
      {showPlay ? (
        <span className="mob-media__play" aria-hidden="true">
          <Icon name="play" size={30} />
        </span>
      ) : null}
    </div>
  );
}
