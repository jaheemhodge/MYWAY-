import { useNavigate } from "react-router-dom";
import { PHASE_COPY } from "../content/calendar";
import { Button, DemoBadge } from "../components/ui/Primitives";
import { LogoMark } from "../components/illustrations";
import { PATHWAY_META } from "../lib/program";
import { useApp } from "../store/AppState";

export function Reveal() {
  const { state } = useApp();
  const navigate = useNavigate();
  const name = state.profile?.firstName ?? "there";
  const pathway = PATHWAY_META[state.pathwayId];

  return (
    <section className="screen lavender">
      <LogoMark />
      <p className="muted" style={{ marginTop: 18 }}>
        {name}, your plan is ready
      </p>
      <h1 className="display">
        Your next 60
        <br />
        days start here.
      </h1>
      <p className="lede">A steady path toward {pathway.goal.toLowerCase()}, built from what you told us.</p>
      <DemoBadge>Preview plan · demonstration sessions only</DemoBadge>
      <div className="roadmap">
        <div className="roadmap-head">
          <span>Your roadmap</span>
          <span>4 phases · 60 days</span>
        </div>
        {(Object.keys(PHASE_COPY) as Array<keyof typeof PHASE_COPY>).map((key, index) => (
          <div key={key} className="roadmap-item">
            <span className="num">{index + 1}</span>
            <div>
              <strong>
                {PHASE_COPY[key].title}{" "}
                {index === 0 ? <em className="pill">You start here</em> : null}
              </strong>
              <p>{PHASE_COPY[key].days}</p>
              <p className="muted">{PHASE_COPY[key].body}</p>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={() => navigate("/preview/home")}>
        View my plan →
      </Button>
    </section>
  );
}
