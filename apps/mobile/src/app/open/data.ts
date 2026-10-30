import { useCallback, useEffect, useState } from "react";
import { applyFilters, filtersFromParams, type Filters } from "../data/filters";
import { AREA_LABEL, EXERCISES, type Area, type Exercise } from "../data/library";
import { getSession, MINUTES_PER_EXERCISE } from "../data/plan";

/** Collections that have a row on Home and a See all page at /app/library/:slug. */
export type Slug = "all" | "today" | Area | "chair";

export const AREA_SLUGS: Area[] = ["knees", "lower-back", "hips-balance"];

export function isSlug(value: string): value is Slug {
  return value === "all" || value === "today" || value === "chair" || (AREA_SLUGS as string[]).includes(value);
}

const byPhase = (a: Exercise, b: Exercise) => a.phase - b.phase;

export function collection(slug: Slug, currentDay: number): Exercise[] {
  if (slug === "today") return getSession(currentDay);
  if (slug === "chair") return EXERCISES.filter((e) => e.position === "chair").sort(byPhase);
  if (slug === "all") return [...EXERCISES].sort(byPhase);
  return EXERCISES.filter((e) => e.areas.includes(slug)).sort(byPhase);
}

export const COLLECTION_TITLE: Record<Slug, string> = {
  all: "All exercises",
  today: "Today's session",
  chair: "Sit down and do these",
  knees: AREA_LABEL.knees,
  "lower-back": AREA_LABEL["lower-back"],
  "hips-balance": AREA_LABEL["hips-balance"],
};

export const COLLECTION_LINE: Record<Slug, string> = {
  all: "Every exercise in the library, in phase order.",
  today: "Your five for today, in the order you'll do them.",
  chair: "Everything you can do from a sturdy chair.",
  knees: "Strength and ease for the knees, from gentle to steady.",
  "lower-back": "Loosen and support the lower back, one slow move at a time.",
  "hips-balance": "Hip strength and balance practice, with something to hold.",
};

/* ---------- Time filter (every exercise is about 3 minutes for now) ---------- */

export type TimeBucket = "under5" | "5to10" | "10to20";
export const TIME_LABEL: Record<TimeBucket, string> = {
  under5: "Under 5 min",
  "5to10": "5–10 min",
  "10to20": "10–20 min",
};
export const TIME_BUCKETS: TimeBucket[] = ["under5", "5to10", "10to20"];

// TODO(duration): use each clip's real length once it exists.
export function minutesFor(_exercise: Exercise): number {
  return MINUTES_PER_EXERCISE;
}

function inBucket(min: number, bucket: TimeBucket) {
  if (bucket === "under5") return min < 5;
  if (bucket === "5to10") return min >= 5 && min <= 10;
  return min > 10 && min <= 20;
}

export interface OpenFilters extends Filters {
  time: TimeBucket[];
}

export function openFiltersFromParams(params: URLSearchParams): OpenFilters {
  const base = filtersFromParams(params);
  const time = (params.get("time") ?? "")
    .split(",")
    .filter((t): t is TimeBucket => (TIME_BUCKETS as string[]).includes(t));
  return { ...base, area: [], time };
}

export function openParams(f: OpenFilters, q: string): URLSearchParams {
  const p = new URLSearchParams();
  if (f.position.length) p.set("position", f.position.join(","));
  if (f.time.length) p.set("time", f.time.join(","));
  if (f.phase.length) p.set("phase", f.phase.join(","));
  if (q.trim()) p.set("q", q.trim());
  return p;
}

/** AND between groups, OR within a group. */
export function applyOpen(source: readonly Exercise[], f: OpenFilters, q: string): Exercise[] {
  return applyFilters({ area: [], position: f.position, phase: f.phase }, q, source).filter(
    (e) => !f.time.length || f.time.some((t) => inBucket(minutesFor(e), t)),
  );
}

export function openActiveCount(f: OpenFilters) {
  return f.position.length + f.time.length + f.phase.length;
}

/* ---------- Saved (hearts), kept in this browser only ---------- */

const KEY = "mobility.saved.v1";
/** Fallback when storage is blocked (private windows, previews): remembered for this visit only. */
let memory: string[] = [];

function readSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    memory = Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    /* keep memory */
  }
  return memory;
}

export function useSaved() {
  const [saved, setSaved] = useState<string[]>(readSaved);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === KEY && setSaved(readSaved());
    const onLocal = () => setSaved(readSaved());
    window.addEventListener("storage", onStorage);
    window.addEventListener("mobility-saved", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mobility-saved", onLocal);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const current = readSaved();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    memory = next;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep it for this view only */
    }
    setSaved(next);
    window.dispatchEvent(new Event("mobility-saved"));
  }, []);
  return { isSaved: (id: string) => saved.includes(id), toggle };
}
