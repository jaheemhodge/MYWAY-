import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "@/components/illustrations";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";
import { Icon } from "./components/Icon";

const TABS: LiquidNavItem[] = [
  { to: "/app/home", label: "Home", icon: <Icon name="home" size={22} />, fx: "glow" },
  { to: "/app/plan", label: "My plan", icon: <Icon name="plan" size={22} />, fx: "pop" },
  { to: "/app/events", label: "Events", icon: <Icon name="ticket" size={22} />, fx: "spin" },
  { to: "/app/progress", label: "Progress", icon: <Icon name="progress" size={22} />, fx: "wave" },
  { to: "/app/account", label: "Account", icon: <Icon name="user" size={22} />, fx: "pop" },
];

/** Pages reached from Home (the Library) keep Home highlighted. */
function activeTab(pathname: string) {
  if (pathname.startsWith("/app/library")) return 0;
  return TABS.findIndex((tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`));
}

/**
 * Logged-in shell. At 900px and up the five tabs sit centred in the top bar beside the wordmark.
 * Below that the same tabs float 16px above the bottom of the screen, icon over label.
 */
export function Shell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const active = activeTab(pathname);

  // Move focus to the page on route changes so keyboard and screen reader users land on the content.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="mob-root">
      <a className="mob-skip" href="#main">
        Skip to content
      </a>
      <header className={`mob-topbar${scrolled ? " is-scrolled" : ""}`}>
        <div className="mob-topbar__inner">
          <Link to="/app/home" className="mob-wordmark" aria-label="Mobility, Home">
            <LogoMark />
          </Link>
          <div className="mob-topnav">
            <LiquidNavbar items={TABS} active={active} />
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="mob-main">
        <Outlet />
      </main>

      <div className="mob-bottomnav">
        <LiquidNavbar items={TABS} active={active} layout="stacked" />
      </div>
    </div>
  );
}
