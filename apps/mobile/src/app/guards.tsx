import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./state/AuthProvider";
import { useProfile } from "./state/ProfileProvider";
import { DEFAULT_AFTER_LOGIN, saveReturnTo, takeReturnTo } from "./state/returnTo";

/*
 * Route guards. Use as a layout route (<Route element={<RequireSession />}> … renders <Outlet />)
 * or as a wrapper (<RequireSession>…</RequireSession>). No styling: they render nothing of their
 * own apart from a one-line loading / configuration notice that the design pass can replace.
 */

type GuardProps = { children?: ReactNode };

export function Loading({ children = "Loading…" }: { children?: ReactNode }) {
  return (
    <p role="status" aria-live="polite">
      {children}
    </p>
  );
}

/** Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing from the build. */
export function UnconfiguredNotice() {
  return (
    <main>
      <h1>Accounts aren't set up on this site yet</h1>
      <p>
        The app needs <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. See the README for the
        Supabase setup steps.
      </p>
    </main>
  );
}

/** /app/*: needs a session. Signed-out visitors go to /login and come back here afterwards. */
export function RequireSession({ children }: GuardProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "unconfigured") return <UnconfiguredNotice />;
  if (status === "loading") return <Loading />;
  if (status === "signedOut") {
    const intended = `${location.pathname}${location.search}${location.hash}`;
    saveReturnTo(intended);
    return <Navigate to="/login" replace state={{ from: intended }} />;
  }
  return children !== undefined ? <>{children}</> : <Outlet />;
}

/** Inside RequireSession: a profile without onboarded_at goes to /onboarding first. */
export function RequireOnboarded({ children }: GuardProps) {
  const { status, onboarded, error } = useProfile();
  const location = useLocation();

  if (status === "idle" || status === "loading") return <Loading>Loading your plan…</Loading>;
  if (status === "error") {
    return (
      <main>
        <p role="alert">{error ?? "We couldn't load your details."}</p>
      </main>
    );
  }
  if (!onboarded) {
    saveReturnTo(`${location.pathname}${location.search}`);
    return <Navigate to="/onboarding" replace />;
  }
  return children !== undefined ? <>{children}</> : <Outlet />;
}

/** /login and /signup: signed-in users go to where they were heading, or Home. */
export function RedirectIfAuthed({ children }: GuardProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Loading />;
  if (status === "signedIn") {
    const from = (location.state as { from?: string } | null)?.from;
    const target = from && from.startsWith("/app") ? from : takeReturnTo();
    return <Navigate to={target || DEFAULT_AFTER_LOGIN} replace />;
  }
  return children !== undefined ? <>{children}</> : <Outlet />;
}
