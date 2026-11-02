import { useEffect, useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogoMark } from "../components/illustrations";
import { SiteFooter } from "./landing/SiteFooter";

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function WebLayout() {
  const location = useLocation();

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
          <Link to="/" className="web-wordmark" aria-label="Mobility, home">
            <LogoMark />
          </Link>
          <Link className="web-textlink" to="/">
            Home
          </Link>
        </div>
      </header>
      <main id="content">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
