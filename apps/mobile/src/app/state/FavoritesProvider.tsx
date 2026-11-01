import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addFavorite,
  FAVORITES_EVENT,
  FAVORITES_STORAGE_KEY,
  readLocalFavorites,
  removeFavorite,
  syncFavorites,
} from "@/lib/favorites";
import { useAuth } from "./AuthProvider";

export interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (exerciseId: string) => boolean;
  toggle: (exerciseId: string) => Promise<void>;
  add: (exerciseId: string) => Promise<void>;
  remove: (exerciseId: string) => Promise<void>;
  /** Last sync/write failure, if any. The local copy is always kept. */
  error: string | null;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id ?? null : null;
  const [favorites, setFavorites] = useState<string[]>(() => readLocalFavorites());
  const [error, setError] = useState<string | null>(null);

  // Local storage is the live source for rendering; other tabs and the lib notify through events.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === FAVORITES_STORAGE_KEY && setFavorites(readLocalFavorites());
    const onLocal = () => setFavorites(readLocalFavorites());
    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITES_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITES_EVENT, onLocal);
    };
  }, []);

  // On login, push hearts saved while signed out and take the merged server list.
  useEffect(() => {
    if (!userId) return;
    syncFavorites(userId)
      .then(() => setError(null))
      .catch(() => setError("We couldn't sync your saved exercises. They're still saved on this device."));
  }, [userId]);

  const add = useCallback(
    async (id: string) => {
      try {
        await addFavorite(id, userId);
        setError(null);
      } catch {
        setError("We couldn't save that to your account. It's saved on this device.");
      }
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await removeFavorite(id, userId);
        setError(null);
      } catch {
        setError("We couldn't update your account. The change is saved on this device.");
      }
    },
    [userId],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (id) => favorites.includes(id),
      toggle: (id) => (favorites.includes(id) ? remove(id) : add(id)),
      add,
      remove,
      error,
    }),
    [favorites, add, remove, error],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites must be used inside FavoritesProvider");
  return value;
}
