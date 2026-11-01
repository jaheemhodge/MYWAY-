import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { UnconfiguredNotice } from "../../guards";

/**
 * PLACEHOLDER (unstyled) — /signup
 * Hook API: useAuth() → { status, signUp(firstName, email, password), signInWithGoogle(), googleEnabled }.
 * signUp resolves { ok, data: { session, user }, message }. When email confirmation is on, `session`
 * is null and the user must open the link we emailed; otherwise RedirectIfAuthed moves them on.
 */
export function SignUpScreen() {
  usePageTitle("Create an account");
  const { status, signUp, signInWithGoogle, googleEnabled } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  if (status === "unconfigured") return <UnconfiguredNotice />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await signUp(firstName, email, password);
    if (!result.ok) setMessage(result.message);
    else if (!result.data.session) setAwaitingEmail(true);
    setBusy(false);
  };

  if (awaitingEmail) {
    return (
      <main>
        <h1>Check your email</h1>
        <p>We sent a confirmation link to {email}. Open it to finish creating your account.</p>
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Create an account</h1>
      <form onSubmit={onSubmit}>
        <label>
          First name
          <input type="text" name="firstName" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password (at least 8 characters)
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          Create account
        </button>
      </form>
      {googleEnabled ? (
        <button type="button" disabled={busy} onClick={() => void signInWithGoogle().then((r) => !r.ok && setMessage(r.message))}>
          Continue with Google
        </button>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  );
}
