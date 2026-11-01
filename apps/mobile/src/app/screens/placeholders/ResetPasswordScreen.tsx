import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { UnconfiguredNotice } from "../../guards";

/**
 * PLACEHOLDER (unstyled) — /reset-password
 * Two states from useAuth():
 *   • no session → ask for the email and call resetPassword(email)
 *   • isPasswordRecovery (arrived from the email link) or signed in → call updatePassword(newPassword)
 */
export function ResetPasswordScreen() {
  usePageTitle("Reset password");
  const { status, isPasswordRecovery, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "unconfigured") return <UnconfiguredNotice />;
  if (status === "loading") return <p role="status">Loading…</p>;

  const canSetPassword = isPasswordRecovery || status === "signedIn";

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await resetPassword(email);
    setMessage(result.message ?? null);
    setBusy(false);
  };

  const onUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await updatePassword(password);
    setMessage(result.message ?? null);
    setBusy(false);
    if (result.ok) navigate("/app/home", { replace: true });
  };

  return (
    <main>
      <h1>{canSetPassword ? "Choose a new password" : "Reset your password"}</h1>
      {canSetPassword ? (
        <form onSubmit={onUpdate}>
          <label>
            New password (at least 8 characters)
            <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>
            Save new password
          </button>
        </form>
      ) : (
        <form onSubmit={onRequest}>
          <label>
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>
            Email me a reset link
          </button>
        </form>
      )}
      {message ? <p role="alert">{message}</p> : null}
      <p>
        <Link to="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
