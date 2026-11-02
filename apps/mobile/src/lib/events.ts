/**
 * Client events. Only `login` and `day_started` may be inserted from the browser.
 * signup, onboarding_complete, day_completed and the checkout events are written
 * by the database or the billing functions.
 */
import type { AppEventName } from "./database.types";
import { getSession } from "./auth";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

export type EventName = AppEventName;
export type ClientEventName = "login" | "day_started";

/** Fire-and-forget. Never throws and never blocks the screen. */
export async function logEvent(name: ClientEventName, properties: Record<string, unknown> = {}): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await getSupabase().from("app_events").insert({ user_id: userId, event_name: name, properties });
  } catch {
    /* a rejected insert must not surface in the UI */
  }
}
