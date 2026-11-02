import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isFocusArea } from "@/lib/plan";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { saveFocusIntent } from "../../state/focusIntent";
import { Field, Frame, GoogleMark, Message, UnconfiguredCard, type Notice } from "./ui";

/**
 * /login — centred glass card (adapted from the 21st.dev sign-in) on the Home gradient.
 * Hook API: useAuth() → { status, signIn(email, password), signInWithMagicLink(email),
 *   signInWithGoogle(), googleEnabled }. Each call resolves { ok, message }.
 * On success the RedirectIfAuthed guard sends the user to their intended page or /app/home.
 */
export function LoginScreen() {
  usePageTitle("Sign in");
  const { status, signIn, signInWithMagicLink, signInWithGoogle, googleEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "password" | "link" | "google">(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [params] = useSearchParams();
  const focus = params.get("focus");
  const focusQuery = isFocusArea(focus) ? `?focus=${focus}` : "";

  useEffect(() => {
    saveFocusIntent(focus);
  }, [focus]);

  if (status === "unconfigured") {
    return (
      <Frame>
        <UnconfiguredCard />
      </Frame>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("password");
    setNotice(null);
    const result = await signIn(email, password);
    if (!result.ok) setNotice({ tone: "error", text: result.message });
    setBusy(null);
  };

  const onMagicLink = async () => {
    if (!email.trim()) {
      setNotice({ tone: "error", text: "Type your email above first, then we'll send the link there." });
      return;
    }
    setBusy("link");
    setNotice(null);
    const result = await signInWithMagicLink(email);
    setNotice(
      result.ok
        ? { tone: "info", text: result.message ?? `We've sent a sign-in link to ${email}. Open it on this device.` }
        : { tone: "error", text: result.message },
    );
    setBusy(null);
  };

  const onGoogle = async () => {
    setBusy("google");
    setNotice(null);
    const result = await signInWithGoogle();
    if (!result.ok) setNotice({ tone: "error", text: result.message });
    setBusy(null);
  };

  return (
    <Frame>
      <section className="c-auth c-glass" aria-labelledby="login-title">
        <div className="c-auth__top">
          <span className="c-auth__mark" aria-hidden="true">
            <Icon name="user" size={26} />
          </span>
          <h1 id="login-title" className="c-auth__title">
            Welcome back
          </h1>
          <p className="c-small">Sign in to carry on with your plan.</p>
        </div>

        <form className="c-form" onSubmit={onSubmit}>
          <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            revealable
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Message notice={notice} />
          <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy !== null} aria-busy={busy === "password"}>
            {busy === "password" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="c-auth__rule">or</p>

        <div className="c-stack" style={{ gap: 12 }}>
          <button type="button" className="o-pill o-pill--outline" disabled={busy !== null} aria-busy={busy === "link"} onClick={() => void onMagicLink()}>
            {busy === "link" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {googleEnabled ? (
            <button type="button" className="o-pill o-pill--outline" disabled={busy !== null} aria-busy={busy === "google"} onClick={() => void onGoogle()}>
              <GoogleMark />
              Continue with Google
            </button>
          ) : null}
        </div>

        <div className="c-auth__foot">
          <Link to="/reset-password" className="c-link">
            Forgot your password?
          </Link>
          <p>
            New here?{" "}
            <Link to={`/signup${focusQuery}`} className="c-link">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </Frame>
  );
}
