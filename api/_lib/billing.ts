/**
 * Mobility full access = $9.99 USD per month, recurring.
 * STRIPE_PRICE_ID selects the Stripe Price. Nothing in the repo creates that Price.
 * Test mode only until STRIPE_TEST_MODE_ONLY in ./env.ts is lifted.
 */
import type { BillingEnv } from "./env.js";

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
  items?: {
    data?: Array<{
      price?: string | { id?: string };
      current_period_end?: number | null;
    }>;
  };
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

function periodSeconds(subscription: StripeSubscription): number | null {
  if (typeof subscription.current_period_end === "number" && subscription.current_period_end > 0) return subscription.current_period_end;
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  if (typeof fromItem === "number" && fromItem > 0) return fromItem;
  return null;
}

function periodEnd(subscription: StripeSubscription): string | null {
  const seconds = periodSeconds(subscription);
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function priceIds(subscription: StripeSubscription): string[] {
  return (subscription.items?.data ?? [])
    .map((item) => (typeof item.price === "string" ? item.price : item.price?.id ?? ""))
    .filter((id) => id.length > 0);
}

/** Access is only for the Price this deployment sells. A foreign price is ignored. */
export function grantsOurPrice(subscription: StripeSubscription, priceId: string): boolean {
  return priceIds(subscription).includes(priceId);
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = "statusCode" in err ? (err as { statusCode?: number }).statusCode : "status" in err ? (err as { status?: number }).status : undefined;
  return status === 404;
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
  if (profile && (hasFullAccess(profile.subscription_status) || profile.subscription_status === "past_due")) {
    const body: Record<string, unknown> = { error: "already_subscribed" };
    if (profile.subscription_status === "past_due") body.reason = "past_due";
    return { status: 409, body };
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
  const ids = {
    stripe_customer_id: customerId(subscription.customer) ?? profile.stripe_customer_id,
    stripe_subscription_id: subscription.id,
  };
  if (profile.subscription_status === "comped") {
    await store.updateProfile(userId, end ? { ...ids, subscription_current_period_end: end } : ids);
    return profile;
  }
  const mapped = mapStripeStatus(subscription.status);
  const patch: Partial<ProfileRec> = end ? { ...ids, subscription_current_period_end: end } : ids;
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

const received = { status: 200, body: { received: true } };

async function loadSubscription(stripe: Pick<CheckoutStripe, "subscriptions">, id: string): Promise<StripeSubscription | "missing"> {
  try {
    return await stripe.subscriptions.retrieve(id);
  } catch (err) {
    if (isNotFound(err)) return "missing";
    throw err;
  }
}

export async function applyStripeEvent(
  event: StripeEvent,
  deps: { store: BillingStore; stripe: Pick<CheckoutStripe, "subscriptions">; priceId: string },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    const userId = await resolveUserId(deps.store, object);
    if (!userId) return received;
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : customerId(object.subscription);
    if (!subscriptionId) return received;
    const subscription = await loadSubscription(deps.stripe, subscriptionId);
    if (subscription === "missing" || !grantsOurPrice(subscription, deps.priceId)) return received;
    await saveSubscription(deps.store, userId, subscription);
    const payment = String(object.payment_status ?? "");
    if (payment === "paid" || payment === "no_payment_required") {
      await rememberEvent(deps.store, event.id, userId, "checkout_paid", {
        amount_total: object.amount_total ?? null,
        currency: object.currency ?? null,
      });
    }
    return received;
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const incoming = object as unknown as StripeSubscription;
    const userId =
      incoming.metadata?.user_id ||
      (await resolveUserId(deps.store, { customer: incoming.customer, metadata: incoming.metadata }));
    if (!userId || !incoming.id) return received;
    const profile = await deps.store.getProfile(userId);
    const storedId = profile?.stripe_subscription_id ?? null;
    const otherSubscription = Boolean(storedId && storedId !== incoming.id);
    const newerCreate = event.type === "customer.subscription.created" && !!profile && !hasFullAccess(profile.subscription_status);
    if (otherSubscription && !newerCreate) return received;

    if (event.type === "customer.subscription.deleted") {
      const fetched = await loadSubscription(deps.stripe, incoming.id);
      if (fetched !== "missing" && storedId && storedId !== incoming.id) return received;
      await saveSubscription(deps.store, userId, { ...incoming, ...(fetched === "missing" ? {} : fetched), status: "canceled" });
      await rememberEvent(deps.store, event.id, userId, "subscription_canceled", { stripe_subscription_id: incoming.id });
      return received;
    }

    const fetched = await loadSubscription(deps.stripe, incoming.id);
    if (fetched === "missing") {
      if (!storedId || storedId === incoming.id) {
        await saveSubscription(deps.store, userId, { ...incoming, status: "canceled" });
      }
      return received;
    }
    if (!grantsOurPrice(fetched, deps.priceId)) return received;
    await saveSubscription(deps.store, userId, fetched);
    if (mapStripeStatus(fetched.status) === "canceled") {
      await rememberEvent(deps.store, event.id, userId, "subscription_canceled", { stripe_subscription_id: fetched.id });
    }
    return received;
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
