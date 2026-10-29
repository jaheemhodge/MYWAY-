import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "@/components/illustrations";
import { Icon, type IconName } from "./components/Icon";

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/today", label: "Today", icon: "today" },
  { to: "/app/plan", label: "My plan", icon: "plan" },
  { to: "/app/library", label: "Library", icon: "library" },
  { to: "/app/progress", label: "Progress", icon: "progress" },
];

/**
 * Logged-in shell. One markup for both layouts: at 900px and up the tabs sit in the top bar
 * (Forest pill for the active tab); below that the same four tabs move to a 72px bottom bar
 * (Brass top bar and bold label for the active tab).
 */
export function Shell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

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
          <nav className="mob-tabs mob-tabs--top" aria-label="Main">
            <TabLinks variant="top" />
          </nav>
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

      <nav className="mob-tabs mob-tabs--bottom" aria-label="Main">
        <TabLinks variant="bottom" />
      </nav>
    </div>
  );
}

function TabLinks({ variant }: { variant: "top" | "bottom" }) {
  return (
    <ul>
      {TABS.map((tab) => (
        <li key={tab.to}>
          <NavLink to={tab.to} className={({ isActive }) => `mob-tab${isActive ? " is-active" : ""}`}>
            {variant === "bottom" ? <Icon name={tab.icon} /> : null}
            <span className="mob-tab__label">{tab.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
