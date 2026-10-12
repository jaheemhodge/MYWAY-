import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";
import { useApp } from "../store/AppState";

export function Details() {
  const { state } = useApp();
  const navigate = useNavigate();
  return (
    <section className="screen">
      <h1 className="display">Personal information</h1>
      <div className="card">
        <p>
          <strong>Name</strong>
          <br />
          {state.profile?.firstName}
        </p>
        <p>
          <strong>Age</strong>
          <br />
          {state.profile?.age}
        </p>
        <p>
          <strong>Note</strong>
          <br />
          {state.profile?.motivationNote || "—"}
        </p>
      </div>
      <Button onClick={() => navigate(-1)}>Back</Button>
    </section>
  );
}
