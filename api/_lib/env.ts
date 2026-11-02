/**
 * Test mode only. Set this to false when a live key (sk_live_) is intentionally allowed.
 */
export const STRIPE_TEST_MODE_ONLY = true;

export type BillingEnv = {
  stripeSecret: string;
  webhookSecret: string;
  priceId: string;
  supabaseUrl: string;
  serviceRoleKey: string;
};

export function readBillingEnv(
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; env: BillingEnv } | { ok: false; status: 500; body: { error: string } } {
  const stripeSecret = env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET ?? "";
  const priceId = env.STRIPE_PRICE_ID ?? "";
  const supabaseUrl = env.SUPABASE_URL ?? "";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!stripeSecret || !webhookSecret || !priceId || !supabaseUrl || !serviceRoleKey) {
    return { ok: false, status: 500, body: { error: "Billing isn't configured" } };
  }
  if (STRIPE_TEST_MODE_ONLY && !stripeSecret.startsWith("sk_test_")) {
    return { ok: false, status: 500, body: { error: "Billing isn't configured" } };
  }
  return { ok: true, env: { stripeSecret, webhookSecret, priceId, supabaseUrl, serviceRoleKey } };
}

export function originFrom(headers: Record<string, string | string[] | undefined>, env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const proto = header(headers, "x-forwarded-proto") ?? "http";
  const host = header(headers, "x-forwarded-host") ?? header(headers, "host") ?? "localhost";
  return `${proto}://${host}`;
}

function header(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
