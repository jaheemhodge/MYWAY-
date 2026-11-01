import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
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
 * - Text sits under the image like Open's library (title + heart, then meta, then an optional
 *   note), never on the photo; the image itself is a link with a 3px radius and no overlay.
 *   No author avatar (Mobility has no instructors).
 * - The heart sits at the end of the title line, outside the link, so it is its own button.
 * - Each picture sits raised inside a glass "3D box" that tilts toward the mouse (21st.dev
 *   "3d-card", done with CSS variables instead of framer-motion). Touch, keyboard and reduced
 *   motion get the box without the tilt.
 * - Without a photo the tile shows the clip's frame at 1s, or a flat soft tone with the title
 *   centred on it when there is no clip either. Hover clips do not play under reduced motion.
 */
export const Stories = forwardRef<
  HTMLOListElement,
  HTMLAttributes<HTMLOListElement> & { label: string }
>(function Stories({ label, className, children, ...props }, ref) {
  return (
    <ol
      ref={ref}
      className={["st", className].filter(Boolean).join(" ")}
      aria-label={label}
      {...props}
    >
      {children}
    </ol>
  );
});

export type StoryProps = {
  to: LinkProps["to"];
  state?: LinkProps["state"];
  title: string;
  /** Line 2 under the title, e.g. "Knees · 3 min". */
  meta?: string;
  /** Line 3, only when set, e.g. "Opens Day 21". */
  note?: string;
  image?: string;
  video?: string;
  /** Flat tile colour when there is no photo or clip; the title is centred on it. */
  tone?: string;
  /** More lines under the note (Events: the place). */
  extra?: string[];
  /** Tag on the picture's top-left. Defaults to "Video" when there is a clip. */
  badge?: string;
  /** Control at the end of the title line (the save heart). */
  action?: ReactNode;
  /** Render as a grid cell instead of a row item. */
  as?: "li" | "div";
};

const TILT = 9; // degrees at the card's edge, as in the 3D card prompt (10.5) but a touch calmer

export function Story({
  to,
  state,
  title,
  meta,
  note,
  image,
  video,
  tone,
  extra,
  badge,
  action,
  as: Tag = "li",
}: StoryProps) {
  const tag = badge ?? (video ? "Video" : undefined);
  const vref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLAnchorElement>(null);
  const reduce = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const play = () => {
    if (video && !reduce()) void vref.current?.play().catch(() => {});
  };
  const stop = () => {
    const el = vref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };
  // 3D tilt: the box leans toward the pointer and springs back flat when it leaves.
  const tilt = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = boxRef.current;
    if (!el || e.pointerType !== "mouse" || reduce() || !fine()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 2 * TILT).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 2 * TILT).toFixed(2)}deg`);
    el.dataset.tilt = "on";
  };
  const untilt = () => {
    const el = boxRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.tilt;
  };
  const flat = !image && !video;
  return (
    <Tag className="story">
      <Link
        to={to}
        state={state}
        ref={boxRef}
        className="story__link"
        onMouseEnter={play}
        onMouseLeave={() => {
          stop();
          untilt();
        }}
        onPointerMove={tilt}
        onFocus={play}
        onBlur={stop}
        aria-label={[title, meta, note, ...(extra ?? [])]
          .filter(Boolean)
          .join(", ")}
      >
        <span className="story__box">
          <span
            className={`story__media${flat ? " is-flat" : ""}`}
            style={flat ? { background: tone } : undefined}
          >
            {image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : null}
            {video ? (
              // Without a photo, the clip's frame at 1s stands in as the still.
              <video
                ref={vref}
                src={image ? video : `${video}#t=1`}
                poster={image}
                muted
                loop
                playsInline
                preload={image ? "none" : "metadata"}
                aria-hidden="true"
                tabIndex={-1}
              />
            ) : null}
            {flat ? (
              <span className="story__flat" aria-hidden="true">
                {title}
              </span>
            ) : null}
            {tag ? (
              <span className="story__badge" aria-hidden="true">
                {video ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                  </svg>
                ) : null}
                {tag}
              </span>
            ) : null}
            <span className="story__go" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </span>
          </span>
        </span>
      </Link>
      <div className="story__text">
        <div className="story__row">
          <span className="story__title" aria-hidden="true">
            {title}
          </span>
          {action ? <span className="story__action">{action}</span> : null}
        </div>
        {meta ? (
          <span className="story__meta" aria-hidden="true">
            {meta}
          </span>
        ) : null}
        {note ? (
          <span className="story__meta" aria-hidden="true">
            {note}
          </span>
        ) : null}
        {extra?.map((line) => (
          <span key={line} className="story__meta" aria-hidden="true">
            {line}
          </span>
        ))}
      </div>
    </Tag>
  );
}
