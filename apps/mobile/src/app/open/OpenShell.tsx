import "@fontsource/source-sans-3/300.css";
import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { TOTAL_DAYS } from "../data/plan";
import { SAMPLE_FIRST_NAME } from "../data/profile";
import { useDay } from "../DayState";
import { AREA_SLUGS, COLLECTION_TITLE, openActiveCount, openFiltersFromParams, openParams, type OpenFilters } from "./data";
import { FilterPanel } from "./FilterPanel";
import "./open.css";

const CATEGORIES: { label: string; to: string; match: (path: string) => boolean }[] = [
  { label: "All", to: "/app/home", match: (p) => p === "/app/home" || p === "/app/library/all" },
  ...AREA_SLUGS.map((slug) => ({
    label: COLLECTION_TITLE[slug],
    to: `/app/library/${slug}`,
    match: (p: string) => p === `/app/library/${slug}`,
  })),
];

const BOTTOM: { to: string; label: string; icon: IconName }[] = [
  { to: "/app/home", label: "Today", icon: "today" },
  { to: "/app/plan", label: "Plan", icon: "plan" },
  { to: "/app/events", label: "Near you", icon: "pin" },
  { to: "/app/progress", label: "Progress", icon: "progress" },
];

/**
 * Exercise side of the app, laid out like Open's web app: a logo row that scrolls away, a sticky
 * row of search, categories and Filter, and a bottom bar on phones. Theme lives in open.css,
 * scoped to .t-open so the Events pages keep their own look.
 */
export function OpenShell() {
  const location = useLocation();
  const { pathname } = location;
  const background = (location.state as { background?: { pathname: string } } | null)?.background;
  const pagePath = background?.pathname ?? pathname;
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);
  const { currentDay } = useDay();

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (pathname.startsWith("/app/exercise/")) return;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="mob-root t-open">
      <a className="mob-skip" href="#main">
        Skip to content
      </a>
      <header className="o-bar1">
        <div className="o-wrap o-bar1__inner">
          <p className="o-bar1__day">
            Day {currentDay} of {TOTAL_DAYS}
          </p>
          <Link to="/app/home" className="o-wordmark">
            Mobility
          </Link>
          <div className="o-bar1__right">
            <nav className="o-switch" aria-label="Where">
              <NavLink to="/app/home" className={() => `o-switch__opt${pagePath.startsWith("/app/events") ? "" : " is-on"}`} aria-current={pagePath.startsWith("/app/events") ? undefined : "page"}>
                At home
              </NavLink>
              <NavLink to="/app/events" className="o-switch__opt">
                Near you
              </NavLink>
            </nav>
            <AccountMenu />
          </div>
        </div>
      </header>

      <SubBar pagePath={pagePath} />

      <main id="main" ref={mainRef} tabIndex={-1} className="o-main">
        <Outlet />
      </main>

      <nav className="o-bottom" aria-label="Main">
        <ul>
          {BOTTOM.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `o-bottom__item${isActive || (item.to === "/app/home" && pagePath.startsWith("/app/library")) ? " is-active" : ""}`}>
                <Icon name={item.icon} size={24} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function SubBar({ pagePath }: { pagePath: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const filterBtn = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const onLibrary = pagePath.startsWith("/app/library/");
  const filters: OpenFilters = onLibrary ? openFiltersFromParams(params) : { area: [], position: [], phase: [], time: [] };
  const count = openActiveCount(filters);
  const target = onLibrary ? pagePath : "/app/library/all";

  useEffect(() => {
    setQ(onLibrary ? params.get("q") ?? "" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePath]);

  return (
    <div className="o-bar2">
      <div className="o-wrap o-bar2__inner">
        <form
          role="search"
          className="o-search"
          onSubmit={(e) => {
            e.preventDefault();
            const p = openParams(filters, q);
            navigate(`${target}${p.toString() ? `?${p}` : ""}`);
          }}
        >
          <label htmlFor={searchId} className="sr-only">
            Search exercises
          </label>
          <Icon name="search" />
          <input id={searchId} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" autoComplete="off" />
        </form>

        <nav className="o-cats" aria-label="Categories">
          {CATEGORIES.map((c) => {
            const on = c.match(pagePath);
            return (
              <Link key={c.to} to={c.to} className={`o-pill ${on ? "o-pill--solid" : "o-pill--plain"}`} aria-current={on ? "page" : undefined}>
                {c.label}
              </Link>
            );
          })}
        </nav>

        <button ref={filterBtn} type="button" className="o-pill o-pill--outline o-filterbtn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          Filter
          {count ? <span className="o-fbadge">{count}<span className="sr-only"> on</span></span> : null}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <FilterPanel
        open={open}
        initial={filters}
        query={q}
        onClose={() => {
          setOpen(false);
          requestAnimationFrame(() => filterBtn.current?.focus());
        }}
        onApply={(f) => {
          setOpen(false);
          const p = openParams(f, q);
          navigate(`${target}${p.toString() ? `?${p}` : ""}`);
          requestAnimationFrame(() => filterBtn.current?.focus());
        }}
      />
    </div>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="o-acct" ref={ref}>
      <button type="button" className="o-avatar" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((v) => !v)}>
        <span aria-hidden="true">{SAMPLE_FIRST_NAME[0]}</span>
        <span className="sr-only">Account menu</span>
      </button>
      {open ? (
        <ul id={menuId} className="o-acct__menu">
          <li>
            <Link to="/app/plan">My plan</Link>
          </li>
          <li>
            <Link to="/app/progress">Progress</Link>
          </li>
          <li>
            <Link to="/app/account">Account</Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
