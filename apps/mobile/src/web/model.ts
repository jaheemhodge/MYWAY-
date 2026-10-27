/**
 * Self-reported movement check-in.
 *
 * The same record is used for the free baseline check-in and for later
 * Day 30 and Day 60 re-checks (`occasion`). It stores words the person
 * chose. It does not store a score, a norm, or a diagnosis.
 */

export const CHECKIN_SCHEMA_VERSION = 1 as const;

export type CheckInOccasion = "baseline" | "day-30" | "day-60";

export const CONFIDENCE_TASKS = [
  {
    id: "stairs",
    title: "How confident do you feel on stairs?",
    help: "Think of a usual flight of stairs, at your own pace. Holding a rail counts if that is what you normally do.",
    summary: "Stairs",
  },
  {
    id: "chair",
    title: "How confident do you feel getting up from a chair?",
    help: "Your usual chair. Using your hands on the chair counts if that is normal for you.",
    summary: "Getting up from a chair",
  },
  {
    id: "floor",
    title: "How confident do you feel getting up from the floor?",
    help: "If you do not get down to the floor, choose “I don’t do this.”",
    summary: "Getting up from the floor",
  },
  {
    id: "overhead",
    title: "How confident do you feel reaching overhead?",
    help: "A shelf, a cupboard, or hanging a coat.",
    summary: "Reaching overhead",
  },
  {
    id: "groceries",
    title: "How confident do you feel carrying groceries?",
    help: "A usual bag from the car or the shop to the kitchen.",
    summary: "Carrying groceries",
  },
  {
    id: "balance",
    title: "How confident do you feel with your balance?",
    help: "Standing, turning, or walking somewhere familiar. This is your own sense of it, not a balance test.",
    summary: "Balance",
  },
] as const;

export type ConfidenceTaskId = (typeof CONFIDENCE_TASKS)[number]["id"];

export const CONFIDENCE_OPTIONS = [
  { id: "not_confident", label: "Not confident" },
  { id: "somewhat_confident", label: "Somewhat confident" },
  { id: "confident", label: "Confident" },
  { id: "very_confident", label: "Very confident" },
  { id: "do_not_do_this", label: "I don’t do this" },
] as const;

export type ConfidenceAnswer = (typeof CONFIDENCE_OPTIONS)[number]["id"];

export const COMFORT_OPTIONS = [
  { id: "comfortable", label: "Comfortable today" },
  { id: "a_little_stiff", label: "A little stiff" },
  { id: "sore", label: "Sore in places" },
  { id: "limited", label: "Limited today" },
] as const;

export type ComfortToday = (typeof COMFORT_OPTIONS)[number]["id"];

export const ACTIVITY_OPTIONS = [
  { id: "mostly_sitting", label: "Mostly sitting", help: "Through a usual day." },
  { id: "light", label: "Light movement", help: "Short walks or easy chores." },
  { id: "regular", label: "Regular walks or chores", help: "Most days of the week." },
  { id: "active", label: "Active on many days", help: "Movement is already part of the week." },
] as const;

export type ActivityLevel = (typeof ACTIVITY_OPTIONS)[number]["id"];

export const GOAL_OPTIONS = [
  { id: "stairs", label: "Stairs that feel more manageable" },
  { id: "chair", label: "Getting up from a chair" },
  { id: "overhead", label: "Reaching overhead" },
  { id: "carrying", label: "Carrying bags or groceries" },
  { id: "steadier", label: "Feeling steadier on my feet" },
  { id: "morning", label: "Mornings that feel less stiff" },
  { id: "move_more", label: "Moving a bit more often" },
] as const;

export type GoalId = (typeof GOAL_OPTIONS)[number]["id"];

export const EQUIPMENT_OPTIONS = [
  { id: "chair", label: "A sturdy chair without wheels" },
  { id: "counter", label: "A kitchen counter or other fixed surface" },
  { id: "wall", label: "A clear piece of wall" },
  { id: "floor_space", label: "Room to stand and take a step" },
  { id: "none_yet", label: "I’m not sure yet" },
] as const;

export type EquipmentId = (typeof EQUIPMENT_OPTIONS)[number]["id"];

export const TIME_OPTIONS = [
  { id: "10", label: "About 10 minutes" },
  { id: "15", label: "About 15 minutes" },
  { id: "20", label: "About 20 minutes" },
  { id: "30", label: "About 30 minutes" },
  { id: "varies", label: "It depends on the day" },
] as const;

export type SessionMinutes = (typeof TIME_OPTIONS)[number]["id"];

export interface MovementCheckInRecord {
  schemaVersion: typeof CHECKIN_SCHEMA_VERSION;
  occasion: CheckInOccasion;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  confidence: Record<ConfidenceTaskId, ConfidenceAnswer | null>;
  comfortToday: ComfortToday | null;
  activityLevel: ActivityLevel | null;
  goals: GoalId[];
  equipment: EquipmentId[];
  sessionMinutes: SessionMinutes | null;
}

