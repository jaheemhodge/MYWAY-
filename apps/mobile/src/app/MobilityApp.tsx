import { Navigate, Route, Routes } from "react-router-dom";
import { DayProvider } from "./DayState";
import { LocationProvider } from "./LocationState";
import { Shell } from "./Shell";
import { EventDetail } from "./screens/EventDetail";
import { Events } from "./screens/Events";
import { ExerciseDetail } from "./screens/ExerciseDetail";
import { Home } from "./screens/Home";
import { Library } from "./screens/Library";
import { AccountStub, PlanStub, ProgressStub } from "./screens/Stubs";
import "./app.css";

/** Logged-in web app. Every route lives under /app. Local state only: no network calls. */
export function MobilityApp() {
  return (
    <DayProvider>
      <LocationProvider>
        <Routes>
          <Route path="/app" element={<Shell />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="today" element={<Navigate to="/app/home" replace />} />
            <Route path="plan" element={<PlanStub />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="progress" element={<ProgressStub />} />
            <Route path="account" element={<AccountStub />} />
            <Route path="library" element={<Library />} />
            <Route path="library/:id" element={<ExerciseDetail />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Route>
        </Routes>
      </LocationProvider>
    </DayProvider>
  );
}
