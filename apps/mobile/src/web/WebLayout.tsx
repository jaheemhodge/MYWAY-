import { useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "../components/illustrations";
import { routes } from "./routes";

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#days", label: "60 days" },
  { href: "#sources", label: "References" },
  { href: "#safety-promise", label: "Safety" },
  { href: "#faq", label: "FAQ" },
];

export function WebLayout() {
  const location = useLocation();
  const onLanding = location.pathname === routes.landing;

  useLayoutEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const node = document.getElementById(id);
      if (node) {
        node.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="web-root">
      <a className="web-skip" href="#content">
        Skip to content
      </a>
      <header className="web-header">
        <div className="web-wrap web-header-inner">
          <Link to={routes.landing} className="web-wordmark" aria-label="Mobility, home">
            <LogoMark />
          </Link>
          {onLanding ? (
            <nav className="web-nav" aria-label="On this page">
              {NAV.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
          {onLanding ? (
            <Link className="web-btn web-btn-primary" to={routes.safety}>
              Free check-in
            </Link>
          ) : (
            <Link className="web-textlink" to={routes.landing}>
              Home
            </Link>
          )}
        </div>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <footer className="web-footer">
        <div className="web-wrap web-footer-grid">
          <div>
            <p className="web-footer-brand">Mobility</p>
            <p>Feel like yourself again.</p>
            <p>
              A 60-day home movement program for adults about 50 to 70. It is not medical advice, not
              physiotherapy, not a diagnosis, and not emergency care. It does not tell you the cause of pain,
              and it does not clear you to exercise.
            </p>
          </div>
          <nav aria-label="Footer">
            <Link to={routes.safety}>Safety screen</Link>
            <Link to={routes.checkIn}>Free check-in</Link>
            <Link to={routes.plan}>Plan preview</Link>
            <Link to={routes.signUp}>Sign up</Link>
            <Link to={routes.welcome}>In-app preview</Link>
            <Link to={routes.legal}>Privacy note</Link>
          </nav>
        </div>
        <div className="web-wrap">
          <p className="web-footer-meta">
            Educational references on this site are sources only. They are not endorsements, partnerships, or a
            review of Mobility. If you might be having an emergency, contact local emergency services.
          </p>
        </div>
      </footer>
    </div>
  );
}
