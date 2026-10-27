import { Link } from "react-router-dom";
import { FAQ, PHASES, SOURCES } from "./copy";
import { routes } from "./routes";
import { usePageTitle } from "./WebLayout";

export function Landing() {
  usePageTitle("Mobility — Feel like yourself again");

  return (
    <>
      <section className="web-hero">
        <div className="web-wrap web-hero-grid">
          <div>
            <p className="web-eyebrow">A 60-day home movement program</p>
            <h1>
              Feel like
              <br />
              <em>yourself</em>
              <br />
              again.
            </h1>
            <p className="web-lede">
              Short video sessions for adults about 50 to 70. You practice at home, at your own pace, with
              conservative movements and clear stop rules. No coach needs to be in the room.
            </p>
            <div className="web-hero-actions">
              <Link className="web-btn web-btn-light web-btn-block" to={routes.safety}>
                Take the free movement check-in
              </Link>
              <a className="web-hero-link" href="#how">
                See how it works
              </a>
            </div>
            <p className="web-hero-note">Free. A dozen short screens. No account yet, and no score.</p>
          </div>
          <HeroStill />
        </div>
      </section>

      <section className="web-section" id="how">
        <div className="web-wrap">
          <p className="web-kicker">How it works</p>
          <h2>Start with what everyday movement feels like.</h2>
          <ol className="web-steps">
            <li>
              <span>01</span>
              <h3>Take the free check-in</h3>
              <p>
                A few questions about stairs, chairs, the floor, reaching, groceries, and balance. Then comfort
                today, how active you are, what you hope for, and what you have at home. You answer in your own
                words. Nothing is graded.
              </p>
            </li>
            <li>
              <span>02</span>
              <h3>See the 60 days before a price</h3>
              <p>
                The plan preview shows how the weeks are organized, and it repeats what you told us. The price,
                when there is one, comes after that, on the sign-up page.
              </p>
            </li>
            <li>
              <span>03</span>
              <h3>Practice with video guidance</h3>
              <p>
                Sessions are short and you can pause them. Day 1 is planned for about 8 minutes. You do not need
                a coach beside you. Later sessions are still being prepared.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="web-section web-section-paper" id="days">
        <div className="web-wrap">
          <p className="web-kicker">What 60 days look like</p>
          <h2>Three phases. A careful pace.</h2>
          <p className="web-intro">
            The calendar inside the app is split into smaller blocks. These three phases are the simple view.
            They describe the plan. They are not a promise of a result.
          </p>
          <ol className="web-phases">
            {PHASES.map((phase) => (
              <li key={phase.id}>
                <p className="web-phase-range">{phase.range}</p>
                <h3>{phase.title}</h3>
                <p>{phase.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="web-section" id="session">
        <div className="web-wrap web-session">
          <div>
            <p className="web-kicker">A session at home</p>
            <h2>Day 1 stays short, supported, and optional to pause.</h2>
            <p>
              The first session is titled “Build Stronger Support for Your Knees.” It introduces how the hips
              and legs take part in everyday movement, then three supported movements: seated knee extension, a
              small standing hip movement with both hands on a counter, and a supported sit-to-stand.
            </p>
            <p>
              The film is not uploaded yet. The card here is our own title card, not a photo of a member and not
              someone else’s video.
            </p>
            <ul className="web-plain-list">
              <li>A sturdy chair without wheels, ideally against a wall.</li>
              <li>A fixed counter or similar surface at about hip height.</li>
              <li>Fewer repetitions, or skipping a movement, is always allowed.</li>
            </ul>
          </div>
          <figure className="web-poster">
            <img
              src="/videos/day-01/day01-poster.jpg"
              alt="Title card for Day 1, Build Stronger Support for Your Knees. The session film is not uploaded yet."
            />
            <figcaption>Our Day 1 title card. The session film is still being prepared.</figcaption>
          </figure>
        </div>
      </section>

      <section className="web-section web-section-paper" id="sources">
        <div className="web-wrap">
          <p className="web-kicker">Educational references</p>
          <h2>Built on guidance from physiotherapists</h2>
          <p className="web-intro">
            Public teaching from physiotherapists informed the ideas behind these sessions. The names below are
            educational references. They have not reviewed Mobility, they have not endorsed it, and this is not
            their program. We do not use their logos, their scripts, or their footage.
          </p>
          <ul className="web-sources">
            {SOURCES.map((source) => (
              <li key={source.id}>
                <p className="web-source-label">Educational reference</p>
                <h3>{source.name}</h3>
                <p>{source.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="web-section" id="safety-promise">
        <div className="web-wrap web-safety">
          <div>
            <p className="web-kicker">Safety promise</p>
            <h2>Conservative movements. You can stop.</h2>
            <p className="web-intro">
              A safety screen comes before the check-in. It is a short self-screen, not a medical clearance and
              not a test that can rule out a health problem.
            </p>
          </div>
          <ul className="web-promise">
            <li>Movements stay supported and conservative.</li>
            <li>You do not need a coach in the room.</li>
            <li>Stop for sharp pain, pain that builds, dizziness, chest discomfort, or unsteadiness.</li>
            <li>Yes, or I’m not sure, on a red-flag question asks you to check with your doctor first.</li>
            <li>Answering no does not mean you have been cleared to exercise.</li>
          </ul>
        </div>
      </section>

      <section className="web-section web-section-paper" id="faq">
        <div className="web-wrap web-faq-wrap">
          <p className="web-kicker">Questions</p>
          <h2>Short answers, before you begin.</h2>
          <div className="web-faq">
            {FAQ.map((item) => (
              <details key={item.id}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="web-close">
        <div className="web-wrap">
          <h2>When you are ready, start with the check-in.</h2>
          <p>It is free. It does not diagnose you. The price is not on this page.</p>
          <Link className="web-btn web-btn-light" to={routes.safety}>
            Take the free movement check-in
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroStill() {
  return (
    <div className="web-hero-art" aria-hidden="true">
      <svg viewBox="0 0 440 520" className="web-hero-svg">
        <rect x="36" y="28" width="250" height="300" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M36 178h250M161 28v300" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M58 230c28-36 62-46 96-18 18 14 34 18 58 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M248 292h118v18h-18v118h-16V310h-68v118h-16V310h-18v-18h18z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M262 292v-78h90" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M78 430h290" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p>A chair and a window. That is the setup.</p>
    </div>
  );
}
