import { mediaFor } from "@/data/mediaMap";
import type { Exercise, Position } from "./library";

/**
 * Exercise stills and clips come from src/data/mediaMap.ts (by exercise id). These helpers keep
 * the old call sites working; add or swap files in the map, not here.
 * Stills are the 16:9 coach photos in /coach/<id>.jpg.
 */

/**
 * The exercise's own still, or undefined when it has none yet.
 * Exercises without a still show a soft sage tile with their position word instead,
 * never another exercise's photo.
 */
export function imageFor(exercise: Pick<Exercise, "id">): string | undefined {
  return mediaFor(exercise.id).imageUrl;
}

/** The exercise's demonstration clip, or undefined ("Video coming soon"). */
export function videoFor(exercise: Pick<Exercise, "id">): string | undefined {
  return mediaFor(exercise.id).videoUrl;
}

/** Word shown on the placeholder tile. */
export const PLACEHOLDER_WORD: Record<Position, string> = {
  chair: "Chair",
  standing: "Standing",
  floor: "Floor",
};
