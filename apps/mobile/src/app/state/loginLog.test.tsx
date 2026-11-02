import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabaseClient";
import { createFakeSupabase } from "@/lib/testing/fakeSupabase";
import { AuthProvider } from "./AuthProvider";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  setSupabaseClientForTests(null);
});

describe("login event", () => {
  it("logs one row per sign-in, including Google and a magic link", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    render(
      <MemoryRouter>
        <AuthProvider>
          <p>ready</p>
        </AuthProvider>
      </MemoryRouter>,
    );
    await screen.findByText("ready");
    await fake.client.auth.signUp({ email: "e@t.test", password: "long enough pw", options: { data: { first_name: "E" } } });
    await waitFor(() => expect(fake.db.app_events.filter((e) => e.event_name === "login")).toHaveLength(1));
    expect(fake.db.app_events.find((e) => e.event_name === "login")?.properties).toMatchObject({ method: "email", via: "password" });

    fake.emitAuth("SIGNED_IN");
    await act(async () => {
      await Promise.resolve();
    });
    expect(fake.db.app_events.filter((e) => e.event_name === "login")).toHaveLength(1);

    const user = fake.session!.user as unknown as { app_metadata: { provider: string }; last_sign_in_at: string };
    user.app_metadata = { provider: "google" };
    user.last_sign_in_at = "2026-02-02T00:00:00.000Z";
    fake.emitAuth("SIGNED_IN");
    await waitFor(() => expect(fake.db.app_events.filter((e) => e.event_name === "login")).toHaveLength(2));
    expect(fake.db.app_events.filter((e) => e.event_name === "login")[1].properties).toMatchObject({ method: "google", via: "oauth" });

    window.history.pushState({}, "", "/auth/callback");
    user.app_metadata = { provider: "email" };
    user.last_sign_in_at = "2026-03-03T00:00:00.000Z";
    fake.emitAuth("SIGNED_IN");
    await waitFor(() => expect(fake.db.app_events.filter((e) => e.event_name === "login")).toHaveLength(3));
    expect(fake.db.app_events.filter((e) => e.event_name === "login")[2].properties).toMatchObject({ method: "email", via: "magic_link" });
  });
});
