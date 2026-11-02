import { afterEach, describe, expect, it } from "vitest";
import { setSupabaseClientForTests } from "./supabaseClient";
import { createFakeSupabase } from "./testing/fakeSupabase";
import { logEvent } from "./events";

afterEach(() => {
  setSupabaseClientForTests(null);
});

describe("logEvent", () => {
  it("does nothing when Supabase is not configured", async () => {
    await expect(logEvent("login", { method: "email" })).resolves.toBeUndefined();
  });

  it("inserts a login row for the signed-in user", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "e@t.test", password: "long enough pw", options: { data: { first_name: "E" } } });
    await logEvent("login", { method: "email", via: "password" });
    const rows = fake.db.app_events.filter((e) => e.event_name === "login");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ user_id: fake.session!.user.id, properties: { method: "email", via: "password" } });
  });

  it("resolves when the insert is rejected", async () => {
    setSupabaseClientForTests({
      auth: { getSession: async () => ({ data: { session: { user: { id: "user-1" } } }, error: null }) },
      from: () => ({ insert: async () => { throw new Error("42501"); } }),
    } as never);
    await expect(logEvent("day_started", { day: 1, replay: false })).resolves.toBeUndefined();
  });
});
