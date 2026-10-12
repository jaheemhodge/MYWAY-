import { useNavigate } from "react-router-dom";
import { ChairFigure } from "../components/illustrations";
import { Button, DemoBadge } from "../components/ui/Primitives";
import { PHASE_COPY } from "../content/calendar";
import { weekdayForProgramDay } from "../lib/program";
import { Day1HomeCard } from "./Day1";
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
    <section className="screen tabbed lavender home-screen">
      <header className="home-header">
        <p className="muted">
          {weekdayForProgramDay(day, day)} · Day {day} of 60
        </p>
        <h1 className="display">
          {greeting()},
          <br />
          {name}.
        </h1>
        {state.profile?.demo ? <DemoBadge>Demo profile</DemoBadge> : null}
      </header>
      <p className="section-label">Today</p>
      {day === 1 && today ? (
        <Day1HomeCard
          blocked={Boolean(blocked || today.locked)}
          completed={state.completedDays.includes(1)}
          onStart={() => navigate("/session/1")}
        />
      ) : (
        <article className="video-card home-session">
          <span className="pill light">{today ? typeLabel(today.dayType) : "Session"}</span>
          <span className="placeholder-tag">Video placeholder</span>
          <ChairFigure variant="sit" />
          <div className="home-session-copy">
            <h2>{today?.title ?? "Today’s session"}</h2>
            <p>
              {today?.durationLabel} · {today?.movements.length || 0} movements · {today?.equipmentLabel}
            </p>
          </div>
          <Button
            variant="light"
            disabled={Boolean(blocked || today?.locked)}
            onClick={() => navigate(`/session/${day}`)}
          >
            ▶ Start
          </Button>
        </article>
      )}
      {blocked ? (
        <p className="muted">Sessions stay locked until a clinician review path is complete.</p>
      ) : null}
      <div className="journey-card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Your 60-day journey</strong>
          <span>Day {day}</span>
        </div>
        <div className="progress-ring">
          <span style={{ width: `${(day / 60) * 100}%` }} />
        </div>
        <p>
          {phase.title}
          {day === 14 ? ", final day" : ""}
        </p>
        <p className="muted">
          {next
            ? `${PHASE_COPY[next.uiPhase].title} continues next, at the level that suits you.`
            : "You are on the last day of this journey."}
        </p>
        {state.completedDays.includes(1) ? (
          <p className="muted">Day 1 internal preview is recorded. Its videos are still not uploaded.</p>
        ) : null}
      </div>
    </section>
  );
}

function typeLabel(type: string) {
  if (type === "strength_design") return "Strength day";
  if (type === "review") return "Strength day";
  if (type === "activity_design") return "Movement day";
  if (type === "education") return "Education day";
  if (type === "recovery") return "Recovery day";
  return "Check-in";
}
