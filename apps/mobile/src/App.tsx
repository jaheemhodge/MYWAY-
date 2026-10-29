import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PhoneFrame } from "./components/PhoneFrame";
import { AppShell } from "./screens/AppShell";
import { CheckIn } from "./screens/CheckIn";
import { Guide } from "./screens/Guide";
import { Hold } from "./screens/Hold";
import { Home } from "./screens/Home";
import { Details } from "./screens/Details";
import { Legal } from "./screens/Legal";
import { Milestone } from "./screens/Milestone";
import { Onboarding } from "./screens/Onboarding";
import { Personalizing } from "./screens/Personalizing";
import { Plan } from "./screens/Plan";
import { Player } from "./screens/Player";
import { Profile } from "./screens/Profile";
import { Progress } from "./screens/Progress";
import { Reveal } from "./screens/Reveal";
import { SessionIntro } from "./screens/SessionIntro";
import { SignIn } from "./screens/SignIn";
import { Welcome } from "./screens/Welcome";
import { useApp } from "./store/AppState";
import { MarketingApp } from "./web/MarketingApp";
import { isAppPath, isPrototypePath, routes } from "./web/routes";
import { MobilityApp } from "./app/MobilityApp";

export function App() {
  const { pathname } = useLocation();
  if (isAppPath(pathname)) return <MobilityApp />;
  if (!isPrototypePath(pathname)) return <MarketingApp />;
  return <PrototypeApp />;
}

function PrototypeApp() {
  const { state } = useApp();
  if (!state.hydrated) {
    return (
      <PhoneFrame>
        <div className="screen">
          <p className="muted">Loading your place in the journey…</p>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <Routes>
        <Route path={routes.welcome} element={<Welcome />} />
        <Route path={routes.signIn} element={<SignIn />} />
        <Route path="/onboarding/:step" element={<Onboarding />} />
        <Route path="/personalizing" element={<Personalizing />} />
        <Route path="/reveal" element={<Reveal />} />
        <Route path="/hold" element={<Hold />} />
        <Route path="/session/:day" element={<SessionIntro />} />
        <Route path="/player/:day" element={<Player />} />
        <Route path="/guide/:exerciseId" element={<Guide />} />
        <Route path="/checkin/:day" element={<CheckIn />} />
        <Route path="/milestone/:phase" element={<Milestone />} />
        <Route path={routes.legal} element={<Legal />} />
        <Route path="/profile/details" element={<Details />} />
        <Route path="/preview" element={<AppShell />}>
          <Route path="home" element={<Home />} />
          <Route path="progress" element={<Progress />} />
          <Route path="plan" element={<Plan />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to={routes.welcome} replace />} />
      </Routes>
    </PhoneFrame>
  );
}
