import { useNavigate, useParams } from "react-router-dom";
import { ChairFigure } from "../components/illustrations";
import { Button, DemoBadge } from "../components/ui/Primitives";
import { useApp } from "../store/AppState";

export function SessionIntro() {
  const { day = "1" } = useParams();
  const dayNum = Number(day);
  const { plan, state } = useApp();
  const session = plan.find((item) => item.day === dayNum);
  const navigate = useNavigate();

  if (!session) return null;

  const locked = session.locked || (state.blockedUntilReview && dayNum > state.currentDay);

  return (
    <section className="screen">
      <div className="hero-media" style={{ minHeight: 220, paddingTop: 56 }}>
        <button className="icon-btn light" onClick={() => navigate(-1)} aria-label="Close">
          ×
        </button>
        <span className="placeholder-tag">Video placeholder</span>
        <ChairFigure />
      </div>
      <p className="muted" style={{ marginTop: 18 }}>
        Day {session.day} · {label(session.dayType)}
      </p>
      <h1 className="display">{session.title}</h1>
      <p className="lede">
        {session.summary}
        {state.profile?.firstName ? ` This one is for you, ${state.profile.firstName}.` : ""}
      </p>
      <DemoBadge>Demonstration · not a prescribed workout</DemoBadge>
      <div className="stat-pills">
        <div>
          <strong>{session.durationLabel}</strong>
          <span>Time</span>
        </div>
        <div>
          <strong>{session.movements.length || 1}</strong>
          <span>{session.movements.length ? "movements" : "focus"}</span>
        </div>
        <div>
          <strong>{session.equipmentLabel}</strong>
          <span>Setup</span>
        </div>
      </div>
      {session.movements.length > 0 ? (
        <div className="card">
          <strong>What this session trains</strong>
          <ul>
            <li>Leg strength for standing up from chairs</li>
            <li>Hip and ankle steadiness for walking</li>
            <li>Upright posture for standing</li>
          </ul>
        </div>
      ) : (
        <div className="card">
          <strong>Today’s focus</strong>
          <p>{session.summary}</p>
        </div>
      )}
      <div className="grow" />
      <Button disabled={locked} onClick={() => navigate(`/player/${session.day}`)}>
        ▶ Begin session
      </Button>
      {session.movements.length > 0 ? (
        <Button variant="ghost" onClick={() => navigate(`/guide/${session.movements[0].id}?day=${session.day}`)}>
          Preview movements
        </Button>
      ) : null}
    </section>
  );
}

function label(type: string) {
  if (type === "strength_design" || type === "review") return "Strength";
  if (type === "activity_design") return "Activity";
  if (type === "education") return "Education";
  if (type === "recovery") return "Recovery";
  return "Review";
}
