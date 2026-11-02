import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/500.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "./landing.css";
import { LandingCoach } from "./sections/LandingCoach";
import { LandingFooter } from "./sections/LandingFooter";
import { LandingHero } from "./sections/LandingHero";
import { LandingNavbar } from "./sections/LandingNavbar";
import { LandingPrograms } from "./sections/LandingPrograms";

/**
 * Public landing page at "/" for signed-out visitors.
 * Sections stack top to bottom; new ones (#how, #programs, …) slot in between the carousel and the footer.
 */
export function LandingPage() {
  return (
    <div className="landing" id="top">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingCoach />
        {/* more sections go here, between the carousel and programs */}
        <LandingPrograms />

      </main>
      <LandingFooter />
    </div>
  );
}
