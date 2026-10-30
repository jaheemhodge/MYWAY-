import { describe, expect, it } from "vitest";
import { EVENTS, getEvent, matchesDate, whenShort } from "./events";

describe("sample events", () => {
  it("has 12 sample events with unique ids in all three groups", () => {
    expect(EVENTS).toHaveLength(12);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(12);
    for (const c of ["walking", "gentle", "social"]) expect(EVENTS.some((e) => e.category === c)).toBe(true);
  });

  it("formats times relative to the current plan day", () => {
    expect(whenShort(getEvent("e02")!, 12)).toBe("Tomorrow at 6:30 PM");
    expect(whenShort(getEvent("e01")!, 12)).toBe("Sat at 9:00 AM");
  });

  it("filters by weekend", () => {
    const weekend = EVENTS.filter((e) => matchesDate(e, "weekend", 12)).map((e) => e.id);
    expect(weekend).toContain("e01");
    expect(weekend).not.toContain("e02");
  });
});
