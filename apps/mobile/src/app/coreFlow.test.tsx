/**
 * End-to-end wiring test with an in-memory Supabase stand-in:
 * sign-up → onboarding → Day 1 → finish → Day 2 unlocked → sign out → sign in → still Day 2,
 * plus the route guards and the lock/redirect rules on the session route.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSupabaseClientForTests } from "@/lib/supabaseClient";
import { createFakeSupabase } from "@/lib/testing/fakeSupabase";
import { writeLocalFavorites } from "@/lib/favorites";
import { CoreFlowApp } from "./CoreFlowApp";

let nav: NavigateFunction;
let pathname = "";

function Probe() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    nav = navigate;
    pathname = location.pathname;
  });
  return <output data-testid="path">{location.pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Probe />
      <CoreFlowApp />
    </MemoryRouter>,
  );
}

const at = async (expected: string) => waitFor(() => expect(screen.getByTestId("path").textContent).toBe(expected));
const type = async (label: RegExp | string, value: string) => fireEvent.change(await screen.findByLabelText(label), { target: { value } });

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  writeLocalFavorites([]);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  // The liquid-glass navbar draws with WebGL; jsdom has no canvas, and the component degrades when getContext is null.
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
  window.scrollTo = () => {};
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollBy = () => {};
});

afterEach(() => {
  cleanup();
  setSupabaseClientForTests(null);
  vi.unstubAllGlobals();
});

describe("core flow", () => {
  it("sign-up → onboarding → Day 1 → finish → Day 2 → sign out → sign in → still Day 2", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/signup");

    // Sign up
    await type(/first name/i, "Jaheem");
    await type(/^email/i, "jaheem@example.test");
    await type(/password/i, "correct horse battery");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // No onboarded_at yet → /onboarding
    await at("/onboarding");
    expect(fake.db.profiles[0]).toMatchObject({ first_name: "Jaheem", onboarded_at: null });

    fireEvent.click(screen.getByLabelText("60–70"));
    fireEvent.click(screen.getByLabelText("Knees"));
    fireEvent.click(screen.getByRole("button", { name: /start my 60 days/i }));

    // Home: "Day 1 · Get familiar" row label and "Day 1 of 60" in the top bar
    await at("/app/home");
    expect(fake.db.profiles[0]).toMatchObject({ focus_area: "knees" });
    expect(fake.db.profiles[0].onboarded_at).toBeTruthy();
    expect(fake.db.profiles[0].plan_start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fake.db.questionnaire_responses).toHaveLength(1);
    expect(fake.db.questionnaire_responses[0]).toMatchObject({ kind: "baseline" });
    await screen.findByText("Day 1 · Get familiar");
    expect(screen.getByText(/Day 1 of 60/)).toBeTruthy();

    // A locked day redirects to the current day
    act(() => nav("/app/session/2"));
    await at("/app/session/1");

    // Step through Day 1 and finish
    await screen.findByText("Today's session");
    expect(screen.getByText("Exercise 1 of 5")).toBeTruthy();
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: /next exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish session/i }));

    await at("/app/session/1/done");
    expect(fake.db.day_completions).toHaveLength(1);
    expect(fake.db.day_completions[0]).toMatchObject({ day_number: 1 });
    expect(fake.db.day_completions[0].exercises_done).toHaveLength(5);

    // Done page offers Day 2, which is unlocked immediately
    const startNext = await screen.findByRole("link", { name: /start day 2/i });
    expect(startNext.getAttribute("href")).toBe("/app/session/2");
    fireEvent.click(startNext);
    await at("/app/session/2");

    // Sign out from the account page
    act(() => nav("/app/account"));
    await screen.findByRole("button", { name: /sign out/i });
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await at("/login");

    // Guard: /app needs a session; the intended route is remembered
    act(() => nav("/app/progress"));
    await at("/login");

    // Sign back in → returns to the intended route, still on Day 2
    await type(/^email/i, "jaheem@example.test");
    await type(/password/i, "correct horse battery");
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await at("/app/progress");
    await screen.findByText(/Day 2 of 60 · Phase 1 · Get familiar/);
    expect(screen.getByText(/1 of 60 days done/)).toBeTruthy();
    expect(pathname).toBe("/app/progress");
  });

  it("signed-in users are bounced away from /login and /signup", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "a@b.test", password: "long enough pw", options: { data: { first_name: "A" } } });
    renderAt("/login");
    await at("/onboarding"); // signed in but not onboarded
  });

  it("shows friendly errors from the auth layer", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/login");
    await type(/^email/i, "nobody@example.test");
    await type(/password/i, "whatever123");
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await screen.findByText("That email and password don't match. Check them and try again.");
  });

  it("Day 30 goes to the re-check first, then the session", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "c@d.test", password: "long enough pw", options: { data: { first_name: "C" } } });
    const uid = fake.session!.user.id;
    Object.assign(fake.db.profiles[0], { focus_area: "lower_back", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString() });
    fake.db.questionnaire_responses.push({ id: "q1", user_id: uid, kind: "baseline", answers: {}, created_at: "" });
    for (let d = 1; d <= 29; d += 1) fake.db.day_completions.push({ id: `c${d}`, user_id: uid, day_number: d, completed_at: "", exercises_done: [], feeling: null });

    renderAt("/app/session/30");
    await at("/app/recheck/day30");
    fireEvent.click(screen.getByLabelText("3"));
    fireEvent.click(screen.getByRole("button", { name: /save and start day 30/i }));
    await at("/app/session/30");
    expect(fake.db.questionnaire_responses.some((q) => q.kind === "day30")).toBe(true);

    await screen.findByText("Today's session");
    expect(screen.getByText("Exercise 1 of 5")).toBeTruthy();
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole("button", { name: /next exercise/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish session/i }));
    await at("/app/session/30/done");
    expect(fake.db.day_completions.some((c) => c.day_number === 30)).toBe(true);
  });

  it("hearts save locally when signed out and sync to the account on login", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    writeLocalFavorites(["K01"]);
    await fake.client.auth.signUp({ email: "e@f.test", password: "long enough pw", options: { data: { first_name: "E" } } });
    const uid = fake.session!.user.id;
    Object.assign(fake.db.profiles[0], { focus_area: "knees", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString() });
    fake.db.favorites.push({ user_id: uid, exercise_id: "K04", created_at: "" });

    renderAt("/app/home");
    await screen.findByText("Day 1 · Get familiar");
    await waitFor(() => expect(fake.db.favorites.map((f) => f.exercise_id).sort()).toEqual(["K01", "K04"]));
    const heart = (await screen.findAllByRole("button", { name: /save sit to stand/i }))[0];
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(heart);
    await waitFor(() => expect(fake.db.favorites.map((f) => f.exercise_id)).toEqual(["K01"]));
  });
});
