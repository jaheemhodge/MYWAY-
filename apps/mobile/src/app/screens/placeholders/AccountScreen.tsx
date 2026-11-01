import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FOCUS_AREA_LABEL } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { useProfile } from "../../state/ProfileProvider";

/**
 * PLACEHOLDER (unstyled) — /app/account
 * Hook API: useAuth() → { user, signOut() }, useProfile() → { profile: { firstName, ageRange, focusArea, planStartDate } }.
 */
export function AccountScreen() {
  usePageTitle("Account");
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

  const onSignOut = async () => {
    const result = await signOut();
    if (!result.ok) setMessage(result.message);
    else navigate("/login", { replace: true });
  };

  return (
    <main>
      <h1>Account</h1>
      <dl>
        <dt>Name</dt>
        <dd>{profile?.firstName ?? "—"}</dd>
        <dt>Email</dt>
        <dd>{user?.email ?? "—"}</dd>
        <dt>Focus area</dt>
        <dd>{profile?.focusArea ? FOCUS_AREA_LABEL[profile.focusArea] : "—"}</dd>
        <dt>Plan started</dt>
        <dd>{profile?.planStartDate ?? "—"}</dd>
      </dl>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </main>
  );
}
