export type SafetyOutcome =
  | "emergency"
  | "clinical_review"
  | "out_of_scope"
  | "provisionally_eligible"
  | "consent_refused";

export type Answers = Record<string, unknown>;

const YES = new Set(["yes", "true", "y"]);
const NO = new Set(["no", "false", "n"]);
const UNSURE = new Set(["unsure", "unknown", "not_sure", "i'm not sure", "im not sure"]);

export const RED_FLAG_IDS = [
  "chest_symptoms",
  "new_weakness",
  "back_bladder",
  "saddle_numbness",
  "acute_neurologic",
  "infection_trauma",
] as const;

export const CLINICAL_REVIEW_IDS = [
  "provider_restrictions",
  "recent_surgery",
  "recent_injury",
  "bone_health",
  "falls_last_year",
  "falls_injury",
  "unsteady",
  "fear_falling",
  "dizziness",
  "unexplained_pain",
  "symptom_onset",
] as const;

export const REQUIRED_SAFETY_IDS = [
  "provider_restrictions",
  "recent_surgery",
  "recent_injury",
  "diagnosed_conditions",
  "bone_health",
  "falls_last_year",
  "unsteady",
  "fear_falling",
  "assistive_device",
  "dizziness",
  "chest_symptoms",
  "new_weakness",
  "saddle_numbness",
  "acute_neurologic",
  "infection_trauma",
  "unexplained_pain",
  "consent_limits",
  "privacy_consent",
  "age",
  "primary_goal",
] as const;

function norm(value: unknown): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return String(value ?? "").trim().toLowerCase();
}

export function isYes(value: unknown): boolean {
  return YES.has(norm(value));
}

export function isNo(value: unknown): boolean {
  return NO.has(norm(value));
}

export function isUnsure(value: unknown): boolean {
  const text = norm(value);
  return UNSURE.has(text) || text === "";
}

export function missingRequired(answers: Answers): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_SAFETY_IDS) {
    const value = answers[key];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      missing.push(key);
    }
  }
  const symptoms = answers.symptom_areas;
  if (Array.isArray(symptoms) && symptoms.some((item) => /back/.test(norm(item)))) {
    if (answers.back_bladder === undefined || answers.back_bladder === "") {
      missing.push("back_bladder");
    }
  }
  if (isYes(answers.falls_last_year) && (answers.falls_injury === undefined || answers.falls_injury === "")) {
    missing.push("falls_injury");
  }
  return missing;
}

export function evaluateIntake(answers: Answers) {
  const missing = missingRequired(answers);
  if (missing.length) {
    return {
      outcome: "clinical_review" as SafetyOutcome,
      assignExercise: false,
      reasons: ["missing_or_unknown_required_answers", ...missing],
      disclaimer: "Unanswered safety questions cannot be treated as No.",
    };
  }
  if (!isYes(answers.consent_limits) || !isYes(answers.privacy_consent)) {
    return {
      outcome: "consent_refused" as SafetyOutcome,
      assignExercise: false,
      reasons: ["consent_refused"],
      disclaimer: "Without consent the app cannot personalize a program.",
    };
  }
  const emergency = RED_FLAG_IDS.filter((key) => isYes(answers[key]));
  if (emergency.length) {
    return {
      outcome: "emergency" as SafetyOutcome,
      assignExercise: false,
      reasons: emergency,
      disclaimer: "This is not emergency monitoring. If you may be having a medical emergency, call 911.",
    };
  }
  const age = Number(answers.age);
  if (!Number.isFinite(age) || age < 50 || age > 70) {
    return {
      outcome: "out_of_scope" as SafetyOutcome,
      assignExercise: false,
      reasons: ["age_outside_target_range"],
      disclaimer: "Automated sessions are not offered outside the 50–70 research audience.",
    };
  }
  const reasons: string[] = [];
  for (const key of CLINICAL_REVIEW_IDS) {
    const value = answers[key];
    if (value === undefined) continue;
    if (isYes(value) || isUnsure(value)) reasons.push(key);
  }
  const conditions = Array.isArray(answers.diagnosed_conditions)
    ? answers.diagnosed_conditions
    : answers.diagnosed_conditions
      ? [answers.diagnosed_conditions]
      : [];
  if (conditions.some((item) => !["none", "no", ""].includes(norm(item)))) {
    reasons.push("diagnosed_conditions");
  }
  const device = norm(answers.assistive_device);
  if (device && !["none", "no", "i don't use one", "do_not_use"].includes(device)) {
    reasons.push("assistive_device");
  }
  if (["worsened", "worse"].includes(norm(answers.symptom_trend))) {
    reasons.push("symptom_trend_worsened");
  }
  if (reasons.length) {
    return {
      outcome: "clinical_review" as SafetyOutcome,
      assignExercise: false,
      reasons,
      disclaimer: "Your answers need a conversation with a clinician before any program is assigned.",
    };
  }
  return {
    outcome: "provisionally_eligible" as SafetyOutcome,
    assignExercise: false,
    reasons: ["preview_only_no_clinical_authorization"],
    disclaimer: "Eligible to preview program structure only. No exercise is clinically approved or prescribed.",
  };
}

export function evaluateCheckIn(input: {
  difficulty?: string | null;
  comparedWithBefore?: string | null;
  newOrConcerningSymptoms?: boolean;
  fallOrNearFall?: boolean;
  emergencyFlag?: boolean;
}) {
  if (input.emergencyFlag || input.fallOrNearFall) {
    return { action: "pause_and_seek_assessment", blockNextSession: true, autoProgress: false };
  }
  if (input.newOrConcerningSymptoms || input.comparedWithBefore === "worse") {
    return { action: "hold_no_progression_review_symptoms", blockNextSession: true, autoProgress: false };
  }
  if (input.difficulty === "too_difficult") {
    return { action: "consider_easier_candidate_after_review", blockNextSession: false, autoProgress: false };
  }
  if (input.difficulty === "too_easy" && input.comparedWithBefore === "better") {
    return {
      action: "eligible_for_review_of_next_level_not_auto_progress",
      blockNextSession: false,
      autoProgress: false,
    };
  }
  return { action: "hold_level_and_monitor", blockNextSession: false, autoProgress: false };
}
