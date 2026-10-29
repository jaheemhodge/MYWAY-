import { describe, expect, it } from "vitest";
import { EXERCISES } from "./library";
import { applyFilters, EMPTY_FILTERS, filtersFromParams, optionCount, paramsFromFilters } from "./filters";
import { getSession, opensOnDay, phaseForDay, SAMPLE_PLAN, formatWeekday, formatMonthDay } from "./plan";
import { isAppPath, isPrototypePath } from "../../web/routes";

describe("library data", () => {
  it("has 56 exercises and every plan id exists", () => {
    expect(EXERCISES).toHaveLength(56);
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const list of Object.values(SAMPLE_PLAN)) for (const id of list) expect(ids.has(id)).toBe(true);
  });
});

describe("getSession", () => {
  it("starts Day 1 with K01", () => {
    expect(getSession(1)[0].id).toBe("K01");
  });

  it("returns 4–6 exercises from the day's phase for every day", () => {
    for (let day = 1; day <= 60; day += 1) {
      const session = getSession(day);
      expect(session.length).toBeGreaterThanOrEqual(4);
      expect(session.length).toBeLessThanOrEqual(6);
      const phaseIds = SAMPLE_PLAN[phaseForDay(day).number];
      for (const exercise of session) expect(phaseIds).toContain(exercise.id);
      expect(new Set(session.map((e) => e.id)).size).toBe(session.length);
    }
  });

  it("maps Day 12 to Wednesday Oct 28", () => {
    expect(formatWeekday(12)).toBe("Wednesday");
    expect(formatMonthDay(12)).toBe("Oct 28");
  });

  it("opens later phases on their start day", () => {
    expect(opensOnDay(2, 12)).toBe(21);
    expect(opensOnDay(3, 12)).toBe(41);
    expect(opensOnDay(1, 12)).toBeNull();
    expect(opensOnDay(2, 21)).toBeNull();
  });
});

describe("filters", () => {
  it("ORs within a group and ANDs between groups", () => {
    const chairOrStanding = applyFilters({ ...EMPTY_FILTERS, position: ["chair", "standing"] });
    expect(chairOrStanding.every((e) => e.position === "chair" || e.position === "standing")).toBe(true);
    const kneesChairP1 = applyFilters({ area: ["knees"], position: ["chair"], phase: [1] });
    expect(kneesChairP1.length).toBeGreaterThan(0);
    expect(kneesChairP1.every((e) => e.areas.includes("knees") && e.position === "chair" && e.phase === 1)).toBe(true);
  });

  it("round-trips through the URL", () => {
    const params = new URLSearchParams("area=knees&position=chair,floor&phase=2");
    const filters = filtersFromParams(params);
    expect(filters).toEqual({ area: ["knees"], position: ["chair", "floor"], phase: [2] });
    expect(paramsFromFilters(filters).toString()).toBe("area=knees&position=chair%2Cfloor&phase=2");
  });

  it("counts each chip against the other groups", () => {
    const filters = { ...EMPTY_FILTERS, area: ["knees" as const] };
    expect(optionCount(filters, "position", "chair")).toBe(
      applyFilters({ ...filters, position: ["chair"] }).length,
    );
  });
});

describe("routes", () => {
  it("sends /app to the logged-in shell and /preview to the phone prototype", () => {
    expect(isAppPath("/app/today")).toBe(true);
    expect(isAppPath("/application")).toBe(false);
    expect(isPrototypePath("/app/today")).toBe(false);
    expect(isPrototypePath("/preview/home")).toBe(true);
  });
});
