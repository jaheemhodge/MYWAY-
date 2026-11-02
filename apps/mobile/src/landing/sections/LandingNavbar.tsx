import { useEffect, useRef, useState } from "react";
import { LiquidNavbar, NimbusIcons, type LiquidNavItem } from "@/components/ui/nimbus-liquid-navbar";
import { SECTION_HREF, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";
import { useMediaQuery } from "../useMediaQuery";

const svg = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** "How it works": three steps leading to a play button. */
const stepsIcon = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.2 8.8v6.4l5-3.2-5-3.2Z" />
  </>,
);

/** "Programs": a target, one focus area at the centre. */
const targetIcon = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1" />
  </>,
);

const ITEMS: LiquidNavItem[] = [
  { label: "Home", href: SECTION_HREF.top, icon: NimbusIcons.home, fx: "glow" },
  { label: "How it works", href: SECTION_HREF.how, icon: stepsIcon, fx: "spin" },
  { label: "Programs", href: SECTION_HREF.programs, icon: targetIcon, fx: "wave" },
  { label: "The coach", href: SECTION_HREF.coach, icon: NimbusIcons.user, fx: "pop" },
];

/** Which item stands for which section when it fills the screen. Anything else → Home. */
const SECTION_INDEX: Record<string, number> = { coach: 3, programs: 2 };

export function LandingNavbar() {
  const [active, setActive] = useState(0);
  // Clicking scrolls smoothly; hold the picked item while the scroll runs so the observer doesn't fight it.
  const lockUntil = useRef(0);
  // Labels + wordmark + both buttons need ~880px; below that the pill shows icons only.
  const compact = useMediaQuery("(max-width: 879px)");

  // Active item follows the scroll position.
  useEffect(() => {
    const sections = Object.keys(SECTION_INDEX)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const share: Record<string, number> = {};
    const io = new IntersectionObserver(
      (entries) => {
        const vh = window.innerHeight || 800;
        for (const e of entries) share[e.target.id] = e.isIntersecting ? e.intersectionRect.height / vh : 0;
        if (Date.now() < lockUntil.current) return;
        const [id, s] = Object.entries(share).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
        setActive(s > 0.45 ? SECTION_INDEX[id] : 0);
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Tuck the floating bar away while the footer fills most of the screen; its top bar has the same links.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".landing-footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const vh = window.innerHeight || 800;
        setTucked(entry.isIntersecting && entry.boundingClientRect.top < vh * 0.25);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  return (
    <header className={"landing-nav" + (tucked ? " is-tucked" : "")}>
      <div className="landing-nav__row">
        <a className="landing-nav__wordmark" href={SECTION_HREF.top}>
          Mobility
        </a>
        <LiquidNavbar
          items={ITEMS}
          active={active}
          tone="light"
          sound={false}
          compact={compact ? true : undefined}
          className="landing-nav__pill"
          onChange={(index) => {
            lockUntil.current = Date.now() + 1200;
            setActive(index);
          }}
        />
        <div className="landing-nav__actions">
          <a className="landing-nav__signin" href={SIGN_IN_HREF}>
            Sign in
          </a>
          <a className="landing-pill landing-pill--ink landing-nav__start" href={SIGN_UP_HREF}>
            <span className="landing-nav__start-long">Start free</span>
            <span className="landing-nav__start-short">Start</span>
          </a>
        </div>
      </div>
    </header>
  );
}
