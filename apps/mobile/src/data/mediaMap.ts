import { EXERCISES } from "@/app/data/library";

/**
 * The ONE place that maps an exercise id to its media. Swap files here; nothing else changes.
 * Paths are relative to the Vite base URL (files live in /public).
 *
 * Every exercise has a 16:9 coach still at /coach/<id>.jpg. videoUrl stays empty until a clip
 * exists; the session player then shows the still (Ken Burns while the set is running).
 */

export interface ExerciseMedia {
  videoUrl?: string;
  imageUrl?: string;
}

const BASE = import.meta.env.BASE_URL;

export const MEDIA_MAP: Readonly<Record<string, ExerciseMedia>> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, { imageUrl: `${BASE}coach/${exercise.id}.jpg` }]),
);

const EMPTY: ExerciseMedia = Object.freeze({});

export function mediaFor(exerciseId: string): ExerciseMedia {
  return MEDIA_MAP[exerciseId] ?? EMPTY;
}

export function hasVideo(exerciseId: string): boolean {
  return Boolean(MEDIA_MAP[exerciseId]?.videoUrl);
}
