/**
 * Favorites (hearts). Signed-out visitors keep them in localStorage; signed-in users keep them in
 * the favorites table, mirrored locally so the UI never waits on the network. On login the local
 * list is pushed to the server and the merged result comes back.
 *
 * The storage key matches the earlier prototype so hearts saved before accounts existed carry over.
 */
import { getSupabase } from "./supabaseClient";

export const FAVORITES_STORAGE_KEY = "mobility.saved.v1";
/** Fired on window whenever the local list changes, so every heart re-renders. */
export const FAVORITES_EVENT = "mobility-saved";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let memory: string[] = [];

function store(): KeyValueStore | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
}

export function readLocalFavorites(kv: KeyValueStore | null = store()): string[] {
  try {
    const raw = kv?.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) memory = unique(parsed as string[]);
    }
  } catch {
    /* unreadable storage: keep the in-memory copy */
  }
  return memory;
}

export function writeLocalFavorites(ids: readonly string[], kv: KeyValueStore | null = store()): string[] {
  memory = unique(ids);
  try {
    kv?.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    /* storage blocked: in-memory copy still serves this visit */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FAVORITES_EVENT));
  return memory;
}

/** Pure helpers used by both storage paths. */
export function addToList(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? [...ids] : [...ids, id];
}
export function removeFromList(ids: readonly string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}

/* ------------------------------------------------------------------------------------------------
 * Server side
 * ---------------------------------------------------------------------------------------------- */

async function fetchServerFavorites(): Promise<string[]> {
  const { data, error } = await getSupabase().from("favorites").select("exercise_id").order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => row.exercise_id);
}

/**
 * Current favorites. With a userId the server is the source of truth (and the local copy is
 * refreshed); without one, the local list is returned.
 */
export async function listFavorites(userId?: string | null): Promise<string[]> {
  if (!userId) return readLocalFavorites();
  try {
    const ids = await fetchServerFavorites();
    return writeLocalFavorites(ids);
  } catch {
    return readLocalFavorites();
  }
}

export async function addFavorite(exerciseId: string, userId?: string | null): Promise<string[]> {
  const next = writeLocalFavorites(addToList(readLocalFavorites(), exerciseId));
  if (userId) {
    const { error } = await getSupabase()
      .from("favorites")
      .upsert({ user_id: userId, exercise_id: exerciseId }, { onConflict: "user_id,exercise_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  return next;
}

export async function removeFavorite(exerciseId: string, userId?: string | null): Promise<string[]> {
  const next = writeLocalFavorites(removeFromList(readLocalFavorites(), exerciseId));
  if (userId) {
    const { error } = await getSupabase().from("favorites").delete().eq("user_id", userId).eq("exercise_id", exerciseId);
    if (error) throw error;
  }
  return next;
}

/**
 * On login: push anything saved while signed out, then take the server list as truth.
 * Returns the merged list (also written locally).
 */
export async function syncFavorites(userId: string): Promise<string[]> {
  const local = readLocalFavorites();
  if (local.length) {
    const { error } = await getSupabase()
      .from("favorites")
      .upsert(
        local.map((exercise_id) => ({ user_id: userId, exercise_id })),
        { onConflict: "user_id,exercise_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  }
  const merged = await fetchServerFavorites();
  return writeLocalFavorites(merged);
}
