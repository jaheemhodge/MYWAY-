import { useEffect, useRef, useState } from "react";
import { PROGRAM_CARDS } from "../content";

/**
 * Programs: the three focus areas as image cards. Layout follows 21st.dev "hero-08" (header grid + card
 * grid), rebuilt in plain CSS. Reveals once on scroll-in; static under prefers-reduced-motion.
 */
export function LandingPrograms() {
  const ref = useRef<HTMLElement>(null);
  // Start visible (no JS, tests, reduced motion); arm the reveal only once we know it can run.
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800) * 0.9) return; // already on screen: leave it as is
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = ["landing-programs", armed ? "is-armed" : "", shown ? "is-in" : ""].filter(Boolean).join(" ");

  return (
    <section ref={ref} id="programs" className={cls} aria-labelledby="landing-programs-title">
      <div className="landing-programs__inner">
        <div className="landing-programs__head landing-reveal">
          <h2 id="landing-programs-title" className="landing-programs__title">
            Pick where you want to feel better.
          </h2>
          <p className="landing-programs__desc">
            Three focus areas, each a 60-day plan in three gentle phases. You can do every session at home with a chair and a
            little floor space.
          </p>
        </div>

        <ul className="landing-programs__grid">
          {PROGRAM_CARDS.map((card, i) => (
            <li key={card.title} data-focus={card.focus} className="landing-card landing-reveal landing-reveal--media" style={{ "--i": i } as React.CSSProperties}>
              <img className="landing-card__img" src={card.image} alt={card.alt} width={1344} height={752} loading="lazy" decoding="async" />
              <div className="landing-card__shade" aria-hidden="true" />
              <div className="landing-card__body">
                <h3 className="landing-card__title">{card.title}</h3>
                <p className="landing-card__sub">{card.subtitle}</p>
                <a className="landing-card__btn" href={card.href}>
                  {card.cta}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
