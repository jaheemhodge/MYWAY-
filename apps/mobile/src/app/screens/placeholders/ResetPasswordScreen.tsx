import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { Field, Frame, Message, StateBlock, UnconfiguredCard, type Notice } from "./ui";

/**
 * /reset-password — same card as /login, two states from useAuth():
 *   • no session → ask for the email and call resetPassword(email), then "Check your email"
 *   • isPasswordRecovery (arrived from the email link) or signed in → updatePassword(newPassword)
 */
export function ResetPasswordScreen() {
  usePageTitle("Reset password");
  const { status, isPasswordRecovery, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (status === "unconfigured") {
    return (
      <Frame>
        <UnconfiguredCard />
      </Frame>
    );
  }
  if (status === "loading") {
    return (
      <Frame>
        <StateBlock kind="loading" title="One moment…" />
      </Frame>
    );
  }

  const canSetPassword = isPasswordRecovery || status === "signedIn";

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await resetPassword(email);
    if (result.ok) setSentTo(email.trim());
    else setNotice({ tone: "error", text: result.message });
    setBusy(false);
  };

  const onUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.ok) navigate("/app/home", { replace: true });
    else setNotice({ tone: "error", text: result.message });
  };

  if (sentTo && !canSetPassword) {
    return (
      <Frame>
        <section className="c-auth c-glass" aria-labelledby="sent-title">
          <div className="c-auth__top">
            <span className="c-auth__mark" aria-hidden="true">
              <Icon name="check" size={26} />
            </span>
            <h1 id="sent-title" className="c-auth__title">
              Check your email
            </h1>
            <p className="c-small">
              If there's an account for {sentTo}, a link to choose a new password is on its way. It can take a few minutes, and sometimes lands in spam.
            </p>
          </div>
          <Link to="/login" className="o-pill o-pill--outline">
            Back to sign in
          </Link>
          <button type="button" className="o-pill o-pill--ghost" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
        </section>
      </Frame>
    );
  }

  return (
    <Frame>
      <section className="c-auth c-glass" aria-labelledby="reset-title">
        <div className="c-auth__top">
          <span className="c-auth__mark" aria-hidden="true">
            <Icon name="lock" size={26} />
          </span>
          <h1 id="reset-title" className="c-auth__title">
            {canSetPassword ? "Choose a new password" : "Reset your password"}
          </h1>
          <p className="c-small">
            {canSetPassword ? "Pick something you'll remember. You'll stay signed in afterwards." : "Tell us your email and we'll send you a link to choose a new one."}
          </p>
        </div>

        {canSetPassword ? (
          <form className="c-form" onSubmit={onUpdate}>
            <Field
              label="New password"
              hint="At least 8 characters."
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              revealable
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Message notice={notice} />
            <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy} aria-busy={busy}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : (
          <form className="c-form" onSubmit={onRequest}>
            <Field label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Message notice={notice} />
            <button type="submit" className="o-pill o-pill--solid o-pill--big" disabled={busy} aria-busy={busy}>
              {busy ? "Sending…" : "Email me a reset link"}
            </button>
          </form>
        )}

        <div className="c-auth__foot">
          <Link to={canSetPassword ? "/app/home" : "/login"} className="c-link">
            {canSetPassword ? "Back home" : "Back to sign in"}
          </Link>
        </div>
      </section>
    </Frame>
  );
}
