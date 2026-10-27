import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./Landing";
import { MovementCheckIn } from "./MovementCheckIn";
import { PlanPreview } from "./PlanPreview";
import { routes } from "./routes";
import { SafetyPause } from "./SafetyPause";
import { SafetyScreen } from "./SafetyScreen";
import { SignUp } from "./SignUp";
import { WebLayout } from "./WebLayout";

export function MarketingApp() {
  return (
    <Routes>
      <Route element={<WebLayout />}>
        <Route path={routes.landing} element={<Landing />} />
        <Route path={routes.safety} element={<SafetyScreen />} />
        <Route path={routes.safetyPause} element={<SafetyPause />} />
        <Route path={routes.checkIn} element={<Navigate to={`${routes.checkIn}/intro`} replace />} />
        <Route path={`${routes.checkIn}/:stepId`} element={<MovementCheckIn />} />
        <Route path={routes.plan} element={<PlanPreview />} />
        <Route path={routes.signUp} element={<SignUp />} />
        <Route path="*" element={<Navigate to={routes.landing} replace />} />
      </Route>
    </Routes>
  );
}
