/**
 * Mobility full access = $9.99 USD per month, recurring.
 * STRIPE_PRICE_ID selects the Stripe Price. Nothing in the repo creates that Price.
 * Test mode only until STRIPE_TEST_MODE_ONLY in ./env.ts is lifted.
 */
import type { BillingEnv } from "./env";

export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled" | "comped";

export interface ProfileRec {
  id: string;
  email: string | null;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end?: string | null;
}

export interface BillingStore {
  getUser(token: string): Promise<{ id: string; email: string | null } | null>;
  getProfile(userId: string): Promise<ProfileRec | null>;
  getProfileByCustomer(customerId: string): Promise<ProfileRec | null>;
  updateProfile(userId: string, patch: Partial<ProfileRec>): Promise<void>;
  hasEvent(stripeEventId: string): Promise<boolean>;
  insertEvent(row: { user_id: string | null; event_name: string; properties: Record<string, unknown> }): Promise<void>;
}

export interface CheckoutStripe {
  customers: {
    create(input: { email?: string; metadata: { user_id: string } }): Promise<{ id: string }>;
  };
  checkout: {
    sessions: {
      create(input: Record<string, unknown>): Promise<{ url: string | null }>;
    };
  };
  subscriptions: {
    retrieve(id: string): Promise<StripeSubscription>;
  };
}

export interface StripeSubscription {
  id: string;
  customer: string | { id: string };
  status: string;
  current_period_end?: number | null;
  metadata?: { user_id?: string };
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

const FULL = new Set<SubscriptionStatus>(["active", "trialing", "comped"]);

export function hasFullAccess(status: string | null | undefined): boolean {
  return FULL.has(status as SubscriptionStatus);
}

/** Maps a Stripe subscription status onto profiles.subscription_status. null means "leave it". */
export function mapStripeStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return null;
    default:
      return null;
  }
}

function customerId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

function periodEnd(subscription: StripeSubscription): string | null {
  if (!subscription.current_period_end) return null;
  return new Date(subscription.current_period_end * 1000).toISOString();
}

async function rememberEvent(
  store: BillingStore,
  stripeEventId: string,
  userId: string | null,
  eventName: string,
  properties: Record<string, unknown>,
): Promise<void> {
  if (await store.hasEvent(stripeEventId)) return;
  await store.insertEvent({
    user_id: userId,
    event_name: eventName,
    properties: { ...properties, stripe_event_id: stripeEventId },
  });
}

export async function createCheckoutSession(
  input: { method: string; authorization: string | undefined; origin: string },
  deps: { env: BillingEnv; stripe: CheckoutStripe; store: BillingStore },
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (input.method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  const token = input.authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { status: 401, body: { error: "Sign in required" } };
  const user = await deps.store.getUser(token);
  if (!user) return { status: 401, body: { error: "Sign in required" } };

  const profile = await deps.store.getProfile(user.id);
  if (profile && hasFullAccess(profile.subscription_status)) {
    return { status: 409, body: { error: "already_subscribed" } };
  }

  let customer = profile?.stripe_customer_id ?? null;
  if (!customer) {
    const created = await deps.stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customer = created.id;
    await deps.store.updateProfile(user.id, { stripe_customer_id: customer });
  }

  const session = await deps.stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: deps.env.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${input.origin}/app/account?checkout=success`,
    cancel_url: `${input.origin}/app/home?checkout=cancelled`,
  });

  await deps.store.insertEvent({
    user_id: user.id,
    event_name: "checkout_started",
    properties: { price_id: deps.env.priceId },
  });

  return { status: 200, body: { url: session.url } };
}

async function saveSubscription(
  store: BillingStore,
  userId: string,
  subscription: StripeSubscription,
): Promise<ProfileRec | null> {
  const profile = (await store.getProfile(userId)) ?? {
    id: userId,
    email: null,
    subscription_status: "none" as const,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };
  const end = periodEnd(subscription);
  if (profile.subscription_status === "comped") {
    await store.updateProfile(userId, {
      stripe_customer_id: customerId(subscription.customer) ?? profile.stripe_customer_id,
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: end,
    });
    return profile;
  }
  const mapped = mapStripeStatus(subscription.status);
  const patch: Partial<ProfileRec> = {
    stripe_customer_id: customerId(subscription.customer) ?? profile.stripe_customer_id,
    stripe_subscription_id: subscription.id,
    subscription_current_period_end: end,
  };
  if (mapped) patch.subscription_status = mapped;
  await store.updateProfile(userId, patch);
  return { ...profile, ...patch };
}

async function resolveUserId(store: BillingStore, object: Record<string, unknown>): Promise<string | null> {
  const direct = (object.client_reference_id as string | undefined) || (object.metadata as { user_id?: string } | undefined)?.user_id;
  if (direct) return direct;
  const subMeta = (object.metadata as { user_id?: string } | undefined)?.user_id;
  if (subMeta) return subMeta;
  const customer = customerId(object.customer);
  if (!customer) return null;
  const profile = await store.getProfileByCustomer(customer);
  return profile?.id ?? null;
}

export async function applyStripeEvent(
  event: StripeEvent,
  deps: { store: BillingStore; stripe: Pick<CheckoutStripe, "subscriptions"> },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    const userId = await resolveUserId(deps.store, object);
    if (!userId) return { status: 200, body: { received: true } };
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : customerId(object.subscription);
    if (subscriptionId) {
      const subscription = await deps.stripe.subscriptions.retrieve(subscriptionId);
      await saveSubscription(deps.store, userId, subscription);
    }
    const payment = String(object.payment_status ?? "");
    if (payment === "paid" || payment === "no_payment_required") {
      await rememberEvent(deps.store, event.id, userId, "checkout_paid", {
        amount_total: object.amount_total ?? null,
        currency: object.currency ?? null,
      });
    }
    return { status: 200, body: { received: true } };
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = object as unknown as StripeSubscription;
    const userId =
      subscription.metadata?.user_id ||
      (await resolveUserId(deps.store, { customer: subscription.customer, metadata: subscription.metadata }));
    if (!userId) return { status: 200, body: { received: true } };
    const status = event.type === "customer.subscription.deleted" ? "canceled" : subscription.status;
    await saveSubscription(deps.store, userId, { ...subscription, status });
    const mapped = event.type === "customer.subscription.deleted" ? "canceled" : mapStripeStatus(subscription.status);
    if (mapped === "canceled") {
      await rememberEvent(deps.store, event.id, userId, "subscription_canceled", { stripe_subscription_id: subscription.id });
    }
    return { status: 200, body: { received: true } };
  }

  if (event.type === "invoice.payment_failed") {
    const customer = customerId(object.customer);
    const profile = customer ? await deps.store.getProfileByCustomer(customer) : null;
    if (profile && profile.subscription_status !== "comped") {
      await deps.store.updateProfile(profile.id, { subscription_status: "past_due" });
    }
    return { status: 200, body: { received: true } };
  }

  return { status: 200, body: { received: true } };
}
