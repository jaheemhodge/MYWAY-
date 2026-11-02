// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { applyStripeEvent, createCheckoutSession, mapStripeStatus, type BillingStore, type CheckoutStripe, type ProfileRec, type StripeEvent } from "./_lib/billing";
import { readBillingEnv } from "./_lib/env";

const ENV_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

function blankEnv(): void {
  for (const key of ENV_KEYS) delete process.env[key];
}

afterEach(() => {
  blankEnv();
});

function memory(initial?: ProfileRec) {
  const profiles = new Map<string, ProfileRec>();
  if (initial) profiles.set(initial.id, { ...initial });
  const events: { user_id: string | null; event_name: string; properties: Record<string, unknown> }[] = [];
  const store: BillingStore = {
    async getUser(token) {
      if (token !== "good") return null;
      return { id: initial?.id ?? "user-1", email: "a@b.test" };
    },
    async getProfile(userId) {
      return profiles.get(userId) ?? null;
    },
    async getProfileByCustomer(customerId) {
      for (const profile of profiles.values()) if (profile.stripe_customer_id === customerId) return profile;
      return null;
    },
    async updateProfile(userId, patch) {
      const current = profiles.get(userId) ?? {
        id: userId,
        email: null,
        subscription_status: "none" as const,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      };
      profiles.set(userId, { ...current, ...patch, id: userId });
    },
    async hasEvent(stripeEventId) {
      return events.some((event) => event.properties.stripe_event_id === stripeEventId);
    },
    async insertEvent(row) {
      events.push(row);
    },
  };
  return { store, profiles, events };
}

const stripe: CheckoutStripe = {
  customers: { create: async () => ({ id: "cus_new" }) },
  checkout: { sessions: { create: async () => ({ url: "https://checkout.stripe.test/c" }) } },
  subscriptions: {
    retrieve: async (id) => ({
      id,
      customer: "cus_new",
      status: "active",
      current_period_end: 1_800_000_000,
      metadata: { user_id: "user-1" },
    }),
  },
};

const env = {
  stripeSecret: "sk_test_123",
  webhookSecret: "whsec_test",
  priceId: "price_test",
  supabaseUrl: "http://127.0.0.1:54321",
  serviceRoleKey: "service",
};

function event(partial: Partial<StripeEvent> & Pick<StripeEvent, "type">): StripeEvent {
  return { id: partial.id ?? "evt_1", type: partial.type, data: partial.data ?? { object: {} } };
}

describe("readBillingEnv", () => {
  it("refuses a missing configuration and a live secret", () => {
    expect(readBillingEnv({}).ok).toBe(false);
    if (!readBillingEnv({}).ok) expect(readBillingEnv({}).body).toEqual({ error: "Billing isn't configured" });
    const live = readBillingEnv({
      STRIPE_SECRET_KEY: "sk_live_nope",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      STRIPE_PRICE_ID: "price_test",
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });
    expect(live).toEqual({ ok: false, status: 500, body: { error: "Billing isn't configured" } });
  });

  it("accepts a test secret", () => {
    const read = readBillingEnv({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      STRIPE_PRICE_ID: "price_test",
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });
    expect(read.ok).toBe(true);
  });
});

describe("createCheckoutSession", () => {
  it("requires a session, refuses someone who already has access, and returns a Checkout URL", async () => {
    const free = memory({ id: "user-1", email: "a@b.test", subscription_status: "none", stripe_customer_id: null, stripe_subscription_id: null });
    expect((await createCheckoutSession({ method: "GET", authorization: "Bearer good", origin: "http://localhost:5173" }, { env, stripe, store: free.store })).status).toBe(405);
    expect((await createCheckoutSession({ method: "POST", authorization: undefined, origin: "http://localhost:5173" }, { env, stripe, store: free.store })).status).toBe(401);

    const started = await createCheckoutSession({ method: "POST", authorization: "Bearer good", origin: "https://app.test" }, { env, stripe, store: free.store });
    expect(started).toEqual({ status: 200, body: { url: "https://checkout.stripe.test/c" } });
    expect(free.profiles.get("user-1")?.stripe_customer_id).toBe("cus_new");
    expect(free.events.map((row) => row.event_name)).toEqual(["checkout_started"]);
    expect(free.events[0].properties).toEqual({ price_id: "price_test" });

    const paid = memory({ id: "user-1", email: "a@b.test", subscription_status: "active", stripe_customer_id: "cus_new", stripe_subscription_id: "sub_1" });
    const again = await createCheckoutSession({ method: "POST", authorization: "Bearer good", origin: "https://app.test" }, { env, stripe, store: paid.store });
    expect(again).toEqual({ status: 409, body: { error: "already_subscribed" } });
  });
});

describe("applyStripeEvent", () => {
  it("marks the profile active and logs checkout_paid once", async () => {
    const { store, profiles, events } = memory();
    const completed = event({
      id: "evt_paid",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "user-1", subscription: "sub_new", payment_status: "paid", amount_total: 999, currency: "usd" } },
    });
    expect((await applyStripeEvent(completed, { store, stripe })).status).toBe(200);
    expect(profiles.get("user-1")?.subscription_status).toBe("active");
    expect(profiles.get("user-1")?.stripe_subscription_id).toBe("sub_new");
    expect(events.filter((row) => row.event_name === "checkout_paid")).toHaveLength(1);
    await applyStripeEvent(completed, { store, stripe });
    expect(events.filter((row) => row.event_name === "checkout_paid")).toHaveLength(1);
  });

  it("cancels on subscription.deleted and leaves a comped profile alone", async () => {
    const active = memory({ id: "user-1", email: "a@b.test", subscription_status: "active", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" });
    await applyStripeEvent(
      event({
        id: "evt_del",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_1", customer: "cus_1", status: "canceled", metadata: { user_id: "user-1" } } },
      }),
      { store: active.store, stripe },
    );
    expect(active.profiles.get("user-1")?.subscription_status).toBe("canceled");
    expect(active.events.map((row) => row.event_name)).toEqual(["subscription_canceled"]);

    const comped = memory({ id: "user-2", email: "c@d.test", subscription_status: "comped", stripe_customer_id: "cus_2", stripe_subscription_id: "sub_2" });
    await applyStripeEvent(
      event({
        id: "evt_comp",
        type: "customer.subscription.updated",
        data: { object: { id: "sub_2", customer: "cus_2", status: "canceled", metadata: { user_id: "user-2" } } },
      }),
      { store: comped.store, stripe },
    );
    expect(comped.profiles.get("user-2")?.subscription_status).toBe("comped");
    await applyStripeEvent(
      event({ id: "evt_fail", type: "invoice.payment_failed", data: { object: { customer: "cus_2" } } }),
      { store: comped.store, stripe },
    );
    expect(comped.profiles.get("user-2")?.subscription_status).toBe("comped");

    const owing = memory({ id: "user-3", email: "e@f.test", subscription_status: "active", stripe_customer_id: "cus_3", stripe_subscription_id: "sub_3" });
    await applyStripeEvent(
      event({ id: "evt_due", type: "invoice.payment_failed", data: { object: { customer: "cus_3" } } }),
      { store: owing.store, stripe },
    );
    expect(owing.profiles.get("user-3")?.subscription_status).toBe("past_due");
  });

  it("maps Stripe statuses", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("trialing")).toBe("trialing");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("unpaid")).toBe("canceled");
    expect(mapStripeStatus("incomplete")).toBeNull();
  });
});
