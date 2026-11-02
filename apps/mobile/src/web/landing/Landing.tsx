import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/state/AuthProvider";
import { routes } from "@/web/routes";

/**
 * Placeholder for the next marketing page at "/".
 * No UI: a signed-in visitor goes to /app/home, everyone else to /sign-in.
 * Replace this file when the new landing page is ready.
 */
export function Landing() {
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status === "signedIn") return <Navigate to="/app/home" replace />;
  return <Navigate to={routes.signIn} replace />;
}
