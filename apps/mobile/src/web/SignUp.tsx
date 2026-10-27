import { Link } from "react-router-dom";
import { routes } from "./routes";
import { loadMovementCheckIn } from "./storage";
import { usePageTitle } from "./WebLayout";

export function SignUp() {
  usePageTitle("Sign up · Mobility");
  const record = loadMovementCheckIn("baseline");
  const ready = Boolean(record?.completedAt);

  return (
    <section className="web-flow">
      <div className="web-wrap web-flow-narrow">
        <p className="web-kicker">Placeholder · sign up</p>
        <h1>Create an account.</h1>
        <p className="web-intro">
          Account creation and payment are not open yet. This is the page where the price will appear, after
          the free check-in, and not on the front door.
        </p>
        <aside className="web-price-placeholder">
          <p className="web-source-label">Pricing placeholder</p>
          <p className="web-price-amount">Amount not set</p>
          <p>This is not a live offer, not a discount, and not a bill. No payment is collected on this page.</p>
        </aside>
        <p>{ready ? "What you told us is saved on this device." : "We don’t have a finished check-in on this device yet."}</p>
        <div className="web-actions">
          <Link className="web-btn web-btn-primary" to={routes.day1}>
            Look at the Day 1 session
          </Link>
          <Link className="web-btn web-btn-secondary" to={routes.plan}>
            Back to the plan preview
          </Link>
        </div>
        <p className="web-fine">
          Day 1 opens in the existing session screen. It is an internal preview. Starting the session still
          follows that screen’s safety lock, so Begin may stay unavailable until the in-app review allows it.
        </p>
      </div>
    </section>
  );
}
