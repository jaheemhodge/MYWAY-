import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FRIENDLY, mapAuthError } from "@/lib/auth";
import { useAuth } from "../../state/AuthProvider";
import { useProfile } from "../../state/ProfileProvider";
import { DEFAULT_AFTER_LOGIN, peekReturnTo, takeReturnTo } from "../../state/returnTo";
import { Frame, StateBlock } from "./ui";

const EXPIRED = "Your sign-in link has expired or was opened on a different device. Please sign in again.";

/**
 * /auth/callback — Google, magic links and email confirmation land here.
 * supabase-js exchanges ?code= on its own (detectSessionInUrl, PKCE). Do not exchange it again.
 */
function authErrorMessage(search: string, hash: string): string | null {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const code = query.get("error") || fragment.get("error");
  const description = query.get("error_description") || fragment.get("error_description");
  if (!code && !description) return null;
  return mapAuthError({ message: `${description ?? ""} ${code ?? ""}`, code: code ?? "" });
}

/** Strict Mode runs effects twice. Hold the first decision so takeReturnTo() is not emptied by the second run. */
let heldTarget: { at: number; path: string } | null = null;

/** Test seam. The held path would otherwise leak into the next test for two seconds. */
export function resetAuthCallbackForTests(): void {
  heldTarget = null;
}

function redirectTarget(onboarded: boolean): string {
  const now = Date.now();
  if (heldTarget && now - heldTarget.at < 2000) return heldTarget.path;
  const path = onboarded ? peekReturnTo() ?? DEFAULT_AFTER_LOGIN : "/onboarding";
  if (onboarded) takeReturnTo();
  heldTarget = { at: now, path };
  return path;
}

export function AuthCallbackScreen() {
  const { status } = useAuth();
  const { status: profileStatus, onboarded } = useProfile();
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);
  const sent = useRef(false);
  const problem = authErrorMessage(window.location.search, window.location.hash);

  useEffect(() => {
    const id = window.setTimeout(() => setExpired(true), 10_000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (problem || sent.current || status !== "signedIn") return;
    if (profileStatus !== "ready" && profileStatus !== "error") return;
    sent.current = true;
    navigate(redirectTarget(onboarded), { replace: true });
  }, [problem, status, profileStatus, onboarded, navigate]);

  if (problem) {
    return (
      <Frame>
        <StateBlock
          kind="error"
          title={problem || FRIENDLY.unknown}
          action={
            <div className="c-actions">
              <Link to="/login" className="o-pill o-pill--solid">
                Sign in
              </Link>
              <Link to="/signup" className="o-pill o-pill--outline">
                Create an account
              </Link>
            </div>
          }
        >
          You can try again, or use your email and password.
        </StateBlock>
      </Frame>
    );
  }

  if (status === "unconfigured" || (expired && status !== "signedIn")) {
    return (
      <Frame>
        <StateBlock
          kind="error"
          title={EXPIRED}
          action={
            <div className="c-actions">
              <Link to="/login" className="o-pill o-pill--solid">
                Sign in
              </Link>
              <Link to="/signup" className="o-pill o-pill--outline">
                Create an account
              </Link>
            </div>
          }
        />
      </Frame>
    );
  }

  return (
    <Frame>
      <StateBlock kind="loading" title="One moment…" />
    </Frame>
  );
}
