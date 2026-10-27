import { Link } from "react-router-dom";
import { routes } from "./routes";
import { usePageTitle } from "./WebLayout";

export function SafetyPause() {
  usePageTitle("Check with your doctor first · Mobility");

  return (
    <section className="web-flow">
      <div className="web-wrap web-flow-narrow">
        <p className="web-kicker">Please pause here</p>
        <h1>Please check with your doctor first.</h1>
        <p className="web-intro">
          Thank you for answering honestly. From what you told us, this program is not the right next step until
          a doctor or physiotherapist who knows you says gentle movement is appropriate for you.
        </p>
        <aside className="web-callout">
          <strong>If something is happening now, do not wait on this page.</strong>
          <p>
            Chest pain, trouble breathing, faintness, sudden weakness, or new trouble with bladder or bowel
            control needs urgent care or local emergency services. Mobility cannot see those symptoms and does
            not monitor emergencies.
          </p>
        </aside>
        <div className="web-prose-stack">
          <p>A questionnaire cannot tell whether exercise is safe for you. This page is not a diagnosis, and it is not a medical clearance.</p>
          <p>You can change an answer if you tapped the wrong one. Otherwise, stop here.</p>
        </div>
        <div className="web-actions">
          <Link className="web-btn web-btn-primary" to={routes.safety}>
            Review my answers
          </Link>
          <Link className="web-btn web-btn-secondary" to={routes.landing}>
            Back to the start
          </Link>
        </div>
      </div>
    </section>
  );
}