export interface ToldUsItem {
  id: string;
  label: string;
  lines: string[];
}

export type CheckInStep =
  | { id: "intro"; kind: "intro"; title: string; body: string[] }
  | { id: ConfidenceTaskId; kind: "confidence"; title: string; help: string }
  | { id: "comfort"; kind: "comfort"; title: string; help: string }
  | { id: "activity"; kind: "activity"; title: string; help: string }
  | { id: "goals"; kind: "goals"; title: string; help: string }
  | { id: "equipment"; kind: "equipment"; title: string; help: string }
  | { id: "time"; kind: "time"; title: string; help: string };

export const CHECKIN_STEPS: readonly CheckInStep[] = [
  {
    id: "intro",
    kind: "intro",
    title: "A few questions, in your own words.",
    body: ["Short questions about everyday tasks. Your answers stay on this device."],
  },
  ...CONFIDENCE_TASKS.map(
    (task): CheckInStep => ({
      id: task.id,
      kind: "confidence",
      title: task.title,
      help: task.help,
    }),
  ),
  {
    id: "comfort",
    kind: "comfort",
    title: "How does your body feel today?",
    help: "There is no better answer. This only describes today.",
  },
  {
    id: "activity",
    kind: "activity",
    title: "How much do you usually move in a week?",
    help: "Count walks, chores, and anything else you already do. This is not a fitness grade.",
  },
  {
    id: "goals",
    kind: "goals",
    title: "What would you like these 60 days to support?",
    help: "Choose any that apply. This is a wish list, not a test result.",
  },
  {
    id: "equipment",
    kind: "equipment",
    title: "What do you have at home for a session?",
    help: "Choose anything that is sturdy and nearby. If you are not sure, say so.",
  },
  {
    id: "time",
    kind: "time",
    title: "How much time could you give a session on a typical day?",
    help: "Shorter is fine. You can stop a session early.",
  },
];

export const SAFETY_QUESTION_IDS = [
  "recent_surgery",
  "clinician_restriction",
  "activity_symptoms",
  "falls_unsteady",
  "worsening_symptoms",
  "sudden_change",
] as const;

export type SafetyQuestionId = (typeof SAFETY_QUESTION_IDS)[number];
export type SafetyAnswer = "yes" | "no" | "not_sure";
export type SafetyAnswers = Record<SafetyQuestionId, SafetyAnswer | null>;
export type SafetyOutcome = "incomplete" | "continue" | "pause";

export interface SafetyQuestion {
  id: SafetyQuestionId;
  prompt: string;
  help: string;
}

export const SAFETY_QUESTIONS: readonly SafetyQuestion[] = [
  {
    id: "recent_surgery",
    prompt: "In the past 6 months, have you had surgery or a procedure that still affects how you move?",
    help: "Include a joint replacement, a spine procedure, or anything you are still recovering from.",
  },
  {
    id: "clinician_restriction",
    prompt: "Has a doctor, physiotherapist, or other clinician told you to avoid exercise, or to avoid certain movements?",
    help: "If that advice is still in place, or you are not sure it has been lifted, do not choose No.",
  },
  {
    id: "activity_symptoms",
    prompt: "Do you get chest pain, chest pressure, unusual shortness of breath, or dizziness when you are active?",
    help: "If any of this is happening right now, contact emergency services before you continue.",
  },
  {
    id: "falls_unsteady",
    prompt: "In the past year, have you had a fall, or do you feel unsteady when you walk or turn?",
    help: "Include a fall that did not cause an injury. This question does not predict future falls.",
  },
  {
    id: "worsening_symptoms",
    prompt: "Do you have pain, weakness, or numbness that is new, severe, or getting worse?",
    help: "If you cannot tell whether something counts, choose I’m not sure.",
  },
  {
    id: "sudden_change",
    prompt:
      "Have you had a sudden change such as new trouble controlling your bladder or bowels, numbness in the groin or saddle area, or weakness that came on quickly?",
    help: "These need a clinician, not a home movement program. If this is happening now, seek urgent care.",
  },
];

export const SAFETY_CHOICES = [
  { id: "yes", label: "Yes" },
  { id: "not_sure", label: "I’m not sure" },
  { id: "no", label: "No" },
] as const;

export interface SafetyScreenRecord {
  schemaVersion: 1;
  answeredAt: string;
  answers: SafetyAnswers;
  outcome: Exclude<SafetyOutcome, "incomplete">;
}

export function parseOccasion(value: string | null | undefined): CheckInOccasion | null {
  if (value === "baseline" || value === "day-30" || value === "day-60") return value;
  return null;
}

