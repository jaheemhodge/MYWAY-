import { Link, useNavigate } from "react-router-dom";
import { PATHWAY_META } from "../lib/program";
import { resetApp, useApp } from "../store/AppState";

export function Profile() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const profile = state.profile;
  const initial = (profile?.firstName ?? "M").slice(0, 1).toUpperCase();

  return (
    <section className="screen tabbed lavender">
      <div className="row" style={{ gap: 14, marginBottom: 20 }}>
        <div className="avatar">{initial}</div>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: "2rem" }}>
            {profile?.firstName ?? "Guest"}
          </h1>
          <p className="muted">
            Day {state.currentDay} of 60 · {PATHWAY_META[state.pathwayId].label}
          </p>
        </div>
      </div>
      <p className="muted">About you</p>
      <div className="card">
        <Link className="profile-row" to="/profile/details">
          <span>
            <strong>Personal information</strong>
            <br />
            <small>
              {profile?.firstName}, {profile?.age}
            </small>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
        <div className="profile-row">
          <span>
            <strong>My movement goals</strong>
            <br />
            <small>{PATHWAY_META[state.pathwayId].goal}</small>
          </span>
        </div>
        <button className="profile-row" onClick={() => navigate("/onboarding/5")}>
          <span>
            <strong>Health and safety information</strong>
            <br />
            <small>Review or update your safety answers</small>
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <div className="profile-row">
          <span>
            <strong>Exercise preferences</strong>
            <br />
            <small>10-minute sessions, chair-supported</small>
          </span>
        </div>
      </div>
      <p className="muted">Reminders and audio</p>
      <div className="card">
        <ToggleRow
          title="Session reminders"
          body={`Every day at ${state.settings.reminderTime}`}
          on={state.settings.reminders}
          onClick={() => dispatch({ type: "SETTINGS", value: { reminders: !state.settings.reminders } })}
        />
        <ToggleRow
          title="Audio guidance"
          body="Spoken instructions in sessions"
          on={state.settings.audio}
          onClick={() => dispatch({ type: "SETTINGS", value: { audio: !state.settings.audio } })}
        />
        <ToggleRow
          title="Captions"
          body="Show instructions as text on video"
          on={state.settings.captions}
          onClick={() => dispatch({ type: "SETTINGS", value: { captions: !state.settings.captions } })}
        />
      </div>
      <p className="muted">Accessibility</p>
      <div className="card">
        <ToggleRow
          title="Larger text"
          body="Increase reading size across the app"
          on={state.settings.largeText}
          onClick={() => dispatch({ type: "SETTINGS", value: { largeText: !state.settings.largeText } })}
        />
      </div>
      <div className="card">
        <Link className="profile-row" to="/legal">
          Privacy, support and legal
          <span aria-hidden="true">›</span>
        </Link>
        <button
          className="profile-row"
          onClick={async () => {
            await resetApp(dispatch);
            navigate("/welcome");
          }}
        >
          Sign out of this demo profile
          <span aria-hidden="true">›</span>
        </button>
      </div>
      {profile?.personaNote ? <p className="muted">{profile.personaNote}</p> : null}
    </section>
  );
}

function ToggleRow({
  title,
  body,
  on,
  onClick,
}: {
  title: string;
  body: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="settings-row">
      <span>
        <strong>{title}</strong>
        <br />
        <small>{body}</small>
      </span>
      <button type="button" className={`toggle ${on ? "on" : ""}`} onClick={onClick} aria-pressed={on} aria-label={title}>
        <i />
      </button>
    </div>
  );
}
