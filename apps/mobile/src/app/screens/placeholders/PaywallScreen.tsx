import { useState } from "react";
import { Link } from "react-router-dom";
import { isCheckoutEnabled, startCheckout } from "@/lib/billing";
import { usePageTitle } from "../../hooks";
import { Message, type Notice } from "./ui";

/**
 * Days past the free beta.
 * The real gate is complete_day() in the database (PAYWALL). This screen only explains it.
 * Files under public/ (coach stills, and the Day 1 clips) are not access-controlled.
 */
export function PaywallScreen({ day }: { day: number }) {
  usePageTitle("Full access");
  const checkout = isCheckoutEnabled();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const backDay = Math.max(1, day - 1);

  const onCheckout = async () => {
    setBusy(true);
    setNotice(null);
    const result = await startCheckout();
    if (!result.ok) {
      setNotice({ tone: "error", text: result.message });
      setBusy(false);
    }
  };

  return (
    <div className="o-wrap c-page">
      <div className="c-narrow c-stack">
        <h1 className="c-head__title">Days 4 to 60 are for full access.</h1>
        {checkout ? (
          <>
            <p className="c-line">Full access is $9.99 a month. Cancel any time.</p>
            <Message notice={notice} />
            <div className="c-actions">
              <button type="button" className="o-pill o-pill--solid o-pill--big" onClick={() => void onCheckout()} disabled={busy} aria-busy={busy}>
                {busy ? "Redirecting to checkout…" : "Get full access"}
              </button>
              <Link to={backDay <= 3 ? `/app/session/${backDay}` : "/app/home"} className="o-pill o-pill--outline o-pill--big">
                {backDay <= 3 ? `Back to Day ${backDay}` : "Back home"}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="c-line">Days 4 to 60 open soon. You've got the first 3 days to enjoy now.</p>
            <div className="c-actions">
              <Link to="/app/home" className="o-pill o-pill--solid o-pill--big">
                Back home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