export function createMovementCheckIn(occasion: CheckInOccasion = "baseline", now = new Date()): MovementCheckInRecord {
  const stamp = now.toISOString();
  return {
    schemaVersion: CHECKIN_SCHEMA_VERSION,
    occasion,
    startedAt: stamp,
    updatedAt: stamp,
    completedAt: null,
    confidence: {
      stairs: null,
      chair: null,
      floor: null,
      overhead: null,
      groceries: null,
      balance: null,
    },
    comfortToday: null,
    activityLevel: null,
    goals: [],
    equipment: [],
    sessionMinutes: null,
  };
}

export function emptySafetyAnswers(): SafetyAnswers {
  return {
    recent_surgery: null,
    clinician_restriction: null,
    activity_symptoms: null,
    falls_unsteady: null,
    worsening_symptoms: null,
    sudden_change: null,
  };
}

export function safetyOutcome(answers: SafetyAnswers): SafetyOutcome {
  const values = SAFETY_QUESTION_IDS.map((id) => answers[id]);
  if (values.some((value) => value == null)) return "incomplete";
  if (values.some((value) => value === "yes" || value === "not_sure")) return "pause";
  return "continue";
}

export function checkInStep(stepId: string | undefined): CheckInStep | null {
  return CHECKIN_STEPS.find((step) => step.id === stepId) ?? null;
}

/**
 * The next or previous step, passing over any step ids in `skip`.
 * `skip` holds questions already answered on the landing page, so they are not asked twice.
 * A skipped step can still be opened directly (to change the answer); moving on from it works normally.
 */
export function adjacentStep(stepId: string, direction: -1 | 1, skip: readonly string[] = []): CheckInStep | null {
  let index = CHECKIN_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) return null;
  for (index += direction; index >= 0 && index < CHECKIN_STEPS.length; index += direction) {
    const candidate = CHECKIN_STEPS[index];
    if (!skip.includes(candidate.id)) return candidate;
  }
  return null;
}

/** The steps this person will actually see, keeping `current` visible even when it is skipped. */
export function visibleSteps(skip: readonly string[], current?: string): readonly CheckInStep[] {
  return CHECKIN_STEPS.filter((step) => step.id === current || !skip.includes(step.id));
}

/**
 * One check-in question answered on the landing page, before the safety screen.
 * It is carried into the baseline check-in so the question is not asked twice.
 */
export const LANDING_QUESTION_ID = "chair" as const satisfies ConfidenceTaskId;

export interface LandingAnswerRecord {
  schemaVersion: 1;
  taskId: ConfidenceTaskId;
  answer: ConfidenceAnswer;
  answeredAt: string;
}

export function landingQuestion() {
  return CONFIDENCE_TASKS.find((task) => task.id === LANDING_QUESTION_ID)!;
}

export function createLandingAnswer(answer: ConfidenceAnswer, now = new Date()): LandingAnswerRecord {
  return { schemaVersion: 1, taskId: LANDING_QUESTION_ID, answer, answeredAt: now.toISOString() };
}

export function normalizeLandingAnswer(value: unknown): LandingAnswerRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<LandingAnswerRecord>;
  if (raw.schemaVersion !== 1) return null;
  if (!CONFIDENCE_TASKS.some((task) => task.id === raw.taskId)) return null;
  if (!isListed(raw.answer, CONFIDENCE_OPTIONS)) return null;
  if (typeof raw.answeredAt !== "string" || Number.isNaN(Date.parse(raw.answeredAt))) return null;
  return { schemaVersion: 1, taskId: raw.taskId as ConfidenceTaskId, answer: raw.answer, answeredAt: raw.answeredAt };
}

/**
 * Put the landing answer into a check-in record, unless the record was changed after it
 * (for example, the person reopened that question inside the check-in and chose again).
 */
export function applyLandingAnswer(record: MovementCheckInRecord, landing: LandingAnswerRecord | null): MovementCheckInRecord {
  if (!landing || record.occasion !== "baseline" || record.completedAt) return record;
  const current = record.confidence[landing.taskId];
  if (current && Date.parse(record.updatedAt) > Date.parse(landing.answeredAt)) return record;
  return { ...record, confidence: { ...record.confidence, [landing.taskId]: landing.answer } };
}

export function confidenceLabel(answer: ConfidenceAnswer): string {
  return optionLabel(CONFIDENCE_OPTIONS, answer);
}

export function isStepComplete(record: MovementCheckInRecord, step: CheckInStep): boolean {
  switch (step.kind) {
    case "intro":
      return true;
    case "confidence":
      return record.confidence[step.id] != null;
    case "comfort":
      return record.comfortToday != null;
    case "activity":
      return record.activityLevel != null;
    case "goals":
      return record.goals.length > 0;
    case "equipment":
      return record.equipment.length > 0;
    case "time":
      return record.sessionMinutes != null;
    default: {
      const exhaustive: never = step;
      return exhaustive;
    }
  }
}

