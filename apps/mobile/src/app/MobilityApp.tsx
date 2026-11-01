import { Navigate, Route, Routes, useLocation, type Location } from "react-router-dom";
import { LocationProvider } from "./LocationState";
import { Shell } from "./Shell";
import { EventDetail } from "./screens/EventDetail";
import { Events } from "./screens/Events";
import { AccountScreen } from "./screens/placeholders/AccountScreen";
import { PlanScreen } from "./screens/placeholders/PlanScreen";
import { ProgressScreen } from "./screens/placeholders/ProgressScreen";
import { RecheckScreen } from "./screens/placeholders/RecheckScreen";
import { SessionDoneScreen } from "./screens/placeholders/SessionDoneScreen";
import { ExerciseOverlay } from "./open/ExerciseOverlay";
import { OpenHome } from "./open/OpenHome";
import { OpenShell } from "./open/OpenShell";
import { SeeAll } from "./open/SeeAll";
import { SessionPage } from "./open/SessionPage";
import "./app.css";

/**
 * Logged-in web app. Every route lives under /app and is rendered inside CoreFlowApp's guards
 * (session + onboarding) and providers (auth, profile, progress, favorites).
 * Exercise side ("At home") uses the Open-style shell; Events ("Near you") keeps its own shell.
 * /app/exercise/:id opens as a panel over the page it was opened from.
 */
export function MobilityApp() {
  return (
    <LocationProvider>
      <AppRoutes />
    </LocationProvider>
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
          <Route path="session/:day/done" element={<SessionDoneScreen />} />
          <Route path="recheck/:kind" element={<RecheckScreen />} />
          <Route path="plan" element={<PlanScreen />} />
          <Route path="progress" element={<ProgressScreen />} />
          <Route path="account" element={<AccountScreen />} />
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
