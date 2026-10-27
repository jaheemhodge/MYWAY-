import { useEffect, useRef, useState } from "react";

function query(media: string): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(media).matches;
}

/** True while `media` matches. Updates when the viewport or a system setting changes. */
export function useMediaQuery(media: string): boolean {
  const [matches, setMatches] = useState(() => query(media));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(media);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [media]);
  return matches;
}

/** Every animated element on the landing page reads this and falls back to a still, complete version. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Whether the element is on screen. With `once`, it stays true after the first sighting.
 * Without IntersectionObserver it reports true, so content is never left hidden.
 */
export function useInView<T extends Element>({ once = false, rootMargin = "0px 0px -15% 0px" } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin]);
  return [ref, inView] as const;
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
