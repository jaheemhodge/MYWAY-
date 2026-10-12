import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";
import { LogoMark } from "../components/illustrations";

export function Welcome() {
  const navigate = useNavigate();
  return (
    <section className="screen dark welcome">
      <LogoMark light />
      <div className="grow welcome-media" aria-hidden="true">
        <div className="photo-placeholder">
          <strong>Photo or video placeholder</strong>
          <p>A woman in her sixties walking a coastal path with a friend, early morning light.</p>
        </div>
      </div>
      <h1 className="display">
        Feel like
        <br />
        yourself again.
      </h1>
      <p className="lede">
        A personalized 60-day journey to build strength, improve mobility, and move with more
        confidence.
      </p>
      <Button variant="light" onClick={() => navigate("/onboarding/1")}>
        Get started
      </Button>
      <Button variant="ghost" onClick={() => navigate("/sign-in")}>
        I already have an account
      </Button>
    </section>
  );
}
