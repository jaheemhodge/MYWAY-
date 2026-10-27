import { describe, expect, it } from "vitest";
import { isPrototypePath } from "./routes";

describe("route split", () => {
  it("keeps the public funnel outside the phone prototype", () => {
    expect(isPrototypePath("/")).toBe(false);
    expect(isPrototypePath("/safety")).toBe(false);
    expect(isPrototypePath("/safety/pause")).toBe(false);
    expect(isPrototypePath("/check-in")).toBe(false);
    expect(isPrototypePath("/check-in/stairs")).toBe(false);
    expect(isPrototypePath("/plan")).toBe(false);
    expect(isPrototypePath("/signup")).toBe(false);
  });

  it("keeps the existing app routes in the prototype", () => {
    expect(isPrototypePath("/welcome")).toBe(true);
    expect(isPrototypePath("/sign-in")).toBe(true);
    expect(isPrototypePath("/session/1")).toBe(true);
    expect(isPrototypePath("/player/1")).toBe(true);
    expect(isPrototypePath("/checkin/1")).toBe(true);
    expect(isPrototypePath("/app/home")).toBe(true);
    expect(isPrototypePath("/app/plan")).toBe(true);
    expect(isPrototypePath("/legal")).toBe(true);
  });
});
