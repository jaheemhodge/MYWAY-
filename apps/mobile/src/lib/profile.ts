/**
 * Profile: the one row per user that holds first name, focus area and onboarding state.
 */
import type { Answers, FocusArea, ProfileRow, SubscriptionStatus } from "./database.types";
import { isFocusArea } from "./plan";
import { saveQuestionnaire, toProgressError } from "./progress";
import { getSupabase } from "./supabaseClient";

const FULL_ACCESS: readonly SubscriptionStatus[] = ["active", "trialing", "comped"];

export interface Profile {
  id: string;
  firstName: string | null;
  ageRange: string | null;
  focusArea: FocusArea | null;
  /** ISO date (YYYY-MM-DD) of Day 1, set at the end of onboarding. */
  planStartDate: string | null;
  onboardedAt: string | null;
  createdAt: string;
  email: string | null;
  signupMethod: string | null;
  subscriptionStatus: SubscriptionStatus;
  /** Same rule as has_full_access(): active, trialing or comped. */
  hasFullAccess: boolean;
}

function subscriptionStatusOf(value: string | null | undefined): SubscriptionStatus {
  if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "comped") return value;
  return "none";
}

export function fromRow(row: ProfileRow): Profile {
  const subscriptionStatus = subscriptionStatusOf(row.subscription_status);
  return {
    id: row.id,
    firstName: row.first_name,
    ageRange: row.age_range,
    focusArea: isFocusArea(row.focus_area) ? row.focus_area : null,
    planStartDate: row.plan_start_date,
    onboardedAt: row.onboarded_at,
    createdAt: row.created_at,
    email: row.email ?? null,
    signupMethod: row.signup_method ?? null,
    subscriptionStatus,
    hasFullAccess: FULL_ACCESS.includes(subscriptionStatus),
  };
}

export function isOnboarded(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.onboardedAt && profile.focusArea);
}

async function requireUserId(): Promise<string> {
  const { data } = await getSupabase().auth.getUser();
  const id = data.user?.id;
  if (!id) throw toProgressError("NOT_AUTHENTICATED");
  return id;
}

/** The signed-in user's profile, or null when the row doesn't exist yet. */
export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await getSupabase().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw toProgressError(error);
  return data ? fromRow(data as ProfileRow) : null;
}

function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface OnboardingInput {
  answers: Answers;
  focusArea: FocusArea;
  /** Optional details collected during onboarding. */
  firstName?: string;
  ageRange?: string;
}

/**
 * Finishes onboarding: stores the baseline questionnaire, then sets focus_area, plan_start_date
 * (today) and onboarded_at on the profile. Safe to call again; it keeps the original start date.
 */
export async function saveOnboarding(answers: Answers, focusArea: FocusArea, extra: Pick<OnboardingInput, "firstName" | "ageRange"> = {}): Promise<Profile> {
  if (!isFocusArea(focusArea)) throw new Error("Choose a focus area: knees, lower_back or hips_balance.");
  const userId = await requireUserId();
  await saveQuestionnaire("baseline", answers);

  const existing = await getProfile();
  // Column grants allow UPDATE of these fields only. An upsert becomes
  // INSERT ... ON CONFLICT DO UPDATE SET id = excluded.id, which Postgres rejects.
  const patch: Partial<ProfileRow> = {
    focus_area: focusArea,
    plan_start_date: existing?.planStartDate ?? todayIsoDate(),
    onboarded_at: existing?.onboardedAt ?? new Date().toISOString(),
  };
  if (extra.firstName?.trim()) patch.first_name = extra.firstName.trim();
  if (extra.ageRange?.trim()) patch.age_range = extra.ageRange.trim();

  const updated = await getSupabase().from("profiles").update(patch).eq("id", userId).select().maybeSingle();
  if (updated.error) throw toProgressError(updated.error);
  if (updated.data) return fromRow(updated.data as ProfileRow);

  const inserted = await getSupabase().from("profiles").insert({ id: userId, ...patch }).select().single();
  if (inserted.error) throw toProgressError(inserted.error);
  return fromRow(inserted.data as ProfileRow);
}

export async function updateProfile(patch: Partial<Pick<Profile, "firstName" | "ageRange">>): Promise<Profile> {
  const userId = await requireUserId();
  const row: Partial<ProfileRow> = {};
  if (patch.firstName !== undefined) row.first_name = patch.firstName;
  if (patch.ageRange !== undefined) row.age_range = patch.ageRange;
  const { data, error } = await getSupabase().from("profiles").update(row).eq("id", userId).select().single();
  if (error) throw toProgressError(error);
  return fromRow(data as ProfileRow);
}
