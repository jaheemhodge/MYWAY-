import { forwardRef, useRef, type HTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import "./stories-carousel.css";

/**
 * Stories: tall rounded tiles in a row you can scroll or drag sideways. A tile with a clip plays
 * it (muted, looped) while hovered or focused, and resets when you leave. Adapted for Mobility from
 * 21st.dev "stories-carousel".
 *
 * Changes from the original:
 * - No embla/shadcn carousel, avatar or Tailwind: a native scroll-snap row (touch swipe, trackpad,
 *   Shift+wheel; arrow buttons live outside), plain CSS.
 * - The tile is a real link (`to`) with the title and a meta line over a dark fade at the bottom,
 *   18px+ text; no author avatar (Mobility has no instructors).
 * - An optional corner action (the save heart) sits outside the link so it is its own button.
 * - Without a photo the tile shows the clip's frame at 1s, or a soft solid tone when there is no
 *   clip either. Hover clips do not play under reduced motion.
 */
export const Stories = forwardRef<HTMLOListElement, HTMLAttributes<HTMLOListElement> & { label: string }>(function Stories(
  { label, className, children, ...props },
  ref,
) {
  return (
    <ol ref={ref} className={["st", className].filter(Boolean).join(" ")} aria-label={label} {...props}>
      {children}
    </ol>
  );
});

export type StoryProps = {
  to: LinkProps["to"];
  state?: LinkProps["state"];
  title: string;
  meta?: string;
  image?: string;
  video?: string;
  tone?: string;
  /** Extra control in the top-right corner (outside the link). */
  action?: ReactNode;
  /** Render as a grid cell instead of a row item. */
  as?: "li" | "div";
};

export function Story({ to, state, title, meta, image, video, tone, action, as: Tag = "li" }: StoryProps) {
  const vref = useRef<HTMLVideoElement>(null);
  const reduce = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const play = () => {
    if (video && !reduce()) void vref.current?.play().catch(() => {});
  };
  const stop = () => {
    const el = vref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };
  return (
    <Tag className="story">
      <Link
        to={to}
        state={state}
        className="story__link"
        onMouseEnter={play}
        onMouseLeave={stop}
        onFocus={play}
        onBlur={stop}
      >
        <span className="story__media" style={image ? undefined : { background: tone }}>
          {image ? <img src={image} alt="" loading="lazy" decoding="async" draggable={false} /> : null}
          {video ? (
            // Without a photo, the clip's frame at 1s stands in as the still.
            <video ref={vref} src={image ? video : `${video}#t=1`} poster={image} muted loop playsInline preload={image ? "none" : "metadata"} aria-hidden="true" tabIndex={-1} />
          ) : null}
        </span>
        <span className="story__shade" aria-hidden="true" />
        <span className="story__text">
          <span className="story__title">{title}</span>
          {meta ? <span className="story__meta">{meta}</span> : null}
        </span>
        {video ? (
          <span className="story__badge" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
            Video
          </span>
        ) : null}
      </Link>
      {action ? <span className="story__action">{action}</span> : null}
    </Tag>
  );
}
