import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { PERSONAS, type DemoPersona } from "../content/personas";
import { evaluateCheckIn, evaluateIntake, type Answers, type SafetyOutcome } from "../lib/safety";
import { clearState, loadState, saveState } from "../lib/persistence";
import { day1IsInternalPreview } from "../content/day01";
import { buildPlan, pathwayForGoal, type PathwayId, type SessionDay } from "../lib/program";
import { syncCheckIn, syncCompletion, syncIntake } from "../api/client";

export interface CheckInRecord {
  day: number;
  difficulty?: string;
  comparedWithBefore?: string;
  notes?: string;
  newOrConcerningSymptoms?: boolean;
  action: string;
  blockNextSession: boolean;
}

export interface SessionResume {
  day: number;
  movementIndex: number;
  completedReps: number;
}

export interface Settings {
  reminders: boolean;
  reminderTime: string;
  audio: boolean;
  captions: boolean;
  largeText: boolean;
}

export interface Profile {
  id: string;
  firstName: string;
  age: number;
  primaryGoal: string;
  motivations: string[];
  motivationNote: string;
  demo: boolean;
  personaNote?: string;
}

export interface PersistedState {
  hydrated: boolean;
  onboarded: boolean;
  answers: Answers;
  outcome: SafetyOutcome | null;
  profile: Profile | null;
  pathwayId: PathwayId;
  currentDay: number;
  completedDays: number[];
  checkIns: CheckInRecord[];
  blockedUntilReview: boolean;
  sessionResume: SessionResume | null;
  settings: Settings;
  seenMilestones: string[];
  assessments: { day: number; walkMinutes?: number; confidence?: number }[];
}

const defaultState = (): PersistedState => ({
  hydrated: false,
  onboarded: false,
  answers: {},
  outcome: null,
  profile: null,
  pathwayId: "walk_capacity",
  currentDay: 1,
  completedDays: [],
  checkIns: [],
  blockedUntilReview: false,
  sessionResume: null,
  settings: { reminders: true, reminderTime: "08:30", audio: true, captions: true, largeText: false },
  seenMilestones: [],
  assessments: [],
});

type Action =
  | { type: "HYDRATE"; value: PersistedState }
  | { type: "PATCH_ANSWERS"; value: Answers }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "LOAD_PERSONA"; persona: DemoPersona }
  | { type: "COMPLETE_DAY"; day: number }
  | { type: "CHECKIN"; record: CheckInRecord }
  | { type: "RESUME"; value: SessionResume | null }
  | { type: "SETTINGS"; value: Partial<Settings> }
  | { type: "SEEN_MILESTONE"; id: string }
  | { type: "RESET" }
  | { type: "ADVANCE_DAY" };

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.value, hydrated: true };
    case "PATCH_ANSWERS":
      return { ...state, answers: { ...state.answers, ...action.value } };
    case "COMPLETE_ONBOARDING": {
      const evaluation = evaluateIntake(state.answers);
      const firstName = String(state.answers.first_name ?? "there");
      const age = Number(state.answers.age ?? 60);
      const primaryGoal = String(state.answers.primary_goal ?? "walks");
      const pathwayId = pathwayForGoal(primaryGoal);
      return {
        ...state,
        onboarded: true,
        outcome: evaluation.outcome,
        pathwayId,
        currentDay: 1,
        completedDays: [],
        profile: {
          id: `local-${Date.now()}`,
          firstName,
          age,
          primaryGoal,
          motivations: Array.isArray(state.answers.motivations) ? (state.answers.motivations as string[]) : [],
          motivationNote: String(state.answers.motivation_note ?? ""),
          demo: true,
        },
        blockedUntilReview: evaluation.outcome !== "provisionally_eligible",
      };
    }
    case "LOAD_PERSONA": {
      const persona = action.persona;
      return {
        ...defaultState(),
        hydrated: true,
        onboarded: true,
        answers: persona.answers,
        outcome: "provisionally_eligible",
        pathwayId: persona.pathwayId,
        currentDay: persona.currentDay,
        completedDays: persona.completedDays,
        assessments: [
          { day: 1, walkMinutes: persona.walkMinutesStart, confidence: persona.confidenceStart },
          { day: persona.currentDay, walkMinutes: persona.walkMinutesNow, confidence: persona.confidenceNow },
        ],
        profile: {
          id: persona.id,
          firstName: persona.firstName,
          age: persona.age,
          primaryGoal: persona.primaryGoal,
          motivations: persona.motivations,
          motivationNote: persona.motivation,
          demo: true,
          personaNote: persona.note,
        },
      };
    }
    case "COMPLETE_DAY":
      return {
        ...state,
        completedDays: state.completedDays.includes(action.day)
          ? state.completedDays
          : [...state.completedDays, action.day],
        sessionResume: null,
      };
    case "CHECKIN":
      return {
        ...state,
        checkIns: [...state.checkIns.filter((item) => item.day !== action.record.day), action.record],
        blockedUntilReview: action.record.blockNextSession || state.blockedUntilReview,
      };
    case "RESUME":
      return { ...state, sessionResume: action.value };
    case "SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.value } };
    case "SEEN_MILESTONE":
      return {
        ...state,
        seenMilestones: state.seenMilestones.includes(action.id)
          ? state.seenMilestones
          : [...state.seenMilestones, action.id],
      };
    case "ADVANCE_DAY":
      return { ...state, currentDay: Math.min(60, state.currentDay + 1) };
    case "RESET":
      return { ...defaultState(), hydrated: true };
    default:
      return state;
  }
}

