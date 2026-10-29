import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks";

function Stub({ title, children }: { title: string; children: React.ReactNode }) {
  usePageTitle(title);
  return (
    <div className="mob-wrap mob-page mob-stub">
      <h1 className="mob-display">{title}</h1>
      <div className="mob-stub__body">{children}</div>
      <Link to="/app/today" className="mob-btn mob-btn--secondary">
        Go to Today
      </Link>
    </div>
  );
}

// TODO(plan): My plan calendar is specced next. Stub only.
export function PlanStub() {
  return (
    <Stub title="My plan">
      <p className="mob-lede">Your 60-day calendar will live here: every day, each phase and both re-checks.</p>
    </Stub>
  );
}

// TODO(progress): Progress is specced next. Stub only.
export function ProgressStub() {
  return (
    <Stub title="Progress">
      <p className="mob-lede">Your Day 30 and Day 60 re-checks will show here, next to where you started.</p>
    </Stub>
  );
}

// TODO(account): no accounts yet. Stub only.
export function AccountStub() {
  return (
    <Stub title="Account">
      <p className="mob-lede">Your details, reminders and text size settings will live here.</p>
    </Stub>
  );
}
