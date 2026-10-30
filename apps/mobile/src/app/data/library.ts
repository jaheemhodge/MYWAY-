/**
 * Exercise library for the logged-in shell.
 *
 * Source: src/data/library-slim.json (56 exercises, derived from library.json).
 * Status: DRAFT, not clinically reviewed. Names, setup, cues and safety notes are shown verbatim;
 * do not edit them here or add claims.
 */
import raw from "@/data/library-slim.json";

export type Area = "knees" | "lower-back" | "hips-balance";
export type Position = "chair" | "standing" | "floor";
export type PhaseNumber = 1 | 2 | 3;

export interface Exercise {
  id: string;
  name: string;
  subtitle: string;
  areas: Area[];
  primaryArea: Area;
  position: Position;
  positionDetail?: string;
  phase: PhaseNumber;
  equipment: string;
  setup: string;
  cues: string[];
  safetyNotes: string[];
  difficulty?: number;
}

export const EXERCISES: readonly Exercise[] = (raw as { exercises: Exercise[] }).exercises;

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export function requireExercise(id: string): Exercise {
  const exercise = BY_ID.get(id);
  if (!exercise) throw new Error(`Unknown exercise id: ${id}`);
  return exercise;
}

export const AREA_LABEL: Record<Area, string> = {
  knees: "Knees",
  "lower-back": "Lower back",
  "hips-balance": "Hips & balance",
};

export const POSITION_LABEL: Record<Position, string> = {
  chair: "Chair",
  standing: "Standing",
  floor: "Floor or bed",
};

export const AREAS: readonly Area[] = ["knees", "lower-back", "hips-balance"];
export const POSITIONS: readonly Position[] = ["chair", "standing", "floor"];
export const PHASES: readonly PhaseNumber[] = [1, 2, 3];

/** Shorter names for cards only. The exercise page and player keep the full name. */
const SHORT_NAMES: Record<string, string> = {
  "Sit to stand from a chair": "Sit to stand",
  "Mini squat holding a support": "Mini squat at a chair",
};

export function displayName(exercise: Exercise): string {
  return SHORT_NAMES[exercise.name] ?? exercise.name;
}
