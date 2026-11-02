import { EXERCISES } from "@/app/data/library";

/**
 * The ONE place that maps an exercise id to its media. Swap files here; nothing else changes.
 * Paths are relative to the Vite base URL (files live in /public).
 *
 * Every exercise has a 16:9 coach still at /coach/<id>.jpg. Knees Day 1 clips live at
 * /coach/video/<id>.mp4. Everything else leaves videoUrl empty and the player uses the still.
 */

/** Exercises that have a silent coach clip. Everyone else is still-only. */
const VIDEO_IDS = new Set(["K01", "K02", "K03", "K04", "K06"]);

export interface ExerciseMedia {
  videoUrl?: string;
  imageUrl?: string;
}

const BASE = import.meta.env.BASE_URL;

export const MEDIA_MAP: Readonly<Record<string, ExerciseMedia>> = Object.fromEntries(
  EXERCISES.map((exercise) => [
    exercise.id,
    {
      imageUrl: `${BASE}coach/${exercise.id}.jpg`,
      ...(VIDEO_IDS.has(exercise.id) ? { videoUrl: `${BASE}coach/video/${exercise.id}.mp4` } : {}),
    },
  ]),
);

const EMPTY: ExerciseMedia = Object.freeze({});

export function mediaFor(exerciseId: string): ExerciseMedia {
  return MEDIA_MAP[exerciseId] ?? EMPTY;
}

export function hasVideo(exerciseId: string): boolean {
  return Boolean(MEDIA_MAP[exerciseId]?.videoUrl);
}
