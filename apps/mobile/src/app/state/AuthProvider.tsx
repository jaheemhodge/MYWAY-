import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as auth from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export type AuthStatus = "loading" | "unconfigured" | "signedOut" | "signedIn";

export interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /** True right after the user arrives from a password-reset email, until they set a new password. */
  isPasswordRecovery: boolean;
  googleEnabled: boolean;
  signUp: typeof auth.signUp;
  signIn: typeof auth.signIn;
  signInWithMagicLink: typeof auth.signInWithMagicLink;
  signInWithGoogle: typeof auth.signInWithGoogle;
  resetPassword: typeof auth.resetPassword;
  updatePassword: typeof auth.updatePassword;
  signOut: typeof auth.signOut;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [status, setStatus] = useState<AuthStatus>(configured ? "loading" : "unconfigured");
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordRecovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!configured) return undefined;
    let cancelled = false;

    auth
      .getSession()
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        setStatus(s ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (!cancelled) setStatus("signedOut");
      });

    const unsubscribe = auth.onAuthChange((event, s) => {
      if (cancelled) return;
      setSession(s);
      setStatus(s ? "signedIn" : "signedOut");
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
      if (event === "USER_UPDATED") setRecovery(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      isPasswordRecovery,
      googleEnabled: auth.GOOGLE_ENABLED,
      signUp: auth.signUp,
      signIn: auth.signIn,
      signInWithMagicLink: auth.signInWithMagicLink,
      signInWithGoogle: auth.signInWithGoogle,
      resetPassword: auth.resetPassword,
      updatePassword: auth.updatePassword,
      signOut: auth.signOut,
    }),
    [status, session, isPasswordRecovery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