export function continueHint(step: CheckInStep, ready: boolean): string {
  if (ready) return "";
  if (step.kind === "goals" || step.kind === "equipment") return "Choose at least one to continue.";
  return "Choose an answer to continue.";
}

export function continueLabel(step: CheckInStep): string {
  if (step.kind === "intro") return "Start the check-in";
  if (step.kind === "time") return "See what you told us";
  return "Continue";
}

export function toggleSelection<T extends string>(current: readonly T[], id: T, exclusive?: T): T[] {
  if (exclusive && id === exclusive) {
    return current.length === 1 && current[0] === exclusive ? [] : [exclusive];
  }
  const withoutExclusive = exclusive ? current.filter((item) => item !== exclusive) : [...current];
  return withoutExclusive.includes(id) ? withoutExclusive.filter((item) => item !== id) : [...withoutExclusive, id];
}

function optionLabel(options: readonly { id: string; label: string }[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

function isListed<T extends string>(value: unknown, options: readonly { id: T }[]): value is T {
  return typeof value === "string" && options.some((option) => option.id === value);
}

export function whatYouToldUs(record: MovementCheckInRecord): ToldUsItem[] {
  const items: ToldUsItem[] = [];
  for (const task of CONFIDENCE_TASKS) {
    const answer = record.confidence[task.id];
    if (!answer) continue;
    items.push({ id: task.id, label: task.summary, lines: [optionLabel(CONFIDENCE_OPTIONS, answer)] });
  }
  if (record.comfortToday) {
    items.push({
      id: "comfort",
      label: "Comfort today",
      lines: [optionLabel(COMFORT_OPTIONS, record.comfortToday)],
    });
  }
  if (record.activityLevel) {
    items.push({
      id: "activity",
      label: "Usual activity",
      lines: [optionLabel(ACTIVITY_OPTIONS, record.activityLevel)],
    });
  }
  if (record.goals.length) {
    items.push({
      id: "goals",
      label: "What you want support with",
      lines: record.goals.map((id) => optionLabel(GOAL_OPTIONS, id)),
    });
  }
  if (record.equipment.length) {
    items.push({
      id: "equipment",
      label: "At home",
      lines: record.equipment.map((id) => optionLabel(EQUIPMENT_OPTIONS, id)),
    });
  }
  if (record.sessionMinutes) {
    items.push({
      id: "time",
      label: "Time for a session",
      lines: [optionLabel(TIME_OPTIONS, record.sessionMinutes)],
    });
  }
  return items;
}

export function normalizeMovementCheckIn(value: unknown): MovementCheckInRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<MovementCheckInRecord>;
  const occasion = parseOccasion(raw.occasion);
  if (raw.schemaVersion !== CHECKIN_SCHEMA_VERSION || !occasion) return null;
  const base = createMovementCheckIn(occasion);
  const confidence = { ...base.confidence };
  if (raw.confidence && typeof raw.confidence === "object") {
    for (const task of CONFIDENCE_TASKS) {
      const answer = raw.confidence[task.id];
      if (isListed(answer, CONFIDENCE_OPTIONS)) confidence[task.id] = answer;
    }
  }
  return {
    schemaVersion: CHECKIN_SCHEMA_VERSION,
    occasion,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : base.startedAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : null,
    confidence,
    comfortToday: isListed(raw.comfortToday, COMFORT_OPTIONS) ? raw.comfortToday : null,
    activityLevel: isListed(raw.activityLevel, ACTIVITY_OPTIONS) ? raw.activityLevel : null,
    goals: Array.isArray(raw.goals) ? raw.goals.filter((id): id is GoalId => isListed(id, GOAL_OPTIONS)) : [],
    equipment: Array.isArray(raw.equipment)
      ? raw.equipment.filter((id): id is EquipmentId => isListed(id, EQUIPMENT_OPTIONS))
      : [],
    sessionMinutes: isListed(raw.sessionMinutes, TIME_OPTIONS) ? raw.sessionMinutes : null,
  };
}

export function normalizeSafetyScreen(value: unknown): SafetyScreenRecord | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SafetyScreenRecord> & { answers?: Partial<SafetyAnswers> };
  if (raw.schemaVersion !== 1 || !raw.answers || typeof raw.answers !== "object") return null;
  const answers = emptySafetyAnswers();
  for (const id of SAFETY_QUESTION_IDS) {
    const answer = raw.answers[id];
    if (answer === "yes" || answer === "no" || answer === "not_sure") answers[id] = answer;
  }
  const outcome = safetyOutcome(answers);
  if (outcome === "incomplete") return null;
  return {
    schemaVersion: 1,
    answeredAt: typeof raw.answeredAt === "string" ? raw.answeredAt : new Date(0).toISOString(),
    answers,
    outcome,
  };
}
