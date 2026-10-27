import { Link, useLocation, useNavigate } from "react-router-dom";
import { PHASES } from "./copy";
import { normalizeMovementCheckIn, whatYouToldUs, type MovementCheckInRecord } from "./model";
import { checkInPath, routes } from "./routes";
import { clearMovementCheckIn, loadMovementCheckIn } from "./storage";
import { usePageTitle } from "./WebLayout";

function recordFromLocation(state: unknown): MovementCheckInRecord | null {
  if (!state || typeof state !== "object" || !("checkIn" in state)) return null;
  return normalizeMovementCheckIn((state as { checkIn?: unknown }).checkIn);
}

export function PlanPreview() {
  usePageTitle("60-day plan preview · Mobility");
  const location = useLocation();
  const navigate = useNavigate();
  const stored = loadMovementCheckIn("baseline");
  const record = stored ?? recordFromLocation(location.state);
  const told = record ? whatYouToldUs(record) : [];

  return (
    <section className="web-flow">
      <div className="web-wrap">
        <p className="web-kicker">Placeholder · plan preview</p>
        <h1>Your 60-day plan preview.</h1>
        <p className="web-intro">
          This page shows the shape of the weeks and repeats what you told us. It is not a diagnosis, a score,
          or a prescription. A full plan and a price come later. Nothing here is charged.
        </p>

        <div className="web-plan-layout">
          <section className="web-told" aria-labelledby="told-heading">
            <h2 id="told-heading">What you told us</h2>
            {told.length === 0 ? (
              <>
                <p>We don’t have a check-in on this device yet.</p>
                <Link className="web-btn web-btn-primary" to={routes.safety}>
                  Take the free movement check-in
                </Link>
              </>
            ) : (
              <>
                {record && !record.completedAt ? (
                  <p>This check-in is not confirmed yet. You can go back and finish it.</p>
                ) : (
                  <p>These are your words, played back. We did not turn them into a score or a percentile.</p>
                )}
                <dl>
                  {told.map((item) => (
                    <div key={item.id}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.lines.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="web-actions">
                  <Link className="web-btn web-btn-secondary" to={checkInPath("intro")}>
                    Change my answers
                  </Link>
                  <button
                    type="button"
                    className="web-btn web-btn-secondary"
                    onClick={() => {
                      clearMovementCheckIn("baseline");
                      navigate(checkInPath("intro"), { replace: true });
                    }}
                  >
                    Start the check-in over
                  </button>
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="weeks-heading">
            <h2 id="weeks-heading">The weeks</h2>
            <p className="web-intro">Everyone sees these three phases in this preview. Your answers do not build a custom prescription.</p>
            <ol className="web-phases">
              {PHASES.map((phase) => (
                <li key={phase.id}>
                  <p className="web-phase-range">{phase.range}</p>
                  <h3>{phase.title}</h3>
                  <p>{phase.body}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="web-next-step">
          <h2>Next is sign-up, which is not open yet.</h2>
          <p>The price belongs on the next page, after this check-in. In this preview the amount is not set.</p>
          <Link className="web-btn web-btn-light" to={routes.signUp}>
            Continue to sign up
          </Link>
        </div>
      </div>
    </section>
  );
}
