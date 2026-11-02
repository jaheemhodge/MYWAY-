import { afterEach, describe, expect, it, vi } from "vitest";
import { FRIENDLY } from "./auth";
import { checkoutStatusMessage, PRICE_LABEL, setCheckoutNavigationForTests, startCheckout } from "./billing";
import { fromRpc } from "./progress";
import { setSupabaseClientForTests } from "./supabaseClient";
import { createFakeSupabase } from "./testing/fakeSupabase";

afterEach(() => {
  setSupabaseClientForTests(null);
  setCheckoutNavigationForTests(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("checkout copy", () => {
  it("uses the $9.99 label and the return sentences", () => {
    expect(PRICE_LABEL).toBe("$9.99 / month");
    expect(checkoutStatusMessage("pending")).toBe("Thank you. Finishing your full access…");
    expect(checkoutStatusMessage("ready")).toBe("You now have full access.");
    expect(checkoutStatusMessage("delayed")).toBe("Payment received. Access can take a minute; refresh this page.");
    expect(checkoutStatusMessage("cancelled")).toBe("No payment was taken.");
  });
});

describe("fromRpc access fields", () => {
  it("defaults when an older get_progress omits them, and reads them when present", () => {
    const base = { current_day: 1, completed_days: [], phase: 1 as const, recheck_due: null, all_done: false };
    expect(fromRpc(base)).toMatchObject({ freeDaysLimit: 3, hasFullAccess: false });
    expect(fromRpc({ ...base, free_days_limit: 3, has_full_access: true })).toMatchObject({ freeDaysLimit: 3, hasFullAccess: true });
  });
});

describe("startCheckout", () => {
  it("asks the person to sign in when there is no session", async () => {
    setSupabaseClientForTests(createFakeSupabase().client);
    const result = await startCheckout();
    expect(result).toEqual({ ok: false, message: "Please sign in again to continue." });
  });

  it("posts the access token and leaves for the Checkout URL", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "pay@t.test", password: "long enough pw", options: { data: { first_name: "P" } } });
    const assign = vi.fn();
    setCheckoutNavigationForTests(assign);
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ url: "https://checkout.stripe.test/c" }) }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await startCheckout();
    expect(result).toEqual({ ok: true, data: { url: "https://checkout.stripe.test/c" } });
    expect(fetchMock).toHaveBeenCalledWith("/api/create-checkout-session", {
      method: "POST",
      headers: { Authorization: "Bearer t" },
    });
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.test/c");
  });

  it("maps 401, 409 and a down server", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await fake.client.auth.signUp({ email: "pay@t.test", password: "long enough pw", options: { data: { first_name: "P" } } });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })));
    expect(await startCheckout()).toEqual({ ok: false, message: "Please sign in again to continue." });

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ error: "already_subscribed" }) })));
    expect(await startCheckout()).toEqual({ ok: false, message: "You already have full access." });

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409, json: async () => ({ error: "already_subscribed", reason: "past_due" }) })));
    expect(await startCheckout()).toEqual({ ok: false, message: "Please update your payment method." });

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: "Billing isn't configured" }) })));
    expect(await startCheckout()).toEqual({ ok: false, message: "Billing isn't available right now. Please try again." });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect(await startCheckout()).toEqual({ ok: false, message: FRIENDLY.network });
  });
});
