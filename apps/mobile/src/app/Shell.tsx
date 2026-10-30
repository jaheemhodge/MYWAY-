import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "@/components/illustrations";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";
import { Icon } from "./components/Icon";

const TABS: LiquidNavItem[] = [
  { to: "/app/today", label: "Today", icon: <Icon name="today" size={22} />, fx: "glow" },
  { to: "/app/plan", label: "My plan", icon: <Icon name="plan" size={22} />, fx: "pop" },
  { to: "/app/library", label: "Library", icon: <Icon name="library" size={22} />, fx: "spin" },
  { to: "/app/progress", label: "Progress", icon: <Icon name="progress" size={22} />, fx: "wave" },
];

/**
 * Logged-in shell. At 900px and up the liquid glass tabs sit centred in the top bar, between the
 * wordmark and Account. Below that the same four tabs float at the bottom as a full-width glass bar,
 * icon over label.
 */
export function Shell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const active = TABS.findIndex((tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`));

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
      <header className="mob-topbar">
        <div className="mob-topbar__inner">
          <Link to="/app/today" className="mob-wordmark" aria-label="Mobility, Today">
            <LogoMark />
          </Link>
          <div className="mob-topnav">
            <LiquidNavbar items={TABS} active={active} />
          </div>
          <NavLink to="/app/account" className={({ isActive }) => `mob-account${isActive ? " is-active" : ""}`}>
            <span className="mob-avatar" aria-hidden="true">
              <Icon name="user" size={22} />
            </span>
            <span>Account</span>
          </NavLink>
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
