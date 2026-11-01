/**
 * The ONE place that maps an exercise id to its media. Swap files here; nothing else changes.
 * Paths are relative to the Vite base URL (files live in /public).
 *
 * Only exercises with real assets are listed. Everything else renders the library's soft tile.
 */
export interface ExerciseMedia {
  videoUrl?: string;
  imageUrl?: string;
}

const BASE = import.meta.env.BASE_URL;

export const MEDIA_MAP: Readonly<Record<string, ExerciseMedia>> = {
  // Seated knee extension
  K01: { videoUrl: `${BASE}videos/day-01/day01-test-knee-extension-left-rep-v2.mp4` },
  // Sit to stand from a chair
  K04: { imageUrl: `${BASE}exercises/k-sit-to-stand.jpg` },
  // Mini squat holding a support
  K06: { imageUrl: `${BASE}exercises/k-mini-squat.jpg` },
  // Heel raises
  K07: { imageUrl: `${BASE}exercises/heel-raises.jpg` },
  // Wall calf stretch
  K08: { imageUrl: `${BASE}exercises/wall-calf-stretch.jpg` },
  // Clamshell
  G01: { imageUrl: `${BASE}exercises/clamshell.jpg` },
};

const EMPTY: ExerciseMedia = Object.freeze({});

export function mediaFor(exerciseId: string): ExerciseMedia {
  return MEDIA_MAP[exerciseId] ?? EMPTY;
}

export function hasVideo(exerciseId: string): boolean {
  return Boolean(MEDIA_MAP[exerciseId]?.videoUrl);
}
