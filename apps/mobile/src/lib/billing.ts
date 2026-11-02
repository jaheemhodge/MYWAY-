/**
 * Mobility full access is $9.99 USD per month, a recurring Stripe subscription.
 * The Stripe Price (STRIPE_PRICE_ID) is the source of truth. This label is only the copy.
 * Checkout runs in test mode until the server constant STRIPE_TEST_MODE_ONLY is lifted.
 */
import { FRIENDLY, type AuthResult } from "./auth";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

export const PRICE_LABEL = "$9.99 / month";

let checkoutOverride: boolean | null = null;

/** Test seam. Pass null to follow VITE_ENABLE_CHECKOUT again. */
export function setCheckoutEnabledForTests(value: boolean | null): void {
  checkoutOverride = value;
}

export function isCheckoutEnabled(): boolean {
  if (checkoutOverride !== null) return checkoutOverride;
  return String(import.meta.env.VITE_ENABLE_CHECKOUT ?? "").toLowerCase() === "true";
}

export const CHECKOUT_ENABLED = isCheckoutEnabled();

let assignUrl = (url: string) => window.location.assign(url);

/** Test seam. Pass null to use window.location.assign again. */
export function setCheckoutNavigationForTests(next: ((url: string) => void) | null): void {
  assignUrl = next ?? ((url: string) => window.location.assign(url));
}

export function checkoutStatusMessage(phase: "pending" | "ready" | "delayed" | "cancelled"): string {
  switch (phase) {
    case "pending":
      return "Thank you. Finishing your full access…";
    case "ready":
      return "You now have full access.";
    case "delayed":
      return "Payment received. Access can take a minute; refresh this page.";
    case "cancelled":
      return "No payment was taken.";
  }
}

/** Opens Stripe Checkout. The browser leaves this page when a session URL comes back. */
export async function startCheckout(): Promise<AuthResult<{ url: string }>> {
  try {
    if (!isSupabaseConfigured()) return { ok: false, message: FRIENDLY.notConfigured };
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, message: "Please sign in again to continue." };
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string; reason?: string };
    if (response.status === 401) return { ok: false, message: "Please sign in again to continue." };
    if (response.status === 409 || body.error === "already_subscribed") {
      if (body.reason === "past_due") return { ok: false, message: "Please update your payment method." };
      return { ok: false, message: "You already have full access." };
    }
    if (!response.ok || !body.url) return { ok: false, message: "Billing isn't available right now. Please try again." };
    assignUrl(body.url);
    return { ok: true, data: { url: body.url } };
  } catch {
    return { ok: false, message: FRIENDLY.network };
  }
}
