import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FOCUS_AREA_LABEL } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useAuth } from "../../state/AuthProvider";
import { useProfile } from "../../state/ProfileProvider";
import { formatDate } from "./ProgressScreen";
import { Message, PageHead, PageState, type Notice } from "./ui";

/**
 * /app/account — name, email, focus area, plan start, Sign out.
 * Hook API: useAuth() → { user, signOut() }, useProfile() → { profile: { firstName, ageRange, focusArea, planStartDate } }.
 */
export function AccountScreen() {
  usePageTitle("Account");
  const { user, signOut } = useAuth();
  const { profile, status, error, refresh } = useProfile();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  if (status === "error") {
    return (
      <PageState
        kind="error"
        title="We couldn't load your details"
        action={
          <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
            Try again
          </button>
        }
      >
        {error ?? "Please check your connection and try again."}
      </PageState>
    );
  }
  if (status === "loading" || status === "idle") return <PageState kind="loading" title="Loading your details…" />;

  const onSignOut = async () => {
    setBusy(true);
    setNotice(null);
    const result = await signOut();
    if (!result.ok) {
      setNotice({ tone: "error", text: result.message });
      setBusy(false);
    } else navigate("/login", { replace: true });
  };

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: profile?.firstName ?? "Not added" },
    { label: "Email", value: user?.email ?? "Not available" },
    { label: "Focus area", value: profile?.focusArea ? FOCUS_AREA_LABEL[profile.focusArea] : "Not chosen yet" },
    { label: "Age range", value: profile?.ageRange ?? "Not added" },
    { label: "Plan started", value: formatDate(profile?.planStartDate) ?? "Not started" },
  ];

  return (
    <div className="o-wrap c-page">
      <div className="c-narrow">
        <PageHead title="Account" line={profile?.firstName ? `Signed in as ${profile.firstName}.` : "Your details."} />

        <dl className="c-details c-glass">
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="c-stack" style={{ marginTop: 40 }}>
          <Message notice={notice} />
          <div className="c-actions">
            <Link to="/reset-password" className="o-pill o-pill--outline o-pill--big">
              Change password
            </Link>
            <button type="button" className="o-pill o-pill--solid o-pill--big" onClick={() => void onSignOut()} disabled={busy} aria-busy={busy}>
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
          <p className="c-small">Signing out keeps your plan and progress saved. Sign back in on any device to carry on.</p>
        </div>
      </div>
    </div>
  );
}
