import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChairFigure } from "../components/illustrations";
import { Button } from "../components/ui/Primitives";
import { day1ExerciseForMovement } from "../content/day01";
import { MOVEMENTS } from "../content/movements";
import { Day1Guide } from "./Day1";

export function Guide() {
  const { exerciseId = "assisted_sit_stand" } = useParams();
  const [params] = useSearchParams();
  const day = params.get("day");
  const movement = MOVEMENTS[exerciseId];
  const navigate = useNavigate();

  if (day === "1" && day1ExerciseForMovement(exerciseId)) return <Day1Guide movementId={exerciseId} />;
  if (!movement) return <section className="screen">Unknown movement.</section>;

  return (
    <section className="screen">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="muted">Exercise guide</p>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Close">
          ×
        </button>
      </div>
      <h1 className="display">{movement.name}</h1>
      <p className="lede">{movement.summary}</p>
      <div className="guide-frames">
        <figure>
          <ChairFigure variant="sit" />
          <figcaption>1. Sit tall</figcaption>
        </figure>
        <figure>
          <ChairFigure variant="lean" />
          <figcaption>2. Lean and press</figcaption>
        </figure>
        <figure>
          <ChairFigure variant="stand" />
          <figcaption>3. Stand tall</figcaption>
        </figure>
      </div>
      <p className="muted">Placeholder frames. Stills from the filmed demonstration go here.</p>
      <div className="card">
        <strong>Set up</strong>
        <ul>
          {movement.setup.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <strong>Technique</strong>
        <ul>
          {movement.instructions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <strong>Safety</strong>
        <ul>
          {movement.safetyNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>{movement.stopRule}</li>
          <li>Sources: {movement.sourceIds.join(", ")} — research provenance only.</li>
        </ul>
      </div>
      <Button onClick={() => (day ? navigate(`/player/${day}`) : navigate(-1))}>Back to session</Button>
    </section>
  );
}
