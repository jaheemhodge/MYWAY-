import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { FlowIconButton, FlowLink } from "@/components/ui/flow-button";
import { Stories, Story } from "@/components/ui/stories-carousel";
import { exerciseUnlockDay, isExerciseUnlocked } from "@/lib/plan";
import { imageFor, videoFor } from "../data/images";
import { AREA_LABEL, displayName, type Area, type Exercise } from "../data/library";
import { useFavorites } from "../state/FavoritesProvider";
import { minutesFor, toneFor, type TileShape } from "./data";

type Ratio = TileShape | "portrait";

/**
 * The exercise's own photo, cropped to the tile shape. Exercises without a photo get a soft solid
 * tone from the palette: never another exercise's photo, never text over the tile.
 */
export function OMedia({ exercise, children, ratio = "square" }: { exercise: Exercise; children?: ReactNode; ratio?: Ratio }) {
  const src = imageFor(exercise);
  return (
    <div className={`o-media o-media--${ratio}`} style={src ? undefined : { backgroundColor: toneFor(exercise.id) }}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
      {children}
    </div>
  );
}

export function Heart({ id, name }: { id: string; name: string }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(id);
  return (
    <button type="button" className="o-heart" aria-pressed={on} onClick={() => void toggle(id)}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">Save {name}</span>
    </button>
  );
}

/** Link to the exercise overlay, keeping the current page behind it. */
export function useOverlayLink() {
  const location = useLocation();
  // From inside the panel, keep the original page behind it.
  const background = (location.state as { background?: unknown } | null)?.background ?? location;
  return (id: string) => ({ to: `/app/exercise/${id}`, state: { background } });
}

/**
 * Exercise tile ("story"): tall rounded photo with the name and "area · minutes" over a dark fade,
 * the save heart in the corner, and the clip playing on hover when one exists. Locked exercises
 * add "Opens Day N". Opens the exercise panel.
 */
export function OCard({
  exercise,
  currentDay,
  area,
  as = "li",
}: {
  exercise: Exercise;
  currentDay: number;
  /** Kept for callers that still pass a shape; stories are always 3:4. */
  shape?: TileShape;
  area?: Area;
  as?: "li" | "div";
}) {
  const link = useOverlayLink()(exercise.id);
  const opens = isExerciseUnlocked(exercise, currentDay) ? null : exerciseUnlockDay(exercise);
  return (
    <Story
      as={as}
      to={link.to}
      state={link.state}
      title={displayName(exercise)}
      meta={`${AREA_LABEL[area ?? exercise.primaryArea]} · ${minutesFor(exercise)} min`}
      note={opens ? `Opens Day ${opens}` : undefined}
      image={imageFor(exercise)}
      video={videoFor(exercise)}
      tone={toneFor(exercise.id)}
      action={<Heart id={exercise.id} name={exercise.name} />}
    />
  );
}

/** Row head shared by Home rows and the See all page: big title, SEE ALL pill, one line under it. */
export function OHead({
  id,
  title,
  line,
  seeAll,
  controls,
  as: Tag = "h2",
}: {
  id: string;
  title: string;
  line: string;
  seeAll?: string;
  /** Extra controls beside SEE ALL (the row's scroll arrows). */
  controls?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="o-wrap o-head">
      <Tag id={id} className="o-head__title">
        {title}
      </Tag>
      {seeAll || controls ? (
        <div className="o-head__controls">
          {controls}
          {seeAll ? (
            <FlowLink to={seeAll} className="o-caps o-head__all" aria-label={`See all: ${title}`}>
              See all
            </FlowLink>
          ) : null}
        </div>
      ) : null}
      <p className="o-head__line">{line}</p>
    </div>
  );
}

/**
 * One row of exercise stories that scrolls sideways (swipe, trackpad, drag with Shift+wheel). On
 * desktop, flow arrows beside SEE ALL move it by about two tiles.
 */
export function ORow({
  title,
  line,
  seeAll,
  items,
  currentDay,
  area,
}: {
  title: string;
  line: string;
  seeAll?: string;
  items: readonly Exercise[];
  currentDay: number;
  shape?: TileShape;
  /** Focus area of the row, used in every tile's meta line. */
  area?: Area;
}) {
  const headingId = useId();
  const trackRef = useRef<HTMLOListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    const tile = el?.querySelector("li");
    if (!el || !tile) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (tile.getBoundingClientRect().width + 16) * 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="o-row" aria-labelledby={headingId}>
      <OHead
        id={headingId}
        title={title}
        line={line}
        seeAll={seeAll}
        controls={
          <span className="o-row__arrows">
            <FlowIconButton direction="left" aria-label={`Scroll back: ${title}`} aria-disabled={atStart} onClick={() => !atStart && step(-1)} />
            <FlowIconButton aria-label={`Scroll on: ${title}`} aria-disabled={atEnd} onClick={() => !atEnd && step(1)} />
          </span>
        }
      />
      <Stories ref={trackRef} label={title} onScroll={update}>
        {items.map((e) => (
          <OCard key={e.id} exercise={e} currentDay={currentDay} area={area} />
        ))}
      </Stories>
    </section>
  );
}
