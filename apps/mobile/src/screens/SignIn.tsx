import { useNavigate } from "react-router-dom";
import { PERSONAS } from "../content/personas";
import { Button, Notice } from "../components/ui/Primitives";
import { LogoMark } from "../components/illustrations";
import { useApp } from "../store/AppState";

export function SignIn() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  return (
    <section className="screen">
      <LogoMark />
      <h1 className="display" style={{ marginTop: 28 }}>
        Welcome back.
      </h1>
      <p className="lede">
        This prototype uses a local development profile. Production sign-in and secure health
        storage are not enabled.
      </p>
      {state.profile && state.onboarded ? (
        <Button
          onClick={() =>
            navigate(state.outcome === "provisionally_eligible" ? "/app/home" : "/hold")
          }
        >
          Continue as {state.profile.firstName}
        </Button>
      ) : null}
      <div className="stack" style={{ marginTop: 18 }}>
        <h2 className="serif" style={{ fontSize: "1.4rem", margin: 0 }}>
          Explore a demonstration
        </h2>
        {PERSONAS.map((persona) => (
          <button
            key={persona.id}
            className="card"
            style={{ textAlign: "left", border: 0, width: "100%" }}
            onClick={() => {
              dispatch({ type: "LOAD_PERSONA", persona });
              navigate("/app/home");
            }}
          >
            <strong>
              {persona.firstName}, {persona.age}
            </strong>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Day {persona.currentDay} · {persona.note}
            </p>
          </button>
        ))}
      </div>
      <Notice>Demonstration profiles are fictional and clearly labeled. They are not patient records.</Notice>
      <Button variant="ghost" onClick={() => navigate("/welcome")}>
        Back
      </Button>
    </section>
  );
}
