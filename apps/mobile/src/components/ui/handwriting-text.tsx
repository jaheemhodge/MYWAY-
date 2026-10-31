import { useEffect, useRef, useState } from "react";

/**
 * Text that writes itself, then inks in. Adapted for Mobility from "Handwriting Text" (21st.dev, MIT).
 *
 * How it works (from the original):
 * 1. The font is parsed from its raw TTF with opentype.js and the glyphs turned into SVG paths,
 *    so there is an outline to stroke.
 * 2. Every contour is its own <path>, with staggered delays, so the pen crosses the word left
 *    to right (a dash pattern restarts at each subpath).
 * 3. One filled copy of the whole word sits underneath and fades in as the stroke finishes, so
 *    counters (the hole in an "e") stay holes.
 *
 * Changes for this app:
 * - No Tailwind: inline styles only. No "use client" (this is Vite, not Next).
 * - Writes when it first scrolls into view (once), not on mount, so headings further down the
 *   page are not already finished by the time you reach them.
 * - prefers-reduced-motion: the word appears inked, with no pen animation.
 * - Accessibility: the real text sits in a visually hidden span and the SVG is aria-hidden, so a
 *   heading that wraps this still reads as its words, not as an image.
 * - Until the font loads (or if it never does), the plain text shows, so nothing is ever blank.
 *
 * opentype.js comes from a CDN as a plain <script> on first use (one fetch per page). The font
 * default is the component's original handwriting face; pass `fontUrl` to self-host it.
 */

const OPENTYPE_CDN = "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";

export const HANDWRITING_FONT_URL =
  "https://cdn.21st.dev/assets/mirror/13/1347863151acdc00fa281daaba1a3543dbce5870b55f9cf7479a15bb84007681.ttf";

export interface HandwritingTextProps {
  /** The phrase to write. */
  text: string;
  /** URL of a .ttf or .otf. Must be CORS-readable. */
  fontUrl?: string;
  /** Seconds for the pen to cross the whole word. */
  duration?: number;
  /** Seconds before the pen starts once the word is in view. */
  delay?: number;
  /** Stroke weight, in units of a 100px em. */
  strokeWidth?: number;
  /** Ink the letters in once drawn. */
  fill?: boolean;
  /** CSS height of the rendered word; width follows the glyphs. */
  height?: string;
  className?: string;
}

type Geometry = { full: string; contours: string[]; x: number; y: number; w: number; h: number };

/* eslint-disable @typescript-eslint/no-explicit-any */

let libPromise: Promise<any> | null = null;

function loadOpentype(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const existing = (window as any).opentype;
  if (existing) return Promise.resolve(existing);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = OPENTYPE_CDN;
      script.async = true;
      script.onload = () => {
        const lib = (window as any).opentype;
        if (lib) resolve(lib);
        else reject(new Error("opentype.js loaded but exposed nothing"));
      };
      script.onerror = () => {
        libPromise = null;
        reject(new Error("opentype.js failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return libPromise;
}

const fontCache = new Map<string, Promise<any>>();

function loadFont(url: string): Promise<any> {
  let pending = fontCache.get(url);
  if (!pending) {
    pending = Promise.all([
      loadOpentype(),
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`Font request failed: ${res.status}`);
        return res.arrayBuffer();
      }),
    ]).then(([lib, buffer]) => lib.parse(buffer));
    pending.catch(() => fontCache.delete(url));
    fontCache.set(url, pending);
  }
  return pending;
}

const EM = 100;

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function HandwritingText({
  text,
  fontUrl = HANDWRITING_FONT_URL,
  duration = 1.5,
  delay = 0.05,
  strokeWidth = 1.6,
  fill = true,
  height = "1.15em",
  className,
}: HandwritingTextProps) {
  const [font, setFont] = useState<any>(null);
  const [geom, setGeom] = useState<Geometry | null>(null);
  const [inView, setInView] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [lengths, setLengths] = useState<number[]>([]);
  const [reduce, setReduce] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setReduce(Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
    let cancelled = false;
    loadFont(fontUrl)
      .then((f) => {
        if (!cancelled) setFont(f);
      })
      .catch(() => {
        /* stays as plain text */
      });
    return () => {
      cancelled = true;
    };
  }, [fontUrl]);

  // Write once, the first time the word scrolls into view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || inView) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!font || !text) return;
    const path = font.getPath(text, 0, EM, EM);
    const box = path.getBoundingBox();
    const pad = EM * 0.12;
    const full = path.toPathData(2);
    setGeom({
      full,
      contours: full.split(/(?=M)/).filter((d: string) => d.trim().length > 1),
      x: box.x1 - pad,
      y: box.y1 - pad,
      w: box.x2 - box.x1 + pad * 2,
      h: box.y2 - box.y1 + pad * 2,
    });
    setDrawn(false);
    setLengths([]);
  }, [font, text]);

  useEffect(() => {
    if (!geom) return undefined;
    setLengths(pathRefs.current.slice(0, geom.contours.length).map((el) => (el ? el.getTotalLength() : 0)));
    if (!inView) return undefined;
    // Two frames: commit full-length offsets with no transition, then animate to zero.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setDrawn(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [geom, inView]);

  if (!geom) {
    return (
      <span ref={wrapRef} className={className}>
        {text}
      </span>
    );
  }

  const count = Math.max(1, geom.contours.length);
  const done = drawn || reduce;

  return (
    <span ref={wrapRef} className={className} style={{ display: "inline-block", lineHeight: 0, verticalAlign: "baseline" }}>
      <span style={srOnly}>{text}</span>
      <svg
        viewBox={`${geom.x} ${geom.y} ${geom.w} ${geom.h}`}
        aria-hidden="true"
        focusable="false"
        style={{ display: "inline-block", height, width: `calc(${height} * ${(geom.w / geom.h).toFixed(4)})`, overflow: "visible" }}
      >
        {fill && (
          <path
            d={geom.full}
            fill="currentColor"
            stroke="none"
            style={{
              opacity: done ? 1 : 0,
              transition: drawn && !reduce ? `opacity 0.45s ease-out ${(delay + duration * 0.72).toFixed(3)}s` : "none",
            }}
          />
        )}
        {geom.contours.map((d, i) => {
          const length = lengths[i] || 0;
          const each = (duration / count) * 2.4;
          const start = delay + (i / count) * duration;
          return (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: length || 1,
                strokeDashoffset: done ? 0 : length || 1,
                transition: drawn && !reduce ? `stroke-dashoffset ${each.toFixed(3)}s ease-out ${start.toFixed(3)}s` : "none",
              }}
            />
          );
        })}
      </svg>
    </span>
  );
}

export default HandwritingText;
