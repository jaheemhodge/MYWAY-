import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { UnconfiguredNotice } from "../../guards";

/**
 * PLACEHOLDER (unstyled) — /login
 * Hook API: useAuth() → { status, signIn(email, password), signInWithMagicLink(email),
 *   signInWithGoogle(), googleEnabled }. Each call resolves { ok, message }.
 * On success the RedirectIfAuthed guard sends the user to their intended page or /app/home.
 */
export function LoginScreen() {
  usePageTitle("Sign in");
  const { status, signIn, signInWithMagicLink, signInWithGoogle, googleEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "unconfigured") return <UnconfiguredNotice />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await signIn(email, password);
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  };

  const onMagicLink = async () => {
    setBusy(true);
    setMessage(null);
    const result = await signInWithMagicLink(email);
    setMessage(result.message ?? null);
    setBusy(false);
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await signInWithGoogle();
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  };

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          Sign in
        </button>
      </form>
      <button type="button" disabled={busy || !email} onClick={onMagicLink}>
        Email me a sign-in link
      </button>
      {googleEnabled ? (
        <button type="button" disabled={busy} onClick={onGoogle}>
          Continue with Google
        </button>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
      <p>
        <Link to="/reset-password">Forgot your password?</Link>
      </p>
      <p>
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </main>
  );
}
