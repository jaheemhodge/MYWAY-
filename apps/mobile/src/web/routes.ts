/** Public web funnel and the existing in-app routes that must stay phone-framed.
 * The logged-in web app lives under /app (see src/app); the old phone-framed tab screens moved to /preview. */

export const routes = {
  landing: "/",
  safety: "/safety",
  safetyPause: "/safety/pause",
  checkIn: "/check-in",
  plan: "/plan",
  signUp: "/signup",
  day1: "/session/1",
  welcome: "/welcome",
  signIn: "/sign-in",
  legal: "/legal",
} as const;

const PROTOTYPE_EXACT = new Set<string>([
  routes.welcome,
  routes.signIn,
  "/personalizing",
  "/reveal",
  "/hold",
  routes.legal,
]);

const PROTOTYPE_PREFIXES = ["/onboarding", "/session", "/player", "/guide", "/checkin", "/milestone", "/profile", "/preview"];

export function isPrototypePath(pathname: string): boolean {
  if (PROTOTYPE_EXACT.has(pathname)) return true;
  return PROTOTYPE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function checkInPath(stepId: string, occasion: string = "baseline"): string {
  const path = `${routes.checkIn}/${stepId}`;
  if (occasion === "baseline") return path;
  return `${path}?occasion=${encodeURIComponent(occasion)}`;
}

/** Logged-in web app shell (src/app/MobilityApp.tsx). */
export function isAppPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}
