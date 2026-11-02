import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createCheckoutSession, type BillingStore, type CheckoutStripe } from "./_lib/billing.js";
import { originFrom, readBillingEnv, type BillingEnv } from "./_lib/env.js";
import { serviceClient, storeFromSupabase } from "./_lib/supabaseStore.js";

/**
 * POST /api/create-checkout-session
 * Test mode only (sk_test_). Mobility full access is $9.99 USD / month via STRIPE_PRICE_ID.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const billing = readBillingEnv();
  if (!billing.ok) {
    res.status(billing.status).json(billing.body);
    return;
  }
  const origin = originFrom(req.headers);
  if (!origin.ok) {
    res.status(origin.status).json(origin.body);
    return;
  }
  try {
    const stripe = new Stripe(billing.env.stripeSecret);
    const store = storeFromSupabase(serviceClient(billing.env.supabaseUrl, billing.env.serviceRoleKey));
    const result = await runCheckout(
      { method: req.method ?? "GET", authorization: header(req, "authorization"), origin: origin.origin },
      { env: billing.env, stripe: stripe as unknown as CheckoutStripe, store },
    );
    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({ error: "Checkout failed" });
  }
}

/** Store and Stripe failures become a 500 so the client can show a plain sentence. */
export async function runCheckout(
  input: { method: string; authorization: string | undefined; origin: string },
  deps: { env: BillingEnv; stripe: CheckoutStripe; store: BillingStore },
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    return await createCheckoutSession(input, deps);
  } catch {
    return { status: 500, body: { error: "Checkout failed" } };
  }
}

function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
