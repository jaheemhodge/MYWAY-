import type { Exercise } from "./library";

/**
 * Stand-in image for every exercise that has no still yet.
 * TODO(images): replace with a still (and later a clip) per exercise.
 */
export const IMAGE_PLACEHOLDER = "/hero/hero-portrait-woman-poster.jpg";

/** Exercise stills, matched to the library by exercise name. All are 4:5 portrait. */
const IMAGES_BY_NAME: Record<string, string> = {
  "Sit to stand from a chair": "/exercises/k-sit-to-stand.jpg",
  "Mini squat holding a support": "/exercises/k-mini-squat.jpg",
  "Heel raises": "/exercises/heel-raises.jpg",
  "Wall calf stretch": "/exercises/wall-calf-stretch.jpg",
  Clamshell: "/exercises/clamshell.jpg",
};

export function imageFor(exercise: Exercise): string {
  return IMAGES_BY_NAME[exercise.name] ?? IMAGE_PLACEHOLDER;
}

export function hasOwnImage(exercise: Exercise): boolean {
  return exercise.name in IMAGES_BY_NAME;
}
