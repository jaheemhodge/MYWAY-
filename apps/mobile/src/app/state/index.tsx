import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { FavoritesProvider } from "./FavoritesProvider";
import { ProfileProvider } from "./ProfileProvider";
import { ProgressProvider } from "./ProgressProvider";

export { AuthProvider, useAuth, type AuthContextValue, type AuthStatus } from "./AuthProvider";
export { ProfileProvider, useProfile, type ProfileContextValue, type ProfileStatus } from "./ProfileProvider";
export { ProgressProvider, useProgress, type ProgressContextValue, type ProgressStatus } from "./ProgressProvider";
export { FavoritesProvider, useFavorites, type FavoritesContextValue } from "./FavoritesProvider";
export { useDayPlan } from "./useDayPlan";
export * from "./returnTo";

/** Auth → Profile → Progress → Favorites, in dependency order. */
export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProgressProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </ProgressProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
