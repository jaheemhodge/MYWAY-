import { PHASE_COPY } from "../content/calendar";
import { useApp } from "../store/AppState";

export function Progress() {
  const { state, plan } = useApp();
  const completed = state.completedDays.length;
  const guided = state.completedDays.filter((day) => plan.find((item) => item.day === day)?.dayType === "strength_design").length;
  const walks = state.completedDays.filter((day) => plan.find((item) => item.day === day)?.dayType === "activity_design").length;
  const recovery = state.completedDays.filter((day) => {
    const type = plan.find((item) => item.day === day)?.dayType;
    return type === "recovery" || type === "education";
  }).length;
  const start = state.assessments[0];
  const latest = state.assessments[state.assessments.length - 1];
  const walkDelta =
    start?.walkMinutes != null && latest?.walkMinutes != null ? latest.walkMinutes - start.walkMinutes : null;

  return (
    <section className="screen tabbed lavender">
      <p className="muted">Progress</p>
      <h1 className="display">
        Look how far
        <br />
        you've come.
      </h1>
      <div className="stat-card">
        <div className="big-stat">
          <span>{completed}</span>
          <small>
            days completed
            <br />
            of your 60-day journey
          </small>
        </div>
        <div className="stat-row">
          <div>
            <strong>{guided}</strong>
            <span>guided sessions</span>
          </div>
          <div>
            <strong>{walks}</strong>
            <span>gentle walks</span>
          </div>
          <div>
            <strong>{recovery}</strong>
            <span>recovery days</span>
          </div>
        </div>
      </div>
      <h2>Toward {goalWords(state.profile?.primaryGoal)}</h2>
      <p className="muted">From your own weekly reflections. We do not invent improvement.</p>
      {start?.walkMinutes != null && latest?.walkMinutes != null ? (
        <div className="card">
          <strong>Comfortable walking time</strong>
          <Bar label="When you started" value={`${start.walkMinutes} min`} pct={(start.walkMinutes / 40) * 100} />
          <Bar label="Now" value={`${latest.walkMinutes} min`} pct={(latest.walkMinutes / 40) * 100} strong />
          {walkDelta != null ? (
            <p className="muted">
              {walkDelta === 0
                ? "No change recorded yet — that is still useful information."
                : walkDelta > 0
                  ? `About ${walkDelta} minutes longer than when you began.`
                  : `About ${Math.abs(walkDelta)} minutes less than when you began.`}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card">
          <strong>No comparison yet</strong>
          <p className="muted">Complete a review day to record walking time or confidence in your own words.</p>
        </div>
      )}
      {latest?.confidence != null && start?.confidence != null ? (
        <div className="card">
          <strong>Movement confidence</strong>
          <Bar label="When you started" value={`${start.confidence}/10`} pct={start.confidence * 10} />
          <Bar label="Now" value={`${latest.confidence}/10`} pct={latest.confidence * 10} strong />
        </div>
      ) : null}
      <p className="muted">
        Current phase: {plan[state.currentDay - 1] ? PHASE_COPY[plan[state.currentDay - 1].uiPhase].title : "Foundation"}.
        Consistency is {completed} of {state.currentDay} scheduled days so far.
      </p>
    </section>
  );
}

function Bar({ label, value, pct, strong }: { label: string; value: string; pct: number; strong?: boolean }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-ring">
        <span style={{ width: `${Math.min(100, pct)}%`, background: strong ? "var(--forest-mid)" : "var(--sage-dot)" }} />
      </div>
    </div>
  );
}

function goalWords(goal?: string) {
  if (goal === "chair") return "easier chair rises";
  if (goal === "workdays") return "more comfortable workdays";
  if (goal === "morning") return "easier mornings";
  return "longer walks";
}
