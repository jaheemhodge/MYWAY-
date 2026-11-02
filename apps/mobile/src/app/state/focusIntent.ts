/**
 * Remembers which focus area a visitor picked on the landing page so onboarding can preselect it.
 * sessionStorage survives the full-page redirects that magic links, email confirmation and OAuth use.
 */
import { isFocusArea, type FocusArea } from "@/lib/plan";

const KEY = "mobility.focusIntent.v1";

function safe(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Stores a focus area. Invalid values are ignored and the previous choice is left as it was. */
export function saveFocusIntent(value: string | null | undefined): void {
  if (!isFocusArea(value)) return;
  try {
    safe()?.setItem(KEY, value);
  } catch {
    /* ignore */
  }
}

export function peekFocusIntent(): FocusArea | null {
  try {
    const value = safe()?.getItem(KEY) ?? null;
    return isFocusArea(value) ? value : null;
  } catch {
    return null;
  }
}

/** Reads and clears the saved focus area. */
export function takeFocusIntent(): FocusArea | null {
  const value = peekFocusIntent();
  try {
    safe()?.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return value;
}
