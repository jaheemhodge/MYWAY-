import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";
import { resetApp, useApp } from "../store/AppState";

export function Hold() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const emergency = state.outcome === "emergency";

  return (
    <section className="screen">
      <div className="soft-icon" aria-hidden="true">
        {emergency ? "!" : "🛡"}
      </div>
      <h1 className="display">
        {emergency ? "Please get urgent medical help." : "Let's check in with your doctor first."}
      </h1>
      <p className="lede">
        {emergency
          ? "Based on what you told us, this is not the right place to continue. If you may be having a medical emergency, call 911. This app does not monitor you."
          : "Thank you for answering honestly. Based on what you told us, the safest next step is a conversation with your doctor or physiotherapist before you begin."}
      </p>
      <div className="card">
        <strong>{emergency ? "No exercises assigned" : "Your plan is on hold"}</strong>
        <p className="muted">
          We haven’t assigned any exercises, and no sessions are scheduled. Your answers are saved
          on this device for this demo only.
        </p>
      </div>
      {!emergency ? (
        <div className="card">
          <strong>Questions you could ask</strong>
          <ul>
            <li>Is a gentle home strength and mobility program suitable for me?</li>
            <li>Are there movements I should avoid or adapt?</li>
            <li>How should I start, and what should make me stop?</li>
          </ul>
        </div>
      ) : (
        <div className="card">
          <strong>If you have chest pain, severe shortness of breath, fainting, or sudden weakness</strong>
          <p className="muted">Call 911 or local emergency services. Do not use this app as a substitute for care.</p>
        </div>
      )}
      <div className="grow" />
      <Button
        onClick={async () => {
          await resetApp(dispatch);
          navigate("/onboarding/1");
        }}
      >
        Update my answers
      </Button>
      <Button
        variant="ghost"
        onClick={async () => {
          await resetApp(dispatch);
          navigate("/");
        }}
      >
        Back to the start
      </Button>
    </section>
  );
}