interface Store {
  state: PersistedState;
  dispatch: Dispatch<Action>;
  plan: SessionDay[];
  today: SessionDay | undefined;
}

const Ctx = createContext<Store | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState());

  useEffect(() => {
    loadState<PersistedState>().then((value) => {
      if (value) dispatch({ type: "HYDRATE", value: { ...defaultState(), ...value, hydrated: true } });
      else dispatch({ type: "HYDRATE", value: { ...defaultState(), hydrated: true } });
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    void saveState(state);
  }, [state]);

  const locked = state.outcome !== "provisionally_eligible";
  const plan = useMemo(() => buildPlan(state.pathwayId, locked), [state.pathwayId, locked]);
  const today = plan.find((day) => day.day === state.currentDay);

  const value = useMemo(() => ({ state, dispatch, plan, today }), [state, plan, today]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function finishOnboarding(dispatch: Dispatch<Action>, answers: Answers) {
  dispatch({ type: "COMPLETE_ONBOARDING" });
  void syncIntake({
    first_name: answers.first_name,
    answers,
    demo: true,
  });
}

export function completeSession(
  dispatch: Dispatch<Action>,
  state: PersistedState,
  day: number,
  checkIn: Omit<CheckInRecord, "action" | "blockNextSession" | "day">,
) {
  const evaluation = evaluateCheckIn({
    difficulty: checkIn.difficulty,
    comparedWithBefore: checkIn.comparedWithBefore,
    newOrConcerningSymptoms: checkIn.newOrConcerningSymptoms,
  });
  dispatch({ type: "COMPLETE_DAY", day });
  dispatch({
    type: "CHECKIN",
    record: {
      ...checkIn,
      day,
      action: evaluation.action,
      blockNextSession: evaluation.blockNextSession,
    },
  });
  const holdDayOne = day === 1 && day1IsInternalPreview();
  if (!evaluation.blockNextSession && day === state.currentDay && !holdDayOne) {
    dispatch({ type: "ADVANCE_DAY" });
  }
  void syncCompletion({ profile_id: state.profile?.id, day, session_id: `day-${day}` });
  void syncCheckIn({
    profile_id: state.profile?.id,
    day,
    session_id: `day-${day}`,
    difficulty: checkIn.difficulty,
    compared_with_before: checkIn.comparedWithBefore,
    new_or_concerning_symptoms: checkIn.newOrConcerningSymptoms,
    notes: checkIn.notes,
  });
}

export async function resetApp(dispatch: Dispatch<Action>) {
  await clearState();
  dispatch({ type: "RESET" });
}

export { PERSONAS };
