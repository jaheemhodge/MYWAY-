import type { Exercise, Position } from "./library";

const BASE = import.meta.env.BASE_URL;

/** Exercise stills, matched to the library by exercise name. All are 4:5 portrait. */
const IMAGES_BY_NAME: Record<string, string> = {
  "Sit to stand from a chair": `${BASE}exercises/k-sit-to-stand.jpg`,
  "Mini squat holding a support": `${BASE}exercises/k-mini-squat.jpg`,
  "Heel raises": `${BASE}exercises/heel-raises.jpg`,
  "Wall calf stretch": `${BASE}exercises/wall-calf-stretch.jpg`,
  Clamshell: `${BASE}exercises/clamshell.jpg`,
};

/**
 * The exercise's own still, or undefined when it has none yet.
 * Exercises without a still show a soft sage tile with their position word instead,
 * never another exercise's photo.
 * TODO(images): add a still (and later a clip) for every exercise.
 */
export function imageFor(exercise: Exercise): string | undefined {
  return IMAGES_BY_NAME[exercise.name];
}

/** Word shown on the placeholder tile. */
export const PLACEHOLDER_WORD: Record<Position, string> = {
  chair: "Chair",
  standing: "Standing",
  floor: "Floor",
};
