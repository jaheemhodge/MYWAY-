import { afterEach, describe, expect, it, vi } from "vitest";
import { createMovementCheckIn } from "./model";
import {
  CHECKIN_STORAGE_KEY,
  SAFETY_STORAGE_KEY,
  loadMovementCheckIn,
  loadSafetyScreen,
  saveSafetyScreen,
  submitMovementCheckIn,
} from "./storage";

afterEach(() => {
  localStorage.clear();
});

describe("check-in storage", () => {
  it("keeps day 30 from overwriting the baseline record", async () => {
    const baseline = createMovementCheckIn("baseline", new Date("2026-04-01T00:00:00.000Z"));
    baseline.confidence.stairs = "confident";
    baseline.completedAt = baseline.startedAt;
    const day30 = createMovementCheckIn("day-30", new Date("2026-05-01T00:00:00.000Z"));
    day30.confidence.stairs = "very_confident";

    await submitMovementCheckIn(baseline, { endpoint: null });
    await submitMovementCheckIn(day30, { endpoint: null });

    expect(loadMovementCheckIn("baseline")?.confidence.stairs).toBe("confident");
    expect(loadMovementCheckIn("day-30")?.confidence.stairs).toBe("very_confident");
    expect(loadMovementCheckIn("day-60")).toBeNull();
  });

  it("posts the same JSON it stores when an endpoint is configured", async () => {
    const record = createMovementCheckIn("day-60", new Date("2026-06-01T00:00:00.000Z"));
    record.comfortToday = "a_little_stiff";
    record.completedAt = record.startedAt;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://example.test/api/movement-check-ins");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify(record));
      return new Response("{}", { status: 200 });
    });

    const result = await submitMovementCheckIn(record, {
      endpoint: "https://example.test/api/movement-check-ins",
      fetchImpl,
    });

    expect(result).toEqual({
      storedLocally: true,
      delivered: true,
      endpoint: "https://example.test/api/movement-check-ins",
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(loadMovementCheckIn("day-60")?.comfortToday).toBe("a_little_stiff");
    expect(localStorage.getItem(CHECKIN_STORAGE_KEY)).toContain("day-60");
  });

  it("ignores broken local data", () => {
    localStorage.setItem(CHECKIN_STORAGE_KEY, "{");
    expect(loadMovementCheckIn("baseline")).toBeNull();
  });

  it("recomputes a safety pass from the answers", () => {
    saveSafetyScreen({
      schemaVersion: 1,
      answeredAt: "2026-04-01T00:00:00.000Z",
      answers: {
        recent_surgery: "no",
        clinician_restriction: "no",
        activity_symptoms: "no",
        falls_unsteady: "no",
        worsening_symptoms: "no",
        sudden_change: "no",
      },
      outcome: "continue",
    });
    expect(loadSafetyScreen()?.outcome).toBe("continue");

    const raw = JSON.parse(localStorage.getItem(SAFETY_STORAGE_KEY) ?? "{}") as { answers: { falls_unsteady: string } };
    raw.answers.falls_unsteady = "yes";
    localStorage.setItem(SAFETY_STORAGE_KEY, JSON.stringify(raw));
    expect(loadSafetyScreen()?.outcome).toBe("pause");
  });
});
