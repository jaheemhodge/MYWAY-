import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PHASE_COPY } from "../content/calendar";
import { useApp } from "../store/AppState";

export function Plan() {
  const { state, plan, today } = useApp();
  const navigate = useNavigate();
  const weekStart = Math.floor((state.currentDay - 1) / 7) * 7 + 1;
  const [start, setStart] = useState(weekStart);
  const week = useMemo(() => plan.filter((day) => day.day >= start && day.day < start + 7), [plan, start]);

  return (
    <section className="screen tabbed lavender">
      <p className="muted">Everyday Mobility and Strength</p>
      <h1 className="display">My Plan</h1>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>60 days at a glance</strong>
          <span>Day {state.currentDay} of 60</span>
        </div>
        <div className="calendar-grid" style={{ margin: "16px 0" }}>
          {plan.map((day) => {
            const done = state.completedDays.includes(day.day);
            const cls = [
              "cal-dot",
              done && (day.dayType === "recovery" || day.dayType === "education") ? "easy" : "",
              done && day.dayType === "strength_design" ? "done" : "",
              day.day === state.currentDay ? "today" : "",
              day.dayType === "review" && !done ? "check" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return <button key={day.day} className={cls} aria-label={`Day ${day.day}`} onClick={() => navigate(`/session/${day.day}`)} />;
          })}
        </div>
        <div className="legend muted">
          <span>● Session done</span>
          <span>● Easier day done</span>
          <span>● Today</span>
          <span>○ Check-in</span>
        </div>
        <p>{today ? `You're in ${PHASE_COPY[today.uiPhase].title}.` : ""}</p>
      </div>
      <div className="row" style={{ justifyContent: "space-between", margin: "18px 0 8px" }}>
        <div>
          <h2 style={{ margin: 0 }}>This week</h2>
          <p className="muted">Days {start} to {Math.min(60, start + 6)}</p>
        </div>
        <div className="row">
          <button className="icon-btn" aria-label="Previous week" onClick={() => setStart((value) => Math.max(1, value - 7))}>
            ‹
          </button>
          <button className="icon-btn" aria-label="Next week" onClick={() => setStart((value) => Math.min(57, value + 7))}>
            ›
          </button>
        </div>
      </div>
      <div className="stack">
        {week.map((day) => (
          <button
            key={day.day}
            className={`week-card ${day.day === state.currentDay ? "" : "week-card-light"}`}
            onClick={() => navigate(`/session/${day.day}`)}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <small>
                  {weekdayShort(state.currentDay, day.day)} {day.day}
                </small>
                <h3 style={{ margin: "4px 0" }}>{day.title}</h3>
                <p>
                  {day.durationLabel} · {typeLabel(day.dayType)}
                </p>
              </div>
              {day.day === state.currentDay ? <span className="pill">Today</span> : null}
            </div>
            <p>{day.summary}</p>
            {day.demonstration ? <small>Demonstration session · not a clinical prescription</small> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function typeLabel(type: string) {
  if (type === "strength_design") return "Strength";
  if (type === "activity_design") return "Activity";
  if (type === "education") return "Education";
  if (type === "recovery") return "Recovery";
  return "Check-in";
}

function weekdayShort(current: number, target: number) {
  const date = new Date();
  date.setDate(date.getDate() + (target - current));
  return date.toLocaleDateString("en-US", { weekday: "short" });
}
