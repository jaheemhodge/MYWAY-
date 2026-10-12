export type DayType = "strength_design" | "activity_design" | "education" | "recovery" | "review";
export type ResearchPhase = "baseline" | "foundation" | "strength" | "capacity" | "application";
export type UiPhase = "foundation" | "build_strength" | "progress" | "everyday_confidence";

export interface CalendarDay {
  day: number;
  phase: ResearchPhase;
  uiPhase: UiPhase;
  dayType: DayType;
  goalFocus: string;
  checkin: string;
}

const PHASE_TO_UI: Record<ResearchPhase, UiPhase> = {
  baseline: "foundation",
  foundation: "foundation",
  strength: "build_strength",
  capacity: "progress",
  application: "everyday_confidence",
};

const RAW: Array<[number, ResearchPhase, DayType, string, string]> = [
  [1, "baseline", "strength_design", "baseline and purpose", "functional baseline/review"],
  [2, "baseline", "education", "baseline and purpose", "optional"],
  [3, "baseline", "activity_design", "baseline and purpose", "functional baseline/review"],
  [4, "foundation", "recovery", "movement habits", "optional"],
  [5, "foundation", "strength_design", "movement habits", "short tolerability reflection"],
  [6, "foundation", "activity_design", "movement habits", "short tolerability reflection"],
  [7, "foundation", "review", "movement habits", "optional"],
  [8, "foundation", "strength_design", "movement habits", "short tolerability reflection"],
  [9, "foundation", "education", "movement habits", "optional"],
  [10, "foundation", "activity_design", "movement habits", "short tolerability reflection"],
  [11, "foundation", "recovery", "movement habits", "optional"],
  [12, "foundation", "strength_design", "movement habits", "short tolerability reflection"],
  [13, "foundation", "activity_design", "movement habits", "short tolerability reflection"],
  [14, "foundation", "review", "movement habits", "functional baseline/review"],
  [15, "strength", "strength_design", "foundational capacity", "short tolerability reflection"],
  [16, "strength", "education", "foundational capacity", "optional"],
  [17, "strength", "activity_design", "foundational capacity", "short tolerability reflection"],
  [18, "strength", "recovery", "foundational capacity", "optional"],
  [19, "strength", "strength_design", "foundational capacity", "short tolerability reflection"],
  [20, "strength", "activity_design", "foundational capacity", "short tolerability reflection"],
  [21, "strength", "review", "foundational capacity", "optional"],
  [22, "strength", "strength_design", "foundational capacity", "short tolerability reflection"],
  [23, "strength", "education", "foundational capacity", "optional"],
  [24, "strength", "activity_design", "foundational capacity", "short tolerability reflection"],
  [25, "strength", "recovery", "foundational capacity", "optional"],
  [26, "strength", "strength_design", "foundational capacity", "short tolerability reflection"],
  [27, "strength", "activity_design", "foundational capacity", "short tolerability reflection"],
  [28, "strength", "review", "foundational capacity", "optional"],
  [29, "strength", "strength_design", "foundational capacity", "short tolerability reflection"],
  [30, "strength", "education", "foundational capacity", "functional baseline/review"],
  [31, "capacity", "activity_design", "goal-relevant function", "short tolerability reflection"],
  [32, "capacity", "recovery", "goal-relevant function", "optional"],
  [33, "capacity", "strength_design", "goal-relevant function", "short tolerability reflection"],
  [34, "capacity", "activity_design", "goal-relevant function", "short tolerability reflection"],
  [35, "capacity", "review", "goal-relevant function", "optional"],
  [36, "capacity", "strength_design", "goal-relevant function", "short tolerability reflection"],
  [37, "capacity", "education", "goal-relevant function", "optional"],
  [38, "capacity", "activity_design", "goal-relevant function", "short tolerability reflection"],
  [39, "capacity", "recovery", "goal-relevant function", "optional"],
  [40, "capacity", "strength_design", "goal-relevant function", "short tolerability reflection"],
  [41, "capacity", "activity_design", "goal-relevant function", "short tolerability reflection"],
  [42, "capacity", "review", "goal-relevant function", "optional"],
  [43, "capacity", "strength_design", "goal-relevant function", "short tolerability reflection"],
  [44, "capacity", "education", "goal-relevant function", "optional"],
  [45, "capacity", "activity_design", "goal-relevant function", "functional baseline/review"],
  [46, "application", "recovery", "maintain and apply ability", "optional"],
  [47, "application", "strength_design", "maintain and apply ability", "short tolerability reflection"],
  [48, "application", "activity_design", "maintain and apply ability", "short tolerability reflection"],
  [49, "application", "review", "maintain and apply ability", "optional"],
  [50, "application", "strength_design", "maintain and apply ability", "short tolerability reflection"],
  [51, "application", "education", "maintain and apply ability", "optional"],
  [52, "application", "activity_design", "maintain and apply ability", "short tolerability reflection"],
  [53, "application", "recovery", "maintain and apply ability", "optional"],
  [54, "application", "strength_design", "maintain and apply ability", "short tolerability reflection"],
  [55, "application", "activity_design", "maintain and apply ability", "short tolerability reflection"],
  [56, "application", "review", "maintain and apply ability", "optional"],
  [57, "application", "strength_design", "maintain and apply ability", "short tolerability reflection"],
  [58, "application", "education", "maintain and apply ability", "optional"],
  [59, "application", "activity_design", "maintain and apply ability", "short tolerability reflection"],
  [60, "application", "recovery", "maintain and apply ability", "functional baseline/review"],
];

export const CALENDAR: CalendarDay[] = RAW.map(([day, phase, dayType, goalFocus, checkin]) => ({
  day,
  phase,
  uiPhase: PHASE_TO_UI[phase],
  dayType,
  goalFocus,
  checkin,
}));

export const PHASE_COPY: Record<UiPhase, { title: string; days: string; body: string }> = {
  foundation: {
    title: "Foundation",
    days: "Days 1 to 14",
    body: "Gentle strength and easy mobility to get you moving comfortably.",
  },
  build_strength: {
    title: "Build Strength",
    days: "Days 15 to 30",
    body: "Steadier legs and hips for chairs, stairs and longer walks.",
  },
  progress: {
    title: "Progress",
    days: "Days 31 to 45",
    body: "A little more challenge, only when you feel ready for it.",
  },
  everyday_confidence: {
    title: "Everyday Confidence",
    days: "Days 46 to 60",
    body: "Bringing it all into the walks and activities you love.",
  },
};
