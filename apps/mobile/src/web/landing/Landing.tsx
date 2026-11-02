import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/state/AuthProvider";
import { LandingPage } from "@/landing/LandingPage";

/**
 * "/": signed-in visitors go to /app/home (unchanged); everyone else sees the landing page.
 */
export function Landing() {
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status === "signedIn") return <Navigate to="/app/home" replace />;
  return <LandingPage />;
}
