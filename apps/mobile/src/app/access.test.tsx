/**
 * Landing focus links, the focus carried into onboarding, /auth/callback, and the Days 1–3 gate.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setCheckoutEnabledForTests } from "@/lib/billing";
import { setGoogleEnabledForTests, signInWithGoogle, signInWithMagicLink } from "@/lib/auth";
import { setSupabaseClientForTests } from "@/lib/supabaseClient";
import { createFakeSupabase } from "@/lib/testing/fakeSupabase";
import { resetAuthCallbackForTests } from "./screens/placeholders/AuthCallbackScreen";
import { saveReturnTo } from "./state/returnTo";
import { CoreFlowApp } from "./CoreFlowApp";

function Probe() {
  const location = useLocation();
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
const hrefs = (href: string) => Array.from(document.querySelectorAll("a")).filter((a) => a.getAttribute("href") === href);

type Fake = ReturnType<typeof createFakeSupabase>;

async function signedIn(fake: Fake, days: number[] = [], status = "none") {
  await fake.client.auth.signUp({ email: "p@t.test", password: "long enough pw", options: { data: { first_name: "Pat" } } });
  const uid = fake.session!.user.id;
  Object.assign(fake.db.profiles[0], { focus_area: "knees", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString(), age_range: "60–70" });
  fake.db.questionnaire_responses.push({ id: "q", user_id: uid, kind: "baseline", answers: {}, created_at: "" });
  for (const day of days) fake.db.day_completions.push({ id: `c${day}`, user_id: uid, day_number: day, completed_at: "", exercises_done: [], feeling: null });
  if (status !== "none") fake.setSubscriptionStatus(uid, status);
  return uid;
}

async function walkToArea() {
  fireEvent.click(await screen.findByLabelText("Stiff most days"));
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  fireEvent.click(await screen.findByLabelText("60–70"));
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  fireEvent.click(await screen.findByLabelText("Climb the stairs"));
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  return (await screen.findByLabelText("Lower back")) as HTMLInputElement;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.pushState({}, "", "/");
  resetAuthCallbackForTests();
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
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"];
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 100;
  window.scrollTo = () => {};
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollBy = () => {};
});

afterEach(() => {
  cleanup();
  setSupabaseClientForTests(null);
  setGoogleEnabledForTests(null);
  setCheckoutEnabledForTests(null);
  resetAuthCallbackForTests();
  vi.unstubAllGlobals();
});

describe("landing links", () => {
  it("sends sign-in, start, and each focus to the real account routes", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/");
    await screen.findByRole("link", { name: /start your 60 days/i });
    expect(screen.getByRole("link", { name: /start your 60 days/i }).getAttribute("href")).toBe("/signup");
    expect(hrefs("/login").length).toBeGreaterThanOrEqual(2);
    expect(hrefs("/signup").length).toBeGreaterThanOrEqual(1);
    expect(hrefs("/signup?focus=knees").length).toBeGreaterThanOrEqual(2);
    expect(hrefs("/signup?focus=lower_back").length).toBeGreaterThanOrEqual(2);
    expect(hrefs("/signup?focus=hips_balance").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /start with knees/i }).getAttribute("href")).toBe("/signup?focus=knees");
    expect(screen.getByRole("link", { name: /start with lower back/i }).getAttribute("href")).toBe("/signup?focus=lower_back");
    expect(screen.getByRole("link", { name: /start with hips/i }).getAttribute("href")).toBe("/signup?focus=hips_balance");
    expect(screen.getByRole("link", { name: /^log in$/i }).getAttribute("href")).toBe("/login");
  });
});

describe("focus intent", () => {
  it("preselects the landing focus and saves it on the profile", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/signup?focus=lower_back");
    expect((await screen.findByRole("link", { name: /^sign in$/i })).getAttribute("href")).toBe("/login?focus=lower_back");
    await type(/first name/i, "Maria");
    await type(/^email/i, "maria@example.test");
    await type(/password/i, "correct horse battery");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await at("/onboarding");
    expect(fake.db.profiles[0]).toMatchObject({ email: "maria@example.test", signup_method: "email", subscription_status: "none" });
    expect(fake.db.app_events.some((e) => e.event_name === "signup" && (e.properties as { method?: string }).method === "email")).toBe(true);
    const signup = fake.authCalls.find((c) => c.op === "signUp");
    expect(signup?.args).toMatchObject({ options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });

    const lower = await walkToArea();
    expect(lower.checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /start my 60 days/i }));
    await at("/app/home");
    expect(fake.db.profiles[0].focus_area).toBe("lower_back");
    expect(window.sessionStorage.getItem("mobility.focusIntent.v1")).toBeNull();
    expect(fake.db.app_events.some((e) => e.event_name === "onboarding_complete")).toBe(true);
  });

  it("keeps a saved focus when the query is not a real area, including after email confirmation", async () => {
    const fake = createFakeSupabase();
    fake.setRequireEmailConfirm(true);
    setSupabaseClientForTests(fake.client);
    window.sessionStorage.setItem("mobility.focusIntent.v1", "knees");
    renderAt("/signup?focus=nope");
    await type(/first name/i, "Maria");
    await type(/^email/i, "maria@example.test");
    await type(/password/i, "correct horse battery");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByText(/check your email to confirm your account/i);
    expect(fake.session).toBeNull();
    expect(window.sessionStorage.getItem("mobility.focusIntent.v1")).toBe("knees");

    fireEvent.click(screen.getByRole("link", { name: /back to sign in/i }));
    await type(/^email/i, "maria@example.test");
    await type(/password/i, "correct horse battery");
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await at("/onboarding");
    fireEvent.click(await screen.findByLabelText("Stiff most days"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.click(await screen.findByLabelText("60–70"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.click(await screen.findByLabelText("Climb the stairs"));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(((await screen.findByLabelText("Knees")) as HTMLInputElement).checked).toBe(true);
  });
});

describe("auth callback and Google", () => {
  it("shows a friendly message when Google is cancelled", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    window.history.pushState({}, "", "/auth/callback?error=access_denied");
    renderAt("/auth/callback?error=access_denied");
    await screen.findByText("Google sign-in was cancelled. Please try again.");
    expect(screen.getByRole("link", { name: /^sign in$/i }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: /create an account/i }).getAttribute("href")).toBe("/signup");
  });

  it("sends a new session to onboarding and an onboarded session back where they were headed", async () => {
    const fresh = createFakeSupabase();
    setSupabaseClientForTests(fresh.client);
    await fresh.client.auth.signUp({ email: "new@t.test", password: "long enough pw", options: { data: { first_name: "Nia" } } });
    window.sessionStorage.setItem("mobility.focusIntent.v1", "hips_balance");
    renderAt("/auth/callback");
    await at("/onboarding");
    cleanup();

    const back = createFakeSupabase();
    setSupabaseClientForTests(back.client);
    await back.client.auth.signUp({ email: "old@t.test", password: "long enough pw", options: { data: { first_name: "Omar" } } });
    Object.assign(back.db.profiles[0], { focus_area: "knees", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString() });
    saveReturnTo("/app/plan");
    resetAuthCallbackForTests();
    renderAt("/auth/callback");
    await at("/app/plan");
  });

  it("hides Google until it is enabled, then asks for the account chooser", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/login");
    await screen.findByRole("button", { name: /^sign in$/i });
    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull();
    cleanup();

    setGoogleEnabledForTests(true);
    renderAt("/login");
    fireEvent.click(await screen.findByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(fake.oauthCalls).toHaveLength(1));
    expect(fake.oauthCalls[0]).toEqual({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    await signInWithMagicLink("a@b.test");
    expect(fake.authCalls.find((c) => c.op === "otp")?.args).toMatchObject({
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
  });

  it("emails a reset link, then accepts a new password while signed in", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    renderAt("/reset-password");
    await type(/^email/i, "maria@example.test");
    fireEvent.click(screen.getByRole("button", { name: /email me a reset link/i }));
    await screen.findByRole("heading", { name: /check your email/i });
    expect(fake.authCalls.find((c) => c.op === "reset")?.args).toMatchObject({
      email: "maria@example.test",
      options: { redirectTo: `${window.location.origin}/reset-password` },
    });
    cleanup();

    await fake.client.auth.signUp({ email: "maria@example.test", password: "long enough pw", options: { data: { first_name: "Maria" } } });
    Object.assign(fake.db.profiles[0], { focus_area: "knees", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString() });
    renderAt("/reset-password");
    await type("New password", "a different password");
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));
    await at("/app/home");
  });
});

describe("free beta", () => {
  it("blocks Day 4 until the account has full access", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    const uid = await signedIn(fake, [1, 2, 3]);
    const denied = await fake.client.rpc("complete_day", { p_day: 4, p_exercises: [], p_feeling: 3 });
    expect(denied.error?.message).toBe("PAYWALL");

    renderAt("/app/session/4");
    await screen.findByRole("heading", { name: /days 4 to 60 are for full access/i });
    expect(screen.getByText(/days 4 to 60 open soon/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /get full access/i })).toBeNull();
    expect(screen.queryByText(/\$9\.99/)).toBeNull();
    cleanup();

    setCheckoutEnabledForTests(true);
    renderAt("/app/session/4");
    await screen.findByText("Full access is $9.99 a month. Cancel any time.");
    expect(screen.getByRole("button", { name: /get full access/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /back to day 3/i }).getAttribute("href")).toBe("/app/session/3");
    cleanup();

    fake.setSubscriptionStatus(uid, "active");
    const allowed = await fake.client.rpc("complete_day", { p_day: 4, p_exercises: [], p_feeling: 3 });
    expect(allowed.error).toBeNull();
    renderAt("/app/session/4");
    await screen.findByText(/Day 4 ·/);
    expect(screen.queryByRole("heading", { name: /days 4 to 60 are for full access/i })).toBeNull();
  });

  it("labels later days on the plan, and Day 3's finish screen offers access instead of Day 4", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await signedIn(fake, [1, 2, 3]);
    renderAt("/app/plan");
    await screen.findByRole("heading", { name: /my plan/i });
    expect(screen.getAllByText("Full access").length).toBeGreaterThan(0);
    cleanup();

    renderAt("/app/session/3/done");
    await screen.findByRole("heading", { name: /day 3 done/i });
    expect(screen.queryByRole("link", { name: /start day 4/i })).toBeNull();
    expect(screen.queryByText(/that's all 60 days/i)).toBeNull();
    expect(screen.getByRole("heading", { name: /days 4 to 60 are for full access/i })).toBeTruthy();
    cleanup();

    renderAt("/app/home");
    const today = await screen.findByRole("link", { name: "See all: Today" });
    expect(today.getAttribute("href")).toBe("/app/session/4");
    cleanup();

    renderAt("/app/account");
    await screen.findByText("Free beta (Days 1 to 3)");
  });

  it("shows the checkout return on the account page", async () => {
    const cancelled = createFakeSupabase();
    setSupabaseClientForTests(cancelled.client);
    await signedIn(cancelled, [1]);
    renderAt("/app/account?checkout=cancelled");
    await screen.findByText("No payment was taken.");
    cleanup();

    const paid = createFakeSupabase();
    setSupabaseClientForTests(paid.client);
    await signedIn(paid, [1, 2, 3], "active");
    renderAt("/app/account?checkout=success");
    await screen.findByText("You now have full access.");
    await screen.findByText("Full access");
  });
});

describe("signInWithGoogle stays off when the flag is off", () => {
  it("does not call the provider", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    setGoogleEnabledForTests(false);
    const result = await signInWithGoogle();
    expect(result.ok).toBe(false);
    expect(fake.oauthCalls).toHaveLength(0);
  });
});
