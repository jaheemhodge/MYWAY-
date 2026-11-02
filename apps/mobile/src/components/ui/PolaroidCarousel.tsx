import * as React from "react";
import "./polaroid-carousel.css";

/**
 * PolaroidCarousel: prints hanging from a sagging string on wooden pegs.
 *
 * The centred print is the active one (full size, straight); the others sit along the string to each
 * side, smaller and tilted, following the sag. Changing slide swings every print on its peg and lets
 * it settle. Drag/swipe, click a side print, arrow keys, prev/next buttons, or autoplay (paused on
 * hover, focus and drag). Under prefers-reduced-motion: no swing, no autoplay, a plain slide.
 *
 * Plain React + CSS, no dependencies.
 */

export type PolaroidSlide = { image: string; title: string; caption: string; alt: string };

export type PolaroidCarouselProps = {
  slides: PolaroidSlide[];
  /** Total height in px: the string stage plus the bottom bar. */
  height?: number;
  /** Width of the active print in px (scaled down on narrow screens so the sides still show). */
  cardWidth?: number;
  /** Autoplay interval in ms; 0 turns it off. */
  autoplay?: number;
  stringColor?: string;
  ink?: string;
  /** Accessible name of the carousel region. */
  label?: string;
  className?: string;
};

const BAR = 128;
const SPRING = "cubic-bezier(.3,1.3,.5,1)";
const MOVE = `left .8s ${SPRING}, top .8s ${SPRING}, transform .8s ${SPRING}, opacity .45s ease`;

function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = React.useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  React.useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

