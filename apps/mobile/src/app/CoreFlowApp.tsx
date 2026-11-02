import { Route, Routes, useLocation } from "react-router-dom";
import { Landing } from "@/web/landing/Landing";
import { isAppPath, routes } from "@/web/routes";
import { RedirectIfAuthed, RequireOnboarded, RequireSession } from "./guards";
import { MobilityApp } from "./MobilityApp";
import { LoginScreen } from "./screens/placeholders/LoginScreen";
import { OnboardingScreen } from "./screens/placeholders/OnboardingScreen";
import { ResetPasswordScreen } from "./screens/placeholders/ResetPasswordScreen";
import { SignUpScreen } from "./screens/placeholders/SignUpScreen";
import { CoreProviders } from "./state";

/**
 * Account + logged-in app. Guards:
 *   /                     → future landing page; today a redirect only (signed in → /app/home, else /sign-in)
 *   /login, /signup       → signed-in users bounce to their intended page or /app/home
 *   /reset-password       → open to everyone (the reset email lands here with a recovery session)
 *   /onboarding           → needs a session; finished users bounce to /app/home
 *   /app/*                → needs a session AND a finished onboarding
 *
 * MobilityApp keeps its own top-level <Routes> (absolute /app paths), so it is wrapped by the
 * guards directly instead of being nested under a /app/* route.
 */
export function CoreFlowApp() {
  const { pathname } = useLocation();

  if (pathname === routes.landing) {
    return (
      <CoreProviders>
        <Landing />
      </CoreProviders>
    );
  }

  if (isAppPath(pathname)) {
    return (
      <CoreProviders>
        <RequireSession>
          <RequireOnboarded>
            <MobilityApp />
          </RequireOnboarded>
        </RequireSession>
      </CoreProviders>
    );
  }

  return (
    <CoreProviders>
      <Routes>
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
        </Route>
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route element={<RequireSession />}>
          <Route path="/onboarding" element={<OnboardingScreen />} />
        </Route>
      </Routes>
    </CoreProviders>
  );
}
