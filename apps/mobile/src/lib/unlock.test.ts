import { describe, expect, it } from "vitest";
import { canCompleteDay, completeDayDenial, currentDayFrom, isDayCompleted, isDayPaywalled, isDayUnlocked, recheckDueFor } from "./unlock";

describe("day unlock rules (mirror of complete_day)", () => {
  it("Day 1 is open with nothing completed", () => {
    expect(isDayUnlocked(1, [])).toBe(true);
    expect(canCompleteDay(1, { completedDays: [] })).toBe(true);
    expect(currentDayFrom([])).toBe(1);
  });

  it("Day 2 is locked until Day 1 is done", () => {
    expect(isDayUnlocked(2, [])).toBe(false);
    expect(completeDayDenial(2, { completedDays: [] })).toBe("DAY_LOCKED");
    expect(isDayUnlocked(2, [1])).toBe(true);
    expect(completeDayDenial(2, { completedDays: [1] })).toBeNull();
    expect(currentDayFrom([1])).toBe(2);
  });

  it("rejects out-of-order completion", () => {
    expect(completeDayDenial(3, { completedDays: [1] })).toBe("DAY_LOCKED");
    expect(completeDayDenial(10, { completedDays: [1, 2, 3] })).toBe("DAY_LOCKED");
    expect(completeDayDenial(4, { completedDays: [1, 2, 3] })).toBeNull();
  });

  it("allows replaying a completed day", () => {
    const done = [1, 2, 3, 4, 5];
    for (const day of done) {
      expect(isDayCompleted(day, done)).toBe(true);
      expect(isDayUnlocked(day, done)).toBe(true);
      expect(completeDayDenial(day, { completedDays: done })).toBeNull();
    }
    expect(currentDayFrom(done)).toBe(6);
  });

  it("caps the current day at 60", () => {
    const all = Array.from({ length: 60 }, (_, i) => i + 1);
    expect(currentDayFrom(all)).toBe(60);
    expect(completeDayDenial(61, { completedDays: all })).toBe("INVALID_DAY");
    expect(completeDayDenial(0, { completedDays: [] })).toBe("INVALID_DAY");
    expect(completeDayDenial(1.5, { completedDays: [] })).toBe("INVALID_DAY");
    expect(isDayUnlocked(61, all)).toBe(false);
  });

  it("ignores junk in the completed list", () => {
    expect(currentDayFrom([0, 99, -1, NaN, 2, 1])).toBe(3);
  });

  it("requires onboarding before any completion", () => {
    expect(completeDayDenial(1, { completedDays: [], onboarded: false })).toBe("NOT_ONBOARDED");
    expect(completeDayDenial(1, { completedDays: [], onboarded: true })).toBeNull();
  });

  it("gates Days 30 and 60 behind their re-check", () => {
    const upTo29 = Array.from({ length: 29 }, (_, i) => i + 1);
    expect(completeDayDenial(30, { completedDays: upTo29 })).toBe("RECHECK_REQUIRED");
    expect(completeDayDenial(30, { completedDays: upTo29, recheckDone: ["day30"] })).toBeNull();
    expect(recheckDueFor(30, [], upTo29)).toBe("day30");
    expect(recheckDueFor(30, ["day30"], upTo29)).toBeNull();
    expect(recheckDueFor(31, [], [...upTo29, 30])).toBeNull();

    const upTo59 = Array.from({ length: 59 }, (_, i) => i + 1);
    expect(completeDayDenial(60, { completedDays: upTo59, recheckDone: ["day30"] })).toBe("RECHECK_REQUIRED");
    expect(completeDayDenial(60, { completedDays: upTo59, recheckDone: ["day30", "day60"] })).toBeNull();
    expect(recheckDueFor(60, ["day30"], upTo59)).toBe("day60");
    // Once Day 60 is completed nothing further is due.
    expect(recheckDueFor(60, ["day30", "day60"], [...upTo59, 60])).toBeNull();
  });

  it("paywalls days past the free limit only when access is known", () => {
    expect(isDayPaywalled(3, false)).toBe(false);
    expect(isDayPaywalled(4, false)).toBe(true);
    expect(isDayPaywalled(4, true)).toBe(false);
    expect(isDayPaywalled(30, false, 3)).toBe(true);
    // Older callers omit hasFullAccess, so Day 4 after Days 1–3 stays allowed.
    expect(completeDayDenial(4, { completedDays: [1, 2, 3] })).toBeNull();
    expect(completeDayDenial(4, { completedDays: [1, 2, 3], hasFullAccess: false })).toBe("PAYWALL");
    expect(completeDayDenial(4, { completedDays: [1, 2, 3], hasFullAccess: true })).toBeNull();
    expect(canCompleteDay(4, { completedDays: [1, 2, 3], hasFullAccess: false })).toBe(false);
    // A locked day is still DAY_LOCKED, before the paywall.
    expect(completeDayDenial(5, { completedDays: [1, 2, 3], hasFullAccess: false })).toBe("DAY_LOCKED");
  });

  it("checks rules in the same order as the database", () => {
    // Locked beats re-check: Day 30 with nothing done is DAY_LOCKED, not RECHECK_REQUIRED.
    expect(completeDayDenial(30, { completedDays: [] })).toBe("DAY_LOCKED");
    // Not onboarded beats locked.
    expect(completeDayDenial(30, { completedDays: [], onboarded: false })).toBe("NOT_ONBOARDED");
  });
});
