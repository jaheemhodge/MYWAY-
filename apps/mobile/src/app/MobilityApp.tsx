import { Navigate, Route, Routes } from "react-router-dom";
import { DayProvider } from "./DayState";
import { Shell } from "./Shell";
import { ExerciseDetail } from "./screens/ExerciseDetail";
import { Library } from "./screens/Library";
import { AccountStub, PlanStub, ProgressStub } from "./screens/Stubs";
import { Today } from "./screens/Today";
import "./app.css";

/** Logged-in web app shell. Every route lives under /app. Local state only: no network calls. */
export function MobilityApp() {
  return (
    <DayProvider>
      <Routes>
        <Route path="/app" element={<Shell />}>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<Today />} />
          <Route path="plan" element={<PlanStub />} />
          <Route path="library" element={<Library />} />
          <Route path="library/:id" element={<ExerciseDetail />} />
          <Route path="progress" element={<ProgressStub />} />
          <Route path="account" element={<AccountStub />} />
          <Route path="*" element={<Navigate to="today" replace />} />
        </Route>
      </Routes>
    </DayProvider>
  );
}
