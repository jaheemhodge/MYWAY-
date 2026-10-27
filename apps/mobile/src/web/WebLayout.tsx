import { useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "../components/illustrations";
import { SiteFooter } from "./landing/SiteFooter";
import { SlideNav, type NavItem } from "./landing/SlideNav";
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

const NAV: readonly NavItem[] = [
  { href: "#how", label: "How it works" },
  { href: "#days", label: "60 days" },
  { href: "#session", label: "A session" },
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
      <header className={`web-header ${onLanding ? "is-forest" : ""}`}>
        <div className="web-wrap web-header-inner">
          <Link to={routes.landing} className="web-wordmark" aria-label="Mobility, home">
            <LogoMark light={onLanding} />
          </Link>
          {onLanding ? <SlideNav items={NAV} /> : null}
          {onLanding ? (
            <Link className="web-btn web-btn-primary web-header-cta" to={routes.safety}>
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
      <SiteFooter />
    </div>
  );
}
