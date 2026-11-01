/**
 * Remembers where a signed-out visitor was heading so we can send them back after sign-in.
 * sessionStorage survives the full-page redirects that magic links and OAuth use.
 */
const KEY = "mobility.returnTo.v1";
export const DEFAULT_AFTER_LOGIN = "/app/home";

function safe(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Only in-app paths are remembered; anything else falls back to Home. */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.startsWith("/app") && !path.startsWith("//");
}

export function saveReturnTo(path: string): void {
  if (!isSafeReturnPath(path)) return;
  try {
    safe()?.setItem(KEY, path);
  } catch {
    /* ignore */
  }
}

export function peekReturnTo(): string | null {
  try {
    const value = safe()?.getItem(KEY) ?? null;
    return isSafeReturnPath(value) ? value : null;
  } catch {
    return null;
  }
}

/** Reads and clears the saved path. */
export function takeReturnTo(): string {
  const value = peekReturnTo();
  try {
    safe()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return value ?? DEFAULT_AFTER_LOGIN;
}
