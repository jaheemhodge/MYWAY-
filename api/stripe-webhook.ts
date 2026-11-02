import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { applyStripeEvent, type BillingStore, type CheckoutStripe, type StripeEvent } from "./_lib/billing.js";
import { readBillingEnv } from "./_lib/env.js";
import { serviceClient, storeFromSupabase } from "./_lib/supabaseStore.js";

export const config = { api: { bodyParser: false } };

/**
 * POST /api/stripe-webhook
 * Verifies the Stripe signature, then updates profiles. Test mode only (sk_test_).
 * Comped profiles are never downgraded. The same event id is logged once.
 * A database failure answers 500 so Stripe retries. The body has no secrets.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const billing = readBillingEnv();
  if (!billing.ok) {
    res.status(billing.status).json(billing.body);
    return;
  }
  const signature = req.headers["stripe-signature"];
  const sig = Array.isArray(signature) ? signature[0] : signature;
  if (!sig) {
    res.status(400).json({ error: "Missing signature" });
    return;
  }
  const stripe = new Stripe(billing.env.stripeSecret);
  let event: Stripe.Event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(raw, sig, billing.env.webhookSecret);
  } catch {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }
  const store = storeFromSupabase(serviceClient(billing.env.supabaseUrl, billing.env.serviceRoleKey));
  const result = await processVerifiedEvent(event as unknown as StripeEvent, {
    store,
    stripe: stripe as unknown as CheckoutStripe,
    priceId: billing.env.priceId,
  });
  res.status(result.status).json(result.body);
}

export async function processVerifiedEvent(
  event: StripeEvent,
  deps: { store: BillingStore; stripe: Pick<CheckoutStripe, "subscriptions">; priceId: string },
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    return await applyStripeEvent(event, deps);
  } catch {
    console.error(`stripe webhook failed ${event.id} ${event.type}`);
    return { status: 500, body: { error: "Webhook processing failed" } };
  }
}

async function readRaw(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
