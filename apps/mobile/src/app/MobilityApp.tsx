import { Navigate, Route, Routes, useLocation, type Location } from "react-router-dom";
import { DayProvider } from "./DayState";
import { LocationProvider } from "./LocationState";
import { Shell } from "./Shell";
import { EventDetail } from "./screens/EventDetail";
import { Events } from "./screens/Events";
import { AccountStub, PlanStub, ProgressStub } from "./screens/Stubs";
import { ExerciseOverlay } from "./open/ExerciseOverlay";
import { OpenHome } from "./open/OpenHome";
import { OpenShell } from "./open/OpenShell";
import { SeeAll } from "./open/SeeAll";
import { SessionPage } from "./open/SessionPage";
import "./app.css";

/**
 * Logged-in web app. Every route lives under /app. Local state only: no network calls.
 * Exercise side ("At home") uses the Open-style shell; Events ("Near you") keeps its own shell.
 * /app/exercise/:id opens as a panel over the page it was opened from.
 */
export function MobilityApp() {
  return (
    <DayProvider>
      <LocationProvider>
        <AppRoutes />
      </LocationProvider>
    </DayProvider>
  );
}

function AppRoutes() {
  const location = useLocation();
  const background = (location.state as { background?: Location } | null)?.background;
  const overlay = location.pathname.startsWith("/app/exercise/");

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/app/events" element={<Shell />}>
          <Route index element={<Events />} />
          <Route path=":id" element={<EventDetail />} />
        </Route>
        <Route path="/app" element={<OpenShell />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<OpenHome />} />
          <Route path="today" element={<Navigate to="/app/home" replace />} />
          <Route path="library" element={<Navigate to="/app/library/all" replace />} />
          <Route path="library/:slug" element={<SeeAll />} />
          {/* Opened directly (no page behind it): show Home underneath the panel. */}
          <Route path="exercise/:id" element={<OpenHome />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="session/:id" element={<SessionPage />} />
          <Route path="plan" element={<PlanStub />} />
          <Route path="progress" element={<ProgressStub />} />
          <Route path="account" element={<AccountStub />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
      {overlay ? (
        <Routes>
          <Route path="/app/exercise/:id" element={<ExerciseOverlay />} />
        </Routes>
      ) : null}
    </>
  );
}
