import { describe, expect, it } from "vitest";
import { FRIENDLY, mapAuthError } from "./auth";
import { PROGRESS_MESSAGES, toProgressError } from "./progress";

describe("mapAuthError", () => {
  it("maps Supabase auth errors to plain sentences", () => {
    expect(mapAuthError({ message: "Invalid login credentials", status: 400 })).toBe(FRIENDLY.invalidCredentials);
    expect(mapAuthError({ message: "x", code: "invalid_credentials" })).toBe(FRIENDLY.invalidCredentials);
    expect(mapAuthError({ message: "Email not confirmed" })).toBe(FRIENDLY.emailNotConfirmed);
    expect(mapAuthError({ message: "User already registered" })).toBe(FRIENDLY.userExists);
    expect(mapAuthError({ message: "x", code: "user_already_exists" })).toBe(FRIENDLY.userExists);
    expect(mapAuthError({ message: "Password should be at least 6 characters." })).toBe(FRIENDLY.weakPassword);
    expect(mapAuthError({ message: "x", code: "weak_password" })).toBe(FRIENDLY.weakPassword);
    expect(mapAuthError({ message: "Unable to validate email address: invalid format" })).toBe(FRIENDLY.invalidEmail);
    expect(mapAuthError({ message: "x", code: "over_email_send_rate_limit" })).toBe(FRIENDLY.rateLimited);
    expect(mapAuthError({ message: "Request rate limit reached", status: 429 })).toBe(FRIENDLY.rateLimited);
    expect(mapAuthError({ message: "Auth session missing!" })).toBe(FRIENDLY.sessionMissing);
    expect(mapAuthError({ message: "Email link is invalid or has expired" })).toBe(FRIENDLY.sessionMissing);
    expect(mapAuthError({ message: "New password should be different from the old password." })).toBe(FRIENDLY.samePassword);
  });

  it("maps transport and configuration failures", () => {
    expect(mapAuthError(new TypeError("Failed to fetch"))).toBe(FRIENDLY.network);
    expect(mapAuthError({ message: "NetworkError when attempting to fetch resource." })).toBe(FRIENDLY.network);
    expect(mapAuthError(new Error("Supabase is not configured. Set VITE_SUPABASE_URL…"))).toBe(FRIENDLY.notConfigured);
  });

  it("never leaks raw messages", () => {
    expect(mapAuthError({ message: "pq: duplicate key value violates unique constraint" })).toBe(FRIENDLY.unknown);
    expect(mapAuthError(null)).toBe(FRIENDLY.unknown);
    expect(mapAuthError(undefined)).toBe(FRIENDLY.unknown);
    expect(mapAuthError("")).toBe(FRIENDLY.unknown);
  });
});

describe("toProgressError", () => {
  it("maps the tokens raised by complete_day()", () => {
    expect(toProgressError({ message: "DAY_LOCKED" })).toMatchObject({ code: "DAY_LOCKED", message: PROGRESS_MESSAGES.DAY_LOCKED });
    expect(toProgressError({ message: "P0001: RECHECK_REQUIRED" }).code).toBe("RECHECK_REQUIRED");
    expect(toProgressError({ message: "NOT_ONBOARDED" }).code).toBe("NOT_ONBOARDED");
    expect(toProgressError({ message: "INVALID_DAY" }).code).toBe("INVALID_DAY");
    expect(toProgressError({ message: "INVALID_FEELING" }).code).toBe("INVALID_FEELING");
    expect(toProgressError({ message: "NOT_AUTHENTICATED" }).code).toBe("NOT_AUTHENTICATED");
  });

  it("falls back to network / unknown", () => {
    expect(toProgressError(new TypeError("Failed to fetch")).code).toBe("NETWORK");
    expect(toProgressError({ message: "something odd" })).toMatchObject({ code: "UNKNOWN", message: PROGRESS_MESSAGES.UNKNOWN });
    expect(toProgressError(null).code).toBe("UNKNOWN");
  });
});
