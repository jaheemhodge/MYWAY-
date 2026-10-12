import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Primitives";
import { useApp } from "../store/AppState";

export function Milestone() {
  const { phase = "foundation" } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const name = state.profile?.firstName ?? "";

  return (
    <section className="screen dark milestone">
      <div className="arc-number" aria-hidden="true">
        <svg viewBox="0 0 240 120">
          <path d="M20 100 A100 100 0 0 1 220 100" fill="none" stroke="rgba(255,255,255,.25)" strokeDasharray="4 6" />
        </svg>
        <strong>14</strong>
        <small>of 60 days</small>
      </div>
      <span className="pill light">Foundation phase complete</span>
      <h1 className="display">
        14 days of showing
        <br />
        up for yourself.
      </h1>
      <p className="lede">
        Nine short sessions, three gentle walks, and rest when it was planned. That steadiness is
        what this is built on{name ? `, ${name}` : ""}.
      </p>
      <div className="card dark-card">
        <span className="num">2</span>
        <div>
          <small>Next on your roadmap</small>
          <strong>Build Strength, Days 15 to 30</strong>
        </div>
      </div>
      <Button variant="light" onClick={() => navigate("/app/home")}>
        Continue my journey
      </Button>
      <Button variant="ghost" onClick={() => navigate("/app/progress")}>
        See my progress
      </Button>
      <p className="muted">{phase === "foundation" ? "Milestone recorded from your completed days — not a promised result." : ""}</p>
    </section>
  );
}
