import { SECTION_HREF, SIGN_UP_HREF } from "../content";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero__inner">
        <h1 id="landing-hero-title" className="landing-hero__title landing-rise">
          <span>Feel like yourself again.</span>
          <span className="landing-hero__title-2">Move better in 60 days, at home.</span>
        </h1>
        <p className="landing-hero__sub landing-rise landing-rise--1">
          A gentle, guided daily session for your knees, lower back or hips and balance. Follow your coach through five gentle
          moves, finish the day, and the next one unlocks.
        </p>
        <div className="landing-hero__ctas landing-rise landing-rise--2">
          <a className="landing-pill landing-pill--ink landing-pill--lg" href={SIGN_UP_HREF}>
            Start your 60 days
          </a>
          <a className="landing-pill landing-pill--line landing-pill--lg" href={SECTION_HREF.how}>
            How it works
          </a>
        </div>
        <p className="landing-hero__note landing-rise landing-rise--3">Made for adults 50–70. No equipment needed beyond a chair.</p>

        <div className="landing-fan">
          <img
            className="landing-fan__card landing-fan__card--left"
            src="/coach/H16.jpg"
            alt="Coach doing a supported single-leg stand"
            width={500}
            height={625}
            loading="lazy"
            decoding="async"
          />
          <img
            className="landing-fan__card landing-fan__card--centre"
            src="/coach/K01.jpg"
            alt="Coach doing a seated knee extension"
            width={620}
            height={775}
            loading="eager"
          />
          <img
            className="landing-fan__card landing-fan__card--right"
            src="/coach/B13.jpg"
            alt="Coach doing a seated spine rotation"
            width={500}
            height={625}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
