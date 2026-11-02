import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createCheckoutSession, type CheckoutStripe } from "./_lib/billing";
import { originFrom, readBillingEnv } from "./_lib/env";
import { serviceClient, storeFromSupabase } from "./_lib/supabaseStore";

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
  const stripe = new Stripe(billing.env.stripeSecret);
  const store = storeFromSupabase(serviceClient(billing.env.supabaseUrl, billing.env.serviceRoleKey));
  const result = await createCheckoutSession(
    {
      method: req.method ?? "GET",
      authorization: header(req, "authorization"),
      origin: originFrom(req.headers),
    },
    { env: billing.env, stripe: stripe as unknown as CheckoutStripe, store },
  );
  res.status(result.status).json(result.body);
}

function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