export function PolaroidCarousel({
  slides,
  height = 640,
  cardWidth = 280,
  autoplay = 4500,
  stringColor = "#5E7380",
  ink = "#0F1418",
  label = "Photos",
  className,
}: PolaroidCarouselProps) {
  const N = slides.length;
  const reduce = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [swingKey, setSwingKey] = React.useState(0);
  const [dragDx, setDragDx] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [width, setWidth] = React.useState(1200);
  const [interacting, setInteracting] = React.useState(false);

  const stageRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef(0);
  activeRef.current = active;
  const hover = React.useRef(false);
  const focus = React.useRef(false);
  const drag = React.useRef<{ x0: number; id: number; moved: boolean } | null>(null);
  const lastOffs = React.useRef<number[]>([]);

  const go = React.useCallback(
    (index: number, direction?: number) => {
      if (!N) return;
      const next = ((index % N) + N) % N;
      if (next === activeRef.current) return;
      setDir(direction ?? (index > activeRef.current ? 1 : -1));
      setActive(next);
      if (!reduce) setSwingKey((k) => k + 1);
    },
    [N, reduce],
  );

  // stage width drives the layout and the string's curve
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth || 1200);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // autoplay: off under reduced motion; paused on hover, focus and drag
  React.useEffect(() => {
    if (!autoplay || reduce || N < 2) return;
    const id = window.setInterval(() => {
      if (hover.current || focus.current || drag.current) return;
      go(activeRef.current + 1, 1);
    }, autoplay);
    return () => window.clearInterval(id);
  }, [autoplay, reduce, N, go]);

  const mobile = width < 640;
  const stageH = Math.max(280, height - BAR);
  const cw = Math.round(Math.min(cardWidth, width * 0.56));
  const gap = cw * (mobile ? 0.78 : 0.95);
  const y0 = mobile ? 30 : 36;
  const sag = Math.min(mobile ? 42 : 72, stageH * 0.14);

  const offs: number[] = [];
  const cards = slides.map((slide, i) => {
    let off = (((i - active) % N) + N) % N;
    if (off > N / 2) off -= N;
    offs[i] = off;
    const prev = lastOffs.current[i];
    const jump = prev !== undefined && Math.abs(prev - off) > 1.5;
    const cx = width / 2 + off * gap + dragDx;
    const t = Math.max(-1, Math.min(1, (cx - width / 2) / (width / 2)));
    const pegY = y0 + sag * (1 - t * t) - 14;
    const isActive = off === 0;
    const tilt = isActive ? 0 : Math.sign(off) * (3.5 + Math.abs(off) * 1.8) * (i % 2 ? 1 : 0.75);
    const hidden = Math.abs(off) >= 3;
    return {
      slide,
      i,
      off,
      isActive,
      hidden,
      amp: dir * (isActive ? -5 : -8) * (i % 2 ? 1 : 0.8),
      style: {
        left: Math.round(cx),
        top: Math.round(pegY),
        width: cw,
        zIndex: 10 - Math.abs(off),
        opacity: hidden ? 0 : 1,
        transform: `translateX(-50%) scale(${isActive ? 1 : 0.8}) rotate(${tilt.toFixed(2)}deg)`,
        transition: dragging || reduce || jump ? "none" : MOVE,
      } as React.CSSProperties,
    };
  });

  React.useEffect(() => {
    lastOffs.current = offs;
  });

  /* ---- pointer: drag / swipe ---- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    drag.current = { x0: e.clientX, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      // capture only once it is a real drag, so plain taps still click the prints
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (d.moved) setDragDx(dx);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    const dx = e.clientX - d.x0;
    setDragging(false);
    setDragDx(0);
    if (dx < -60) go(activeRef.current + 1, 1);
    else if (dx > 60) go(activeRef.current - 1, -1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1, -1);
    }
  };

  const current = slides[active];
  if (!current) return null;
  const autoplaying = !!autoplay && !reduce && N > 1 && !interacting;

  return (
    <div
      className={["pc", className].filter(Boolean).join(" ")}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ "--pc-ink": ink, "--pc-string": stringColor } as React.CSSProperties}
      onMouseEnter={() => {
        hover.current = true;
        setInteracting(true);
      }}
      onMouseLeave={() => {
        hover.current = false;
        setInteracting(focus.current);
      }}
      onFocus={() => {
        focus.current = true;
        setInteracting(true);
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        focus.current = false;
        setInteracting(hover.current);
      }}
    >
      <div
        ref={stageRef}
        className={"pc-stage" + (dragging ? " is-drag" : "")}
        style={{ height: stageH }}
        tabIndex={0}
        aria-label={`${label}. Use the left and right arrow keys to browse.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg className="pc-string" viewBox={`0 0 ${width} ${stageH}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d={`M0 ${y0} Q${width / 2} ${y0 + 2 * sag} ${width} ${y0}`} />
        </svg>

        {cards.map((c) => (
          <div key={c.i} className={"pc-slot" + (c.isActive ? "" : " is-side")} style={c.style} aria-hidden={c.isActive ? undefined : true}>
            <div
              key={swingKey}
              className={"pc-hang" + (swingKey > 0 && !reduce ? " pc-swing" : "")}
              style={{ "--amp": `${c.amp.toFixed(1)}deg` } as React.CSSProperties}
            >
              <span className="pc-peg" aria-hidden="true" />
              <button
                type="button"
                className="pc-card"
                tabIndex={-1}
                aria-label={c.isActive ? c.slide.title : `Show ${c.slide.title}`}
                onClick={() => {
                  if (!c.isActive) go(c.i, c.off > 0 ? 1 : -1);
                }}
              >
                <img src={c.slide.image} alt={c.slide.alt} width={512} height={512} loading="lazy" decoding="async" draggable={false} />
                <span className="pc-lip" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pc-bar">
        <div className="pc-text" aria-live={autoplaying ? "off" : "polite"} aria-atomic="true">
          <p className="pc-title">{current.title}</p>
          <p className="pc-caption">{current.caption}</p>
        </div>
        <div className="pc-controls">
          <span className="pc-count">
            <span className="pc-sr">Slide </span>
            {pad2(active + 1)} / {pad2(N)}
          </span>
          <button type="button" className="pc-btn" aria-label="Previous" onClick={() => go(active - 1, -1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="pc-btn" aria-label="Next" onClick={() => go(active + 1, 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PolaroidCarousel;
