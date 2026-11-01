/**
 * The questions asked at onboarding (stored as the "baseline" questionnaire) and at the Day 30 /
 * Day 60 re-checks. Answers are saved as plain JSON with these keys and values, so Progress can
 * show them side by side:
 *   { day_to_day: "easy" | "some_days" | "most_days" | "achy",
 *     easier: string[]            // onboarding and re-checks
 *     age_range?: string          // onboarding only
 *     compared?: "easier" | "same" | "harder" }  // re-checks only
 */

export interface Choice {
  value: string;
  label: string;
}

export const DAY_TO_DAY: Choice[] = [
  { value: "easy", label: "Mostly easy" },
  { value: "some_days", label: "A bit stiff some days" },
  { value: "most_days", label: "Stiff most days" },
  { value: "achy", label: "Sore or achy most days" },
];

export const AGE_RANGES: Choice[] = [
  { value: "Under 50", label: "Under 50" },
  { value: "50–59", label: "50–59" },
  { value: "60–70", label: "60–70" },
  { value: "Over 70", label: "Over 70" },
];

export const EASIER: Choice[] = [
  { value: "stairs", label: "Climb the stairs" },
  { value: "chair", label: "Get up from a chair" },
  { value: "floor", label: "Get down to the floor and back up" },
  { value: "walk", label: "Walk further" },
  { value: "bend", label: "Bend down to pick things up" },
  { value: "balance", label: "Feel steady on my feet" },
];

export const COMPARED: Choice[] = [
  { value: "easier", label: "Easier than when I started" },
  { value: "same", label: "About the same" },
  { value: "harder", label: "Harder than when I started" },
];

export function labelFor(list: Choice[], value: unknown): string | null {
  if (typeof value !== "string") return null;
  return list.find((c) => c.value === value)?.label ?? null;
}

export function labelsFor(list: Choice[], value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => labelFor(list, v)).filter((v): v is string => Boolean(v));
}
