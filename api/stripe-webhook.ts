import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { applyStripeEvent, type CheckoutStripe, type StripeEvent } from "./_lib/billing";
import { readBillingEnv } from "./_lib/env";
import { serviceClient, storeFromSupabase } from "./_lib/supabaseStore";

export const config = { api: { bodyParser: false } };

/**
 * POST /api/stripe-webhook
 * Verifies the Stripe signature, then updates profiles. Test mode only (sk_test_).
 * Comped profiles are never downgraded. The same event id is logged once.
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
  const result = await applyStripeEvent(event as unknown as StripeEvent, { store, stripe: stripe as unknown as CheckoutStripe });
  res.status(result.status).json(result.body);
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
