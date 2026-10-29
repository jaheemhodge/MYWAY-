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

/** Cards per carousel page: 4 wide desktop, 3 narrow desktop, 2 tablet/phone, stacked on phone. */
export function useCardsPerPage(): number {
  const wide = useMediaQuery("(min-width: 75em)");
  const desktop = useMediaQuery("(min-width: 56.25em)");
  if (wide) return 4;
  if (desktop) return 3;
  return 2;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Mobility`;
  }, [title]);
}
