import { CALENDAR, PHASE_COPY, type CalendarDay, type UiPhase } from "../content/calendar";
import {
  DAY1_MOVEMENTS,
  EDUCATION_THEMES,
  MOVEMENTS,
  PATHWAY_MOVEMENTS,
  type Movement,
} from "../content/movements";

export type PathwayId = "walk_capacity" | "chair_rise" | "workday_capacity" | "morning_mobility";

export interface SessionDay extends CalendarDay {
  title: string;
  summary: string;
  durationLabel: string;
  equipmentLabel: string;
  demonstration: true;
  approvedPrescription: false;
  locked: boolean;
  movements: Movement[];
  educationVideo: string;
}

export const PATHWAY_META: Record<PathwayId, { goal: string; label: string }> = {
  walk_capacity: { goal: "Enjoy longer walks", label: "Everyday walking capacity" },
  chair_rise: { goal: "Get up from chairs more easily", label: "Chair-rise and functional strength" },
  workday_capacity: { goal: "Get through workdays more comfortably", label: "Workday movement and strength" },
  morning_mobility: { goal: "Feel less stiff in the morning", label: "General morning mobility" },
};

const GOAL_TO_PATHWAY: Record<string, PathwayId> = {
  walks: "walk_capacity",
  enjoy_longer_walks: "walk_capacity",
  chair: "chair_rise",
  get_up_from_chairs: "chair_rise",
  morning: "morning_mobility",
  morning_stiffness: "morning_mobility",
  workdays: "workday_capacity",
  workday: "workday_capacity",
  stronger: "chair_rise",
  confidence: "walk_capacity",
};

export function pathwayForGoal(goal?: string | null): PathwayId {
  if (!goal) return "walk_capacity";
  return GOAL_TO_PATHWAY[goal] ?? "walk_capacity";
}

function titleFor(day: CalendarDay, pathway: PathwayId): string {
  if (day.day === 1) return "Build Stronger Support for Your Knees";
  if (day.day === 14) return "Everyday Strength";
  if (day.dayType === "strength_design") return "Everyday Strength";
  if (day.dayType === "activity_design") {
    return pathway === "workday_capacity" ? "Gentle movement break" : "Gentle walk and mobility";
  }
  if (day.dayType === "education") return EDUCATION_THEMES[(day.day - 1) % EDUCATION_THEMES.length][0];
  if (day.dayType === "recovery") return "Recovery day";
  return "Check-in and review";
}

function summaryFor(day: CalendarDay): string {
  if (day.day === 1) {
    return "An introduction to how leg, hip, and ankle strength support everyday knee function. Demonstration only — not a diagnosis.";
  }
  if (day.dayType === "strength_design") return "A calm, chair-supported session. Take it at your own pace.";
  if (day.dayType === "activity_design") return "Comfortable walking or easy movement, only as long as it feels right.";
  if (day.dayType === "education") return EDUCATION_THEMES[(day.day - 1) % EDUCATION_THEMES.length][1];
  if (day.dayType === "recovery") return "A lighter day. Rest is part of getting stronger, not a gap in the plan.";
  return "A short look at how things feel, without treating scores as proof of a cure.";
}

export function buildPlan(pathway: PathwayId, locked: boolean): SessionDay[] {
  return CALENDAR.map((day) => {
    const movementIds = day.day === 1 ? DAY1_MOVEMENTS : PATHWAY_MOVEMENTS[pathway];
    const includeMoves = !locked && (day.dayType === "strength_design" || day.day === 14);
    const movements = includeMoves ? movementIds.map((id) => MOVEMENTS[id]).filter(Boolean) : [];
    return {
      ...day,
      title: titleFor(day, pathway),
      summary: summaryFor(day),
      durationLabel: day.dayType === "strength_design" ? "About 10 min" : day.dayType === "activity_design" ? "As tolerated" : "5–8 min",
      equipmentLabel: movements[0]?.equipment.includes("chair") ? "Sturdy chair" : "None required",
      demonstration: true,
      approvedPrescription: false,
      locked,
      movements,
      educationVideo: "/videos/education-placeholder.mp4",
    };
  });
}

export function phaseLabel(phase: UiPhase): string {
  return PHASE_COPY[phase].title;
}

export function weekdayForProgramDay(currentDay: number, targetDay: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(now.getDate() + (targetDay - currentDay));
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
