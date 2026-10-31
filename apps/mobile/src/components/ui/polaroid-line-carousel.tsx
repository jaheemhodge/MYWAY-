import * as React from "react";
import { FlowIconButton } from "./flow-button";

/*
 * Polaroid Line Carousel: instant photos pegged to a sagging string. Drag the line (or use the
 * arrows or ←/→) and the prints slide along it, swinging on their pegs with the speed you give
 * them and settling back. The print in the middle is the current one.
 *
 * Adapted for Mobility from "Polaroid Line Carousel" (21st.dev). Changes from the original:
 * - No painted landscapes: a slide without a photo shows a soft solid tone (`tone`), never an
 *   invented picture.
 * - No autoplay: rows only move when someone drags, clicks or presses an arrow.
 * - Text is 18px minimum in the page's font (no serif, no monospace); arrow buttons are 56px
 *   "flow" buttons (see flow-button.tsx).
 * - The caption bar sits below the string in normal flow (not over the prints), with room for
 *   per-slide actions (the heart) and an `onOpen` for the centred print (click or Enter).
 * - Transparent background so the page shows through; the stage height follows the card size.
 * - prefers-reduced-motion: no swing or breeze, the line still moves to the chosen print.
 */

export type Slide = {
  key: string;
  image?: string;
  /** Solid colour shown when there is no image. */
  tone?: string;
  /** Written on the print. */
  title: string;
  /** Shown under the line for the centred print. */
  caption?: string;
  alt?: string;
};

export type PolaroidLineCarouselProps = {
  slides: Slide[];
  /** Largest print width in px (it shrinks on narrow screens). */
  cardWidth?: number;
  /** How far the string sags in the middle, px. */
  sag?: number;
  /** How much the prints swing; 0 holds them still. */
  swing?: number;
  /** Colour of the string. */
  string?: string;
  /** Called when the centred print is clicked or Enter is pressed. */
  onOpen?: (index: number) => void;
  /** Extra controls for the centred slide, shown in the caption bar (e.g. a save button). */
  actions?: (index: number) => React.ReactNode;
  onChange?: (index: number) => void;
  className?: string;
  ariaLabel?: string;
};

// #region logic
export function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}

/** Height of a string sagging by `sag` between (0, y0) and (w, y0), at x. */
export function stringY(x: number, w: number, y0: number, sag: number): number {
  const t = clamp(x / w, 0, 1);
  return y0 + 4 * sag * t * (1 - t);
}

/** One step of a critically damped spring toward target. */
export function springStep(x: number, v: number, target: number, dt: number, k = 70): [number, number] {
  const c = 2 * Math.sqrt(k);
  const nv = v + (k * (target - x) - c * v) * dt;
  return [x + nv * dt, nv];
}

/** One step of a print's swing: lags behind the line's motion, pulled back by gravity, damped. */
export function swingStep(a: number, w: number, lineVel: number, dt: number, gain: number): [number, number] {
  const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt;
  return [clamp(a + nw * dt, -0.6, 0.6), nw];
}

/** Index of the print nearest the centre for a line offset. */
export function nearestAt(off: number, spacing: number, n: number): number {
  return clamp(Math.round(off / spacing), 0, Math.max(0, n - 1));
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}
// #endregion logic

const Y0 = 28; // string height at the edges
const NOTE_H = 52; // the written strip under the photo
const PEG_GAP = 10; // print starts this far below the peg top

