const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function syncIntake(payload: unknown) {
  return api("/v1/intake", { method: "POST", body: JSON.stringify(payload) });
}

export function syncCheckIn(payload: unknown) {
  return api("/v1/checkin", { method: "POST", body: JSON.stringify(payload) });
}

export function syncCompletion(payload: unknown) {
  return api("/v1/session/complete", { method: "POST", body: JSON.stringify(payload) });
}
