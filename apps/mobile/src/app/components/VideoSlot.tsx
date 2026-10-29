import { Icon } from "./Icon";

/**
 * Where each exercise's AI clip will play. Until a clip exists (no src), it renders a
 * Forest placeholder with a play mark and a visible "Video clip goes here" label.
 * TODO(video): pass src per exercise once clips are generated.
 */
export function VideoSlot({
  src,
  label,
  size = "large",
}: {
  src?: string;
  /** Accessible name of the clip, usually the exercise name. */
  label: string;
  size?: "large" | "hero" | "thumb";
}) {
  if (src) {
    return (
      <div className={`mob-video mob-video--${size}`}>
        <video src={src} controls={size !== "thumb"} playsInline preload="metadata" aria-label={label} />
      </div>
    );
  }
  return (
    <div className={`mob-video mob-video--${size} is-placeholder`} role="img" aria-label={`${label}: video clip goes here`}>
      <span className="mob-video__play" aria-hidden="true">
        <Icon name="play" size={size === "thumb" ? 24 : 32} />
      </span>
      {size !== "thumb" ? (
        <span className="mob-video__note" aria-hidden="true">
          Video clip goes here
        </span>
      ) : null}
    </div>
  );
}
