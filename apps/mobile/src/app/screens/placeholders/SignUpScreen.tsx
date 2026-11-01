import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { Field, Frame, GoogleMark, Message, UnconfiguredCard, type Notice } from "./ui";

/**
 * /signup — same card as /login.
 * Hook API: useAuth().signUp(firstName, email, password) → { ok, data: { session }, message }.
 * session === null means the project asks for email confirmation: show "Check your email…".
 * With a session, RedirectIfAuthed moves the user on to /onboarding.
 */
export function SignUpScreen() {
  usePageTitle("Create an account");
  const { status, signUp, signInWithGoogle, googleEnabled } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  if (status === "unconfigured") {
    return (
      <Frame>
        <UnconfiguredCard />
      </Frame>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await signUp(firstName, email, password);
    if (!result.ok) setNotice({ tone: "error", text: result.message });
    else if (!result.data.session) setAwaitingEmail(true);
    setBusy(false);
  };

  if (awaitingEmail) {
    return (
      <Frame>
        <section className="c-auth c-glass" aria-labelledby="check-title">
          <div className="c-auth__top">
            <span className="c-auth__mark" aria-hidden="true">
              <Icon name="check" size={26} />
            </span>
            <h1 id="check-title" className="c-auth__title" tabIndex={-1}>
              Check your email to confirm your account.
            </h1>
            <p className="c-small">
              We sent a link to <strong style={{ fontWeight: 400, color: "var(--ink)" }}>{email}</strong>. Open it and you'll come straight back here to
              set up your plan.
            </p>
          </div>
          <p className="c-small" style={{ textAlign: "center" }}>
            Nothing there after a few minutes? Look in your spam or junk folder.
          </p>
          <Link to="/login" className="o-pill o-pill--outline">
            Back to sign in
          </Link>
        </section>
      </Frame>
    );
  }

  return (
    <Frame>
      <section className="c-auth c-glass" aria-labelledby="signup-title">
        <div className="c-auth__top">
          <span className="c-auth__mark" aria-hidden="true">
            <Icon name="user" size={26} />
          </span>
          <h1 id="signup-title" className="c-auth__title">
            Create an account
          </h1>
          <p className="c-small">It takes a minute. Then a few short questions to set up your 60 days.</p>
        </div>

        <form className="c-form" onSubmit={onSubmit}>
          <Field label="First name" name="firstName" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            label="Password"
            hint="At least 8 characters."
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            revealable
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Message notice={notice} />
          <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy} aria-busy={busy}>
            {busy ? "Creating your account…" : "Create account"}
          </button>
        </form>

        {googleEnabled ? (
          <>
            <p className="c-auth__rule">or</p>
            <button
              type="button"
              className="o-pill o-pill--outline"
              disabled={busy}
              onClick={() => void signInWithGoogle().then((r) => !r.ok && setNotice({ tone: "error", text: r.message }))}
            >
              <GoogleMark />
              Continue with Google
            </button>
          </>
        ) : null}

        <div className="c-auth__foot">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="c-link">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </Frame>
  );
}
