import type { Exercise } from "./library";

/**
 * Stand-in image for every exercise that has no still yet.
 * TODO(images): replace with a still (and later a clip) per exercise.
 */
const BASE = import.meta.env.BASE_URL;

export const IMAGE_PLACEHOLDER = `${BASE}hero/hero-portrait-woman-poster.jpg`;

/** Exercise stills, matched to the library by exercise name. All are 4:5 portrait. */
const IMAGES_BY_NAME: Record<string, string> = {
  "Sit to stand from a chair": `${BASE}exercises/k-sit-to-stand.jpg`,
  "Mini squat holding a support": `${BASE}exercises/k-mini-squat.jpg`,
  "Heel raises": `${BASE}exercises/heel-raises.jpg`,
  "Wall calf stretch": `${BASE}exercises/wall-calf-stretch.jpg`,
  Clamshell: `${BASE}exercises/clamshell.jpg`,
};

export function imageFor(exercise: Exercise): string {
  return IMAGES_BY_NAME[exercise.name] ?? IMAGE_PLACEHOLDER;
}

export function hasOwnImage(exercise: Exercise): boolean {
  return exercise.name in IMAGES_BY_NAME;
}
