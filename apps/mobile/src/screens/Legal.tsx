import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";

export function Legal() {
  const navigate = useNavigate();
  return (
    <section className="screen">
      <h1 className="display">Privacy and legal</h1>
      <div className="card">
        <h2>Wellness disclaimer</h2>
        <p>
          Mobility is a general wellness and movement-education prototype. It does not diagnose,
          treat, cure, or prevent any disease. It is not a substitute for medical or physiotherapy
          care and it is not emergency monitoring.
        </p>
      </div>
      <div className="card">
        <h2>This build</h2>
        <p>
          Demonstration mode stores onboarding answers on this device so you can return to your
          place. Do not enter real sensitive health information here. A production version needs
          secure authentication, encryption, consent management, and legal review before any real
          personal health data is collected.
        </p>
      </div>
      <div className="card">
        <h2>Research sources</h2>
        <p>
          Educational ideas were informed by 15 professional transcripts (T01–T15). The app does
          not embed those videos or copy their scripts. Original films will replace placeholders.
        </p>
      </div>
      <Button onClick={() => navigate(-1)}>Back</Button>
    </section>
  );
}