const PL_CSS = `
.pl-root{position:relative;width:100%;color:var(--pl-ink)}
.pl-stage{position:relative;width:100%;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;cursor:grab}
.pl-stage[data-drag='1']{cursor:grabbing}
.pl-stage:focus-visible{outline:2px solid var(--pl-ink);outline-offset:-2px}
.pl-string{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.pl-card{position:absolute;left:0;top:0;width:var(--pl-cw);transform-origin:50% 0;will-change:transform;cursor:inherit}
.pl-print{margin-top:${PEG_GAP}px;background:#fbfaf7;padding:10px 10px 0;box-shadow:0 1px 2px rgba(15,20,24,.12),0 18px 30px -16px rgba(15,20,24,.4);transition:transform .5s cubic-bezier(.2,.7,.2,1),filter .5s ease}
.pl-card[data-on='0'] .pl-print{transform:scale(.9);filter:saturate(.75) brightness(.97)}
.pl-shot{position:relative;aspect-ratio:1;overflow:hidden;background:#e4e6ee}
.pl-shot img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}
.pl-note{height:${NOTE_H}px;display:flex;align-items:center;justify-content:center;padding:0 8px;font-size:18px;line-height:1.1;color:#24211c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-note span{overflow:hidden;text-overflow:ellipsis}
.pl-peg{position:absolute;left:50%;top:0;width:10px;height:26px;margin-left:-5px;border-radius:2px;background:linear-gradient(90deg,#c9a67a,#e3c9a1 45%,#b8915f);box-shadow:0 2px 3px rgba(0,0,0,.25)}
.pl-peg::after{content:'';position:absolute;left:4px;top:8px;width:2px;height:7px;background:rgba(80,60,30,.45);border-radius:1px}
.pl-bar{display:flex;align-items:center;gap:12px 16px;padding-top:8px}
.pl-cap{flex:1;min-width:0;overflow:hidden;padding-bottom:.15em}
.pl-cap>*{display:block;animation:pl-in .45s cubic-bezier(.2,.8,.2,1) both}
.pl-title{font-size:20px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-open{appearance:none;display:flex;align-items:center;max-width:100%;min-height:56px;margin:-14px 0 -12px;padding:0;border:0;background:none;color:inherit;font:inherit;font-size:20px;text-align:left;cursor:pointer}
.pl-open:focus-visible{outline:2px solid var(--pl-ink);outline-offset:2px}
@media (hover:hover) and (pointer:fine){.pl-open:hover{text-decoration:underline;text-underline-offset:.18em}}
.pl-sub{margin-top:2px;font-size:18px;line-height:1.35;color:var(--pl-muted)}
.pl-count{font-size:18px;font-variant-numeric:tabular-nums;color:var(--pl-muted);white-space:nowrap}
.pl-count b{color:var(--pl-ink);font-weight:400}
.pl-btn{appearance:none;flex:none;width:56px;height:56px;border-radius:50%;border:1px solid var(--pl-line);background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer;transition:background-color .2s ease,color .2s ease,transform .16s cubic-bezier(.23,1,.32,1)}
.pl-btn:active{transform:scale(.96)}
.pl-btn[aria-disabled='true']{opacity:.35;cursor:not-allowed}
@media (hover:hover) and (pointer:fine){.pl-btn:not([aria-disabled='true']):hover{background:var(--pl-ink);color:#fff}}
.pl-btn:focus-visible{outline:2px solid var(--pl-ink);outline-offset:3px}
.pl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes pl-in{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}
@media (max-width:47.99em){.pl-count{display:none}}
@media (prefers-reduced-motion:reduce){.pl-cap>*{animation:none}.pl-print,.pl-btn{transition:none}}
`;

