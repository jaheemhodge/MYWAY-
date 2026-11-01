import type { FocusArea } from "@/lib/database.types";
import { getDayPlan } from "@/lib/plan";
import { applyFilters, filtersFromParams, type Filters } from "../data/filters";
import { AREA_LABEL, EXERCISES, type Area, type Exercise } from "../data/library";
import { MINUTES_PER_EXERCISE } from "../data/plan";

/** Collections that have a row on Home and a See all page at /app/library/:slug. */
export type Slug = "all" | "today" | Area | "chair";

export const AREA_SLUGS: Area[] = ["knees", "lower-back", "hips-balance"];

export function isSlug(value: string): value is Slug {
  return value === "all" || value === "today" || value === "chair" || (AREA_SLUGS as string[]).includes(value);
}

const byPhase = (a: Exercise, b: Exercise) => a.phase - b.phase;

/**
 * Exercises for a collection. "today" is the signed-in user's plan for `currentDay`, so it needs
 * their focus area; without one (profile still loading) it is empty.
 */
export function collection(slug: Slug, currentDay: number, focusArea?: FocusArea | null): Exercise[] {
  if (slug === "today") return focusArea ? getDayPlan(focusArea, currentDay).exercises : [];
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
  today: "Your exercises for today, in the order you'll do them.",
  chair: "Everything you can do from a sturdy chair.",
  knees: "Gentle strength and control for stairs, standing up and walking with ease.",
  "lower-back": "Easy movements to loosen up, support your spine and move with less stiffness.",
  "hips-balance": "Steadier on your feet, with hips that move freely through your day.",
};

/** Tile shape per collection, alternating down Home like Open's rows (square, wide, square, wide). */
export type TileShape = "square" | "wide";
export const COLLECTION_SHAPE: Record<Slug, TileShape> = {
  today: "square",
  knees: "wide",
  "lower-back": "square",
  "hips-balance": "wide",
  all: "square",
  chair: "square",
};

/** Flat soft tones for exercises with no photo yet, rotated by the exercise's place in the library. */
const TILE_TONES = ["#DCE3E8", "#E7E2DA", "#D9DFD6", "#E3DEE6"];
const INDEX = new Map(EXERCISES.map((e, i) => [e.id, i]));

export function toneFor(id: string): string {
  return TILE_TONES[(INDEX.get(id) ?? 0) % TILE_TONES.length];
}

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

/* Saved (hearts) moved to src/lib/favorites.ts + useFavorites(); same localStorage key, synced to the account. */
