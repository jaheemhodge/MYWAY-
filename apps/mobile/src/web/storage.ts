import {
  type CheckInOccasion,
  type LandingAnswerRecord,
  type MovementCheckInRecord,
  type SafetyScreenRecord,
  normalizeLandingAnswer,
  normalizeMovementCheckIn,
  normalizeSafetyScreen,
} from "./model";

/**
 * Client-side store for the free check-in.
 *
 * Records are kept in localStorage until a backend exists. `submitMovementCheckIn`
 * always writes locally, then POSTs the same JSON when `VITE_CHECKIN_API` is set
 * (or when a caller passes an endpoint). A failed POST does not erase the local copy.
 *
 * These answers can be sensitive. A future server needs its own consent, retention,
 * and access review. Do not send them to analytics.
 */

export const CHECKIN_STORAGE_KEY = "mobility.movement-checkin.v1";
export const SAFETY_STORAGE_KEY = "mobility.safety-screen.v1";
/** The one check-in answer given on the landing page, waiting for the check-in to pick it up. */
export const LANDING_ANSWER_STORAGE_KEY = "mobility.landing-answer.v1";

interface CheckInFile {
  schemaVersion: 1;
  byOccasion: Partial<Record<CheckInOccasion, MovementCheckInRecord>>;
}

export interface MovementCheckInSubmitResult {
  storedLocally: boolean;
  delivered: boolean;
  endpoint: string | null;
}

function readFile(): CheckInFile {
  try {
    const raw = localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return { schemaVersion: 1, byOccasion: {} };
    const parsed = JSON.parse(raw) as Partial<CheckInFile>;
    if (parsed.schemaVersion !== 1 || !parsed.byOccasion || typeof parsed.byOccasion !== "object") {
      return { schemaVersion: 1, byOccasion: {} };
    }
    return { schemaVersion: 1, byOccasion: parsed.byOccasion };
  } catch {
    return { schemaVersion: 1, byOccasion: {} };
  }
}

export function loadMovementCheckIn(occasion: CheckInOccasion): MovementCheckInRecord | null {
  const stored = readFile().byOccasion[occasion];
  return stored ? normalizeMovementCheckIn(stored) : null;
}

export function saveMovementCheckIn(record: MovementCheckInRecord): boolean {
  try {
    const file = readFile();
    file.byOccasion[record.occasion] = record;
    localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function clearMovementCheckIn(occasion: CheckInOccasion): void {
  try {
    const file = readFile();
    delete file.byOccasion[occasion];
    localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(file));
  } catch {
    // The in-memory page can still continue without storage.
  }
}

export function loadLandingAnswer(): LandingAnswerRecord | null {
  try {
    const raw = localStorage.getItem(LANDING_ANSWER_STORAGE_KEY);
    return raw ? normalizeLandingAnswer(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLandingAnswer(record: LandingAnswerRecord): boolean {
  try {
    localStorage.setItem(LANDING_ANSWER_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function clearLandingAnswer(): void {
  try {
    localStorage.removeItem(LANDING_ANSWER_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function loadSafetyScreen(): SafetyScreenRecord | null {
  try {
    const raw = localStorage.getItem(SAFETY_STORAGE_KEY);
    if (!raw) return null;
    return normalizeSafetyScreen(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSafetyScreen(record: SafetyScreenRecord): boolean {
  try {
    localStorage.setItem(SAFETY_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function safetyAllowsCheckIn(): boolean {
  return loadSafetyScreen()?.outcome === "continue";
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function submitMovementCheckIn(
  record: MovementCheckInRecord,
  options: { endpoint?: string | null; fetchImpl?: FetchLike } = {},
): Promise<MovementCheckInSubmitResult> {
  const storedLocally = saveMovementCheckIn(record);
  const configured = import.meta.env.VITE_CHECKIN_API?.trim() || null;
  const endpoint = options.endpoint !== undefined ? options.endpoint : configured;
  if (!endpoint) return { storedLocally, delivered: false, endpoint: null };
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(record),
    });
    return { storedLocally, delivered: response.ok, endpoint };
  } catch {
    return { storedLocally, delivered: false, endpoint };
  }
}
