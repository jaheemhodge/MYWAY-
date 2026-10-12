import { useNavigate } from "react-router-dom";
import { ChairFigure } from "../components/illustrations";
import { Button, DemoBadge } from "../components/ui/Primitives";
import { PHASE_COPY } from "../content/calendar";
import { weekdayForProgramDay } from "../lib/program";
import { useApp } from "../store/AppState";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const { state, today, plan } = useApp();
  const navigate = useNavigate();
  const name = state.profile?.firstName ?? "there";
  const day = state.currentDay;
  const phase = today ? PHASE_COPY[today.uiPhase] : PHASE_COPY.foundation;
  const next = plan.find((item) => item.day === day + 1);
  const blocked = state.blockedUntilReview && state.outcome !== "provisionally_eligible";

  return (
    <section className="screen tabbed lavender">
      <p className="muted">
        {weekdayForProgramDay(day, day)} · Day {day} of 60
      </p>
      <h1 className="display">
        {greeting()},
        <br />
        {name}.
      </h1>
      {state.profile?.demo ? <DemoBadge>Demo profile</DemoBadge> : null}
      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Today</h2>
      <article className="video-card">
        <span className="pill light">{today ? typeLabel(today.dayType) : "Session"}</span>
        <span className="placeholder-tag">Video placeholder</span>
        <ChairFigure variant="tall" />
        <h2>{today?.title ?? "Today’s session"}</h2>
        <p>
          {today?.durationLabel} · {today?.movements.length || 0} movements · {today?.equipmentLabel}
        </p>
        <Button
          variant="light"
          disabled={Boolean(blocked || today?.locked)}
          onClick={() => navigate(`/session/${day}`)}
        >
          ▶ Start
        </Button>
      </article>
      {blocked ? (
        <p className="muted">Sessions stay locked until a clinician review path is complete.</p>
      ) : null}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Your 60-day journey</strong>
          <span>Day {day}</span>
        </div>
        <div className="progress-ring" style={{ margin: "12px 0" }}>
          <span style={{ width: `${(day / 60) * 100}%` }} />
        </div>
        <p>
          {phase.title}
          {day === 14 ? ", final day" : ""}
        </p>
        <p className="muted">
          {next ? `${PHASE_COPY[next.uiPhase].title} continues next, at the level that suits you.` : "You are on the last day of this journey."}
        </p>
      </div>
    </section>
  );
}

function typeLabel(type: string) {
  if (type === "strength_design") return "Strength day";
  if (type === "activity_design") return "Movement day";
  if (type === "education") return "Education day";
  if (type === "recovery") return "Recovery day";
  return "Check-in";
}
