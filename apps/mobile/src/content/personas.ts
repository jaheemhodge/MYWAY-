import type { Answers } from "../lib/safety";

export interface DemoPersona {
  id: string;
  firstName: string;
  age: number;
  currentDay: number;
  primaryGoal: string;
  pathwayId: "walk_capacity" | "chair_rise" | "workday_capacity" | "morning_mobility";
  motivation: string;
  motivations: string[];
  completedDays: number[];
  walkMinutesStart?: number;
  walkMinutesNow?: number;
  confidenceStart?: number;
  confidenceNow?: number;
  note: string;
  answers: Answers;
}

const DEMO_CLEAR_ANSWERS: Answers = {
  provider_restrictions: "no",
  recent_surgery: "no",
  recent_injury: "no",
  diagnosed_conditions: ["none"],
  bone_health: "no",
  falls_last_year: "no",
  unsteady: "no",
  fear_falling: "no",
  assistive_device: "none",
  dizziness: "no",
  chest_symptoms: "no",
  new_weakness: "no",
  saddle_numbness: "no",
  acute_neurologic: "no",
  infection_trauma: "no",
  unexplained_pain: "no",
  consent_limits: "yes",
  privacy_consent: "yes",
};

export const PERSONAS: DemoPersona[] = [
  {
    id: "demo-carol",
    firstName: "Carol",
    age: 68,
    currentDay: 14,
    primaryGoal: "walks",
    pathwayId: "walk_capacity",
    motivation: "I want to walk the coastal path with my sister again.",
    motivations: ["independence", "activities"],
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    walkMinutesStart: 12,
    walkMinutesNow: 16,
    confidenceStart: 4,
    confidenceNow: 6,
    note: "Fictional demonstration profile. A real fall history would hold automated exercise.",
    answers: {
      ...DEMO_CLEAR_ANSWERS,
      age: 68,
      primary_goal: "walks",
      first_name: "Carol",
      symptom_areas: ["limited_walking", "standing"],
      usual_activity: "walks_sometimes",
      walk_tolerance: "10_20",
    },
  },
  {
    id: "demo-deb",
    firstName: "Deb",
    age: 56,
    currentDay: 8,
    primaryGoal: "workdays",
    pathwayId: "workday_capacity",
    motivation: "I want to finish a shift and still enjoy my evening.",
    motivations: ["everyday", "confidence"],
    completedDays: [1, 2, 3, 4, 5, 6, 7],
    walkMinutesStart: 15,
    walkMinutesNow: 15,
    confidenceStart: 5,
    confidenceNow: 5,
    note: "Fictional demonstration profile for workday movement.",
    answers: {
      ...DEMO_CLEAR_ANSWERS,
      age: 56,
      primary_goal: "workdays",
      first_name: "Deb",
      symptom_areas: ["stiffness", "strength"],
      usual_activity: "most_days",
    },
  },
];
