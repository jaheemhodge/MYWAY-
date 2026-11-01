import { useMemo } from "react";
import type { FocusArea } from "@/lib/database.types";
import { getDayPlan, type DayPlan } from "@/lib/plan";
import { useProfile } from "./ProfileProvider";

/**
 * The plan for one day of the signed-in user's focus area. Null until the profile has loaded or
 * when no focus area has been chosen yet. Pass `focusArea` to preview a plan for another area.
 */
export function useDayPlan(day: number, focusArea?: FocusArea | null): DayPlan | null {
  const { focusArea: profileArea } = useProfile();
  const area = focusArea ?? profileArea;
  return useMemo(() => (area ? getDayPlan(area, day) : null), [area, day]);
}
