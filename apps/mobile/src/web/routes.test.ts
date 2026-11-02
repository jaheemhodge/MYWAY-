import { describe, expect, it } from "vitest";
import { isCoreFlowPath, isPrototypePath } from "./routes";

describe("core flow split", () => {
  it("routes the front door, account pages and /app to CoreFlowApp", () => {
    expect(isCoreFlowPath("/")).toBe(true);
    expect(isCoreFlowPath("/login")).toBe(true);
    expect(isCoreFlowPath("/signup")).toBe(true);
    expect(isCoreFlowPath("/reset-password")).toBe(true);
    expect(isCoreFlowPath("/onboarding")).toBe(true);
    expect(isCoreFlowPath("/app")).toBe(true);
    expect(isCoreFlowPath("/app/session/3/done")).toBe(true);
  });

  it("leaves the funnel and the phone prototype alone", () => {
    expect(isCoreFlowPath("/plan")).toBe(false);
    expect(isCoreFlowPath("/onboarding/1")).toBe(false);
    expect(isCoreFlowPath("/session/1")).toBe(false);
    expect(isCoreFlowPath("/application")).toBe(false);
  });
});

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
    expect(isPrototypePath("/preview/home")).toBe(true);
    expect(isPrototypePath("/preview/plan")).toBe(true);
    expect(isPrototypePath("/legal")).toBe(true);
  });
});
