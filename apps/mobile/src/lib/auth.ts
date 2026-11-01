import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";

/**
 * Auth operations with plain-language errors. Every function resolves (never rejects) with a
 * result the UI can show directly.
 */

export type AuthResult<T = undefined> = { ok: true; data: T; message?: string } | { ok: false; message: string };

export const GOOGLE_ENABLED = String(import.meta.env.VITE_ENABLE_GOOGLE ?? "").toLowerCase() === "true";

/** Where Supabase sends people back after a magic link, OAuth or password reset. */
function redirectTo(path: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

export const AUTH_RETURN_PATHS = {
  afterLogin: "/login",
  afterReset: "/reset-password",
} as const;

/* ------------------------------------------------------------------------------------------------
 * Error mapping
 * ---------------------------------------------------------------------------------------------- */

export const FRIENDLY = {
  invalidCredentials: "That email and password don't match. Check them and try again.",
  emailNotConfirmed: "Please confirm your email first. We sent you a link when you signed up.",
  userExists: "There's already an account with that email. Try signing in instead.",
  weakPassword: "Please choose a longer password: at least 8 characters.",
  invalidEmail: "That doesn't look like an email address. Check it and try again.",
  rateLimited: "Too many attempts for now. Please wait a minute and try again.",
  network: "We couldn't reach the server. Check your connection and try again.",
  sessionMissing: "Your sign-in link has expired. Please request a new one.",
  samePassword: "Please choose a password you haven't used here before.",
  notConfigured: "Sign-in isn't set up on this site yet.",
  unknown: "Something went wrong. Please try again.",
} as const;

type ErrorLike = { message?: string; status?: number; code?: string; name?: string } | string | null | undefined;

/** Turns a Supabase/Fetch error into one short sentence a 60-year-old would understand. */
export function mapAuthError(error: ErrorLike): string {
  if (!error) return FRIENDLY.unknown;
  const text = (typeof error === "string" ? error : error.message ?? "").toLowerCase();
  const code = typeof error === "string" ? "" : (error.code ?? "").toLowerCase();
  const status = typeof error === "string" ? undefined : error.status;

  if (text.includes("not configured")) return FRIENDLY.notConfigured;
  if (code === "invalid_credentials" || text.includes("invalid login credentials")) return FRIENDLY.invalidCredentials;
  if (code === "email_not_confirmed" || text.includes("email not confirmed")) return FRIENDLY.emailNotConfirmed;
  if (code === "user_already_exists" || code === "email_exists" || text.includes("already registered") || text.includes("already been registered"))
    return FRIENDLY.userExists;
  if (code === "weak_password" || text.includes("password should be at least") || text.includes("password is too short"))
    return FRIENDLY.weakPassword;
  if (code === "same_password" || text.includes("different from the old password")) return FRIENDLY.samePassword;
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || status === 429 || text.includes("rate limit") || text.includes("too many requests"))
    return FRIENDLY.rateLimited;
  if (
    code === "session_not_found" ||
    code === "otp_expired" ||
    text.includes("auth session missing") ||
    text.includes("otp has expired") ||
    text.includes("token has expired") ||
    text.includes("link is invalid")
  )
    return FRIENDLY.sessionMissing;
  if (code === "validation_failed" || text.includes("invalid email") || text.includes("unable to validate email") || text.includes("is invalid"))
    return FRIENDLY.invalidEmail;
  if (text.includes("failed to fetch") || text.includes("networkerror") || text.includes("network request failed") || text.includes("load failed"))
    return FRIENDLY.network;
  return FRIENDLY.unknown;
}

async function run<R extends { data: unknown; error: ErrorLike }>(op: () => Promise<R>, okMessage?: string): Promise<AuthResult<R["data"]>> {
  try {
    const { data, error } = await op();
    if (error) return { ok: false, message: mapAuthError(error) };
    return { ok: true, data: data as R["data"], message: okMessage };
  } catch (err) {
    return { ok: false, message: mapAuthError(err as ErrorLike) };
  }
}

/* ------------------------------------------------------------------------------------------------
 * Operations
 * ---------------------------------------------------------------------------------------------- */

export function signUp(firstName: string, email: string, password: string): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const name = firstName.trim();
  if (!name) return Promise.resolve({ ok: false, message: "Please tell us your first name." });
  return run(
    () =>
      getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: name },
          emailRedirectTo: redirectTo(AUTH_RETURN_PATHS.afterLogin),
        },
      }),
    "Account created.",
  );
}

export function signIn(email: string, password: string): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  return run(() => getSupabase().auth.signInWithPassword({ email: email.trim(), password }));
}

export function signInWithMagicLink(email: string): Promise<AuthResult<unknown>> {
  return run(
    () =>
      getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo(AUTH_RETURN_PATHS.afterLogin) },
      }),
    "Check your email for a sign-in link.",
  );
}

export function signInWithGoogle(): Promise<AuthResult<unknown>> {
  if (!GOOGLE_ENABLED) return Promise.resolve({ ok: false, message: "Google sign-in isn't available on this site." });
  return run(() =>
    getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo(AUTH_RETURN_PATHS.afterLogin) },
    }),
  );
}

export function resetPassword(email: string): Promise<AuthResult<unknown>> {
  return run(
    () => getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo(AUTH_RETURN_PATHS.afterReset) }),
    "Check your email for a link to choose a new password.",
  );
}

/** Only works while signed in, including the temporary session a reset link creates. */
export function updatePassword(newPassword: string): Promise<AuthResult<{ user: User | null }>> {
  return run(() => getSupabase().auth.updateUser({ password: newPassword }), "Your password has been changed.");
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) return { ok: false, message: mapAuthError(error) };
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, message: mapAuthError(err as ErrorLike) };
  }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

/** Subscribe to sign-in / sign-out / token refresh. Returns an unsubscribe function. */
export function onAuthChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
