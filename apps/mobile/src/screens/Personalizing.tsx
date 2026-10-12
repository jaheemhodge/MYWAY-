import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";
import { useApp } from "../store/AppState";

const STEPS = [
  "Understanding your goals.",
  "Finding your starting level.",
  "Preparing your 60-day roadmap.",
];

export function Personalizing() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [done, setDone] = useState([false, false, false]);
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) {
      setDone([true, true, true]);
      return;
    }
    const timers = [400, 1100, 1800].map((ms, index) =>
      window.setTimeout(() => {
        setDone((current) => current.map((item, i) => (i === index ? true : item)));
      }, ms),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduce]);

  const ready = done.every(Boolean);
  const next = state.outcome === "provisionally_eligible" ? "/reveal" : "/hold";

  return (
    <section className="screen lavender">
      <div className="arc" aria-hidden="true">
        <svg viewBox="0 0 220 90">
          <path d="M18 72 C 50 8, 170 8, 202 72" fill="none" stroke="#2c4636" strokeWidth="3" />
          <circle cx="18" cy="72" r="7" fill={done[0] ? "#2c4636" : "#fff"} stroke="#2c4636" />
          <circle cx="110" cy="16" r="7" fill={done[1] ? "#2c4636" : "#fff"} stroke="#2c4636" />
          <circle cx="202" cy="72" r="7" fill={done[2] ? "#2c4636" : "#fff"} stroke="#2c4636" />
        </svg>
      </div>
      <h1 className="display">Building your movement journey.</h1>
      <div className="stack">
        {STEPS.map((label, index) => (
          <div key={label} className={`card row ${done[index] ? "is-ready" : ""}`}>
            <span className="mini-check" aria-hidden="true">
              {done[index] ? "✓" : ""}
            </span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      <p className="muted">
        Your plan is chosen from a reviewed exercise library using your answers. It isn't a medical
        assessment.
      </p>
      <div className="grow" />
      <Button disabled={!ready} onClick={() => navigate(next)}>
        See my plan
      </Button>
    </section>
  );
}
