import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Answers, FocusArea } from "@/lib/database.types";
import { getProfile, isOnboarded, saveOnboarding as saveOnboardingRequest, updateProfile as updateProfileRequest, type Profile } from "@/lib/profile";
import { useAuth } from "./AuthProvider";

export type ProfileStatus = "idle" | "loading" | "ready" | "error";

export interface ProfileContextValue {
  profile: Profile | null;
  status: ProfileStatus;
  error: string | null;
  /** True once the profile row has focus_area and onboarded_at. */
  onboarded: boolean;
  focusArea: FocusArea | null;
  refresh: () => Promise<void>;
  /** Saves baseline answers + focus area + start date; resolves with the updated profile. */
  saveOnboarding: (answers: Answers, focusArea: FocusArea, extra?: { firstName?: string; ageRange?: string }) => Promise<Profile>;
  updateProfile: (patch: Partial<Pick<Profile, "firstName" | "ageRange">>) => Promise<Profile>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const next = await getProfile();
      setProfile(next);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load your details.");
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    if (authStatus === "signedIn") void refresh();
    else {
      setProfile(null);
      setStatus("idle");
      setError(null);
    }
  }, [authStatus, refresh]);

  const saveOnboarding = useCallback<ProfileContextValue["saveOnboarding"]>(async (answers, focusArea, extra) => {
    const next = await saveOnboardingRequest(answers, focusArea, extra);
    setProfile(next);
    setStatus("ready");
    return next;
  }, []);

  const updateProfile = useCallback<ProfileContextValue["updateProfile"]>(async (patch) => {
    const next = await updateProfileRequest(patch);
    setProfile(next);
    return next;
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      status,
      error,
      onboarded: isOnboarded(profile),
      focusArea: profile?.focusArea ?? null,
      refresh,
      saveOnboarding,
      updateProfile,
    }),
    [profile, status, error, refresh, saveOnboarding, updateProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}
