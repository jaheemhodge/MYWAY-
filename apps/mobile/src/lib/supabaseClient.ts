import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type Supabase = SupabaseClient<Database>;

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: Supabase | null = null;

/** True when both public env vars are set (or a test client is installed). Only the anon key ever reaches the browser. */
export function isSupabaseConfigured(): boolean {
  return client !== null || Boolean(url && anonKey);
}

/**
 * Lazily created singleton. Created on first use so that importing this module (for example in
 * unit tests or on marketing pages) never throws when the env vars are missing.
 */
export function getSupabase(): Supabase {
  if (client) return client;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).");
  }
  client = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

/** Test seam: swap the client (for example with a fake) and reset it afterwards. */
export function setSupabaseClientForTests(next: Supabase | null): void {
  client = next;
}
