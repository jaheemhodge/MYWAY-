import { PolaroidCarousel } from "@/components/ui/PolaroidCarousel";
import { COACH_SLIDES } from "../content";
import { useMediaQuery } from "../useMediaQuery";

export function LandingCoach() {
  const mobile = useMediaQuery("(max-width: 640px)");
  return (
    <section id="coach" className="landing-coach" aria-labelledby="landing-coach-title">
      <div className="landing-coach__head">
        <h2 id="landing-coach-title">Meet your coach</h2>
        <p>Every move shown slowly and clearly, from the side, so you can follow along.</p>
      </div>
      <PolaroidCarousel
        slides={COACH_SLIDES}
        height={mobile ? 520 : 640}
        cardWidth={280}
        autoplay={4500}
        stringColor="#5E7380"
        ink="#0F1418"
        label="Coach exercises"
      />
    </section>
  );
}
