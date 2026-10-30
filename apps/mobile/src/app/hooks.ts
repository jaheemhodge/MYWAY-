import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Shell breakpoint from the brief: desktop at 900px and up. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 56.25em)");
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Mobility`;
  }, [title]);
}