export default function PolaroidLineCarousel({
  slides,
  cardWidth = 280,
  sag = 40,
  swing = 1,
  string = "rgba(15,20,24,.45)",
  onOpen,
  actions,
  onChange,
  className,
  ariaLabel = "Exercises",
}: PolaroidLineCarouselProps) {
  const n = slides.length;
  const [active, setActive] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [size, setSize] = React.useState({ w: 1200, cw: cardWidth });
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const cards = React.useRef<(HTMLDivElement | null)[]>([]);
  const sim = React.useRef({ off: 0, vel: 0, target: 0, a: [] as number[], w: [] as number[] });
  const drag = React.useRef<null | { x: number; off: number; lx: number; lt: number; v: number; moved: boolean }>(null);
  const activeRef = React.useRef(0);
  const opts = React.useRef({ sag, swing });
  opts.current = { sag, swing };

  const spacing = size.cw * 1.08;
  const stageH = Y0 + sag + PEG_GAP + size.cw + 10 + NOTE_H + 14;

  const goTo = React.useCallback(
    (i: number) => {
      sim.current.target = clamp(i, 0, n - 1) * spacing;
    },
    [n, spacing],
  );

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      const cw = Math.round(clamp(w * 0.55, 170, cardWidth));
      setSize({ w, cw });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardWidth]);

  // keep the active print centred when the spacing changes
  React.useEffect(() => {
    sim.current.target = activeRef.current * spacing;
    sim.current.off = activeRef.current * spacing;
  }, [spacing]);

  React.useEffect(() => {
    onChange?.(active);
  }, [active, onChange]);

  // the simulation, written straight to the DOM each frame while the row is on screen
  React.useEffect(() => {
    const root = stageRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    let prev = performance.now();
    const S = sim.current;
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const { w, cw } = size;
      const d = drag.current;
      let lineVel: number;
      if (d && d.moved) {
        lineVel = d.v * 1000;
      } else {
        const before = S.off;
        [S.off, S.vel] = springStep(S.off, S.vel, S.target, dt);
        lineVel = -(S.off - before) / Math.max(dt, 1e-3);
      }
      const o = opts.current;
      const g = reduce ? 0 : o.swing;
      const near = nearestAt(S.off, spacing, n);
      for (let i = 0; i < n; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const x = w / 2 + i * spacing - S.off;
        if (x < -cw * 1.5 || x > w + cw * 1.5) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        let a = S.a[i] || 0;
        let av = S.w[i] || 0;
        [a, av] = swingStep(a, av, lineVel, dt, g);
        if (g) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * g;
        S.a[i] = a;
        S.w[i] = av;
        const y = stringY(x, w, Y0, o.sag) - 6;
        el.style.transform = `translate(${(x - cw / 2).toFixed(1)}px,${y.toFixed(1)}px) rotate(${a.toFixed(4)}rad)`;
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near));
      }
      pathRef.current?.setAttribute("d", `M0 ${Y0} Q${w / 2} ${Y0 + 2 * o.sag} ${w} ${Y0}`);
      if (near !== activeRef.current) {
        activeRef.current = near;
        setActive(near);
      }
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(root);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [size, spacing, n]);

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, off: sim.current.off, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      stageRef.current?.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v;
    d.lx = e.clientX;
    d.lt = e.timeStamp;
    const max = (n - 1) * spacing;
    let off = d.off - dx;
    if (off < 0) off *= 0.35;
    if (off > max) off = max + (off - max) * 0.35;
    sim.current.off = off;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      setDragging(false);
      sim.current.vel = -d.v * 1000;
      goTo(nearestAt(sim.current.off - d.v * 180, spacing, n));
      return;
    }
    const card = (e.target as HTMLElement).closest("[data-i]");
    if (!card) return;
    const i = Number(card.getAttribute("data-i"));
    if (i === activeRef.current) onOpen?.(i);
    else goTo(i);
  };
  const step = (dir: number) => goTo(clamp(activeRef.current + dir, 0, n - 1));
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Enter" || e.key === " ") onOpen?.(activeRef.current);
    else return;
    e.preventDefault();
  };

  const s = slides[active];

  return (
    <div
      className={["pl-root", className].filter(Boolean).join(" ")}
      style={{
        ["--pl-ink" as string]: "var(--ink, #0f1418)",
        ["--pl-muted" as string]: "var(--ink-2, rgba(15,20,24,.84))",
        ["--pl-line" as string]: "var(--line, rgba(15,20,24,.3))",
        ["--pl-cw" as string]: size.cw + "px",
      }}
    >
      <style>{PL_CSS}</style>
      <div
        ref={stageRef}
        className="pl-stage"
        style={{ height: stageH }}
        data-drag={dragging ? "1" : "0"}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${ariaLabel}. Left and right arrows move along the line, Enter opens the one in the middle.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <svg className="pl-string" aria-hidden="true">
          <path ref={pathRef} fill="none" stroke={string} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {slides.map((sl, i) => (
          <div
            key={sl.key}
            className="pl-card"
            data-i={i}
            data-on={i === active ? "1" : "0"}
            ref={(el) => void (cards.current[i] = el)}
            aria-hidden="true"
          >
            <div className="pl-print">
              <div className="pl-shot" style={sl.image ? undefined : { background: sl.tone }}>
                {sl.image ? <img src={sl.image} alt="" draggable={false} loading="lazy" decoding="async" /> : null}
              </div>
              <div className="pl-note">
                <span>{sl.title}</span>
              </div>
            </div>
            <div className="pl-peg" />
          </div>
        ))}
      </div>
      <div className="pl-bar">
        <div className="pl-cap" key={active}>
          {s ? (
            onOpen ? (
              <button type="button" className="pl-title pl-open" onClick={() => onOpen(active)}>
                {s.title}
              </button>
            ) : (
              <span className="pl-title">{s.title}</span>
            )
          ) : null}
          {s?.caption ? <span className="pl-sub">{s.caption}</span> : null}
        </div>
        {actions && s ? actions(active) : null}
        <span className="pl-count" aria-hidden="true">
          <b>{pad2(active + 1)}</b> / {pad2(n)}
        </span>
        <FlowIconButton direction="left" aria-label="Previous exercise" aria-disabled={active === 0} onClick={() => step(-1)} />
        <FlowIconButton aria-label="Next exercise" aria-disabled={active === n - 1} onClick={() => step(1)} />
      </div>
      <div className="pl-sr" aria-live="polite">
        {s ? `${active + 1} of ${n}: ${s.title}${s.caption ? `, ${s.caption}` : ""}` : ""}
      </div>
    </div>
  );
}
