import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BillingStore, ProfileRec, SubscriptionStatus } from "./billing";

function asStatus(value: string | null | undefined): SubscriptionStatus {
  if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "comped") return value;
  return "none";
}

function toProfile(row: Record<string, unknown>): ProfileRec {
  return {
    id: String(row.id),
    email: (row.email as string | null) ?? null,
    subscription_status: asStatus(row.subscription_status as string | null),
    stripe_customer_id: (row.stripe_customer_id as string | null) ?? null,
    stripe_subscription_id: (row.stripe_subscription_id as string | null) ?? null,
  };
}

export function storeFromSupabase(client: SupabaseClient): BillingStore {
  return {
    async getUser(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null };
    },
    async getProfile(userId) {
      const { data } = await client.from("profiles").select("id, email, subscription_status, stripe_customer_id, stripe_subscription_id").eq("id", userId).maybeSingle();
      return data ? toProfile(data as Record<string, unknown>) : null;
    },
    async getProfileByCustomer(customerId) {
      const { data } = await client.from("profiles").select("id, email, subscription_status, stripe_customer_id, stripe_subscription_id").eq("stripe_customer_id", customerId).maybeSingle();
      return data ? toProfile(data as Record<string, unknown>) : null;
    },
    async updateProfile(userId, patch) {
      const row: Record<string, unknown> = {};
      if (patch.email !== undefined) row.email = patch.email;
      if (patch.subscription_status !== undefined) row.subscription_status = patch.subscription_status;
      if (patch.stripe_customer_id !== undefined) row.stripe_customer_id = patch.stripe_customer_id;
      if (patch.stripe_subscription_id !== undefined) row.stripe_subscription_id = patch.stripe_subscription_id;
      if (patch.subscription_current_period_end !== undefined) row.subscription_current_period_end = patch.subscription_current_period_end;
      await client.from("profiles").update(row).eq("id", userId);
    },
    async hasEvent(stripeEventId) {
      const { data } = await client.from("app_events").select("id").filter("properties->>stripe_event_id", "eq", stripeEventId).limit(1);
      return Array.isArray(data) && data.length > 0;
    },
    async insertEvent(row) {
      const { error } = await client.from("app_events").insert(row);
      if (error && error.code !== "23505") throw error;
    },
  };
}

export function serviceClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
