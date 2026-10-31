import "@fontsource/inter-tight/400.css";
import { useEffect, useId, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { GradientText } from "@/components/ui/gradient-text";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";
import { Icon } from "../components/Icon";
import { TOTAL_DAYS } from "../data/plan";
import { useDay } from "../DayState";
import { AREA_SLUGS, COLLECTION_TITLE, openActiveCount, openFiltersFromParams, openParams, type OpenFilters } from "./data";
import { FilterPanel } from "./FilterPanel";
import "./open.css";

/** Category pills narrow Home to one section; on a See all page the matching pill shows as on. */
const CATEGORIES: { label: string; to: string; match: (path: string, area: string | null) => boolean }[] = [
  { label: "All", to: "/app/home", match: (p, area) => (p === "/app/home" && !area) || p === "/app/library/all" || p === "/app/library/today" },
  ...AREA_SLUGS.map((slug) => ({
    label: COLLECTION_TITLE[slug],
    to: `/app/home?area=${slug}`,
    match: (p: string, area: string | null) => (p === "/app/home" && area === slug) || p === `/app/library/${slug}`,
  })),
];

/** The same five tabs as the Events side, so both halves of the app share one navigation. */
const TABS: LiquidNavItem[] = [
  { to: "/app/home", label: "Home", icon: <Icon name="home" size={22} />, fx: "glow" },
  { to: "/app/plan", label: "My plan", shortLabel: "Plan", icon: <Icon name="plan" size={22} />, fx: "pop" },
  { to: "/app/events", label: "Events", icon: <Icon name="ticket" size={22} />, fx: "spin" },
  { to: "/app/progress", label: "Progress", icon: <Icon name="progress" size={22} />, fx: "wave" },
  { to: "/app/account", label: "Account", shortLabel: "You", icon: <Icon name="user" size={22} />, fx: "pop" },
];

/** Library, See all, the exercise panel and the session all belong to Home. */
function activeTab(path: string) {
  if (path === "/app/home" || path.startsWith("/app/library") || path.startsWith("/app/exercise") || path.startsWith("/app/session")) return 0;
  return TABS.findIndex((t) => path === t.to || path.startsWith(`${t.to}/`));
}

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
  const active = activeTab(pagePath);

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
          <Link to="/app/home" className="o-wordmark">
            <GradientText>Mobility</GradientText>
          </Link>
          <div className="o-topnav">
            <LiquidNavbar items={TABS} active={active} tone="mist" />
          </div>
          <p className="o-bar1__day">
            Day {currentDay} of {TOTAL_DAYS}
          </p>
        </div>
      </header>

      <SubBar pagePath={pagePath} />

      <main id="main" ref={mainRef} tabIndex={-1} className="o-main">
        <Outlet />
      </main>

      <footer className="o-foot">
        <div className="o-wrap">
          <Link to="/app/home" className="o-foot__mark">
            <GradientText>Mobility</GradientText>
          </Link>
        </div>
      </footer>

      <div className="o-bottomnav">
        <LiquidNavbar items={TABS} active={active} layout="stacked" tone="mist" />
      </div>
    </div>
  );
}

function SubBar({ pagePath }: { pagePath: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const filterBtn = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const onLibrary = pagePath.startsWith("/app/library/");
  const area = pagePath === "/app/home" ? params.get("area") : null;
  const filters: OpenFilters = onLibrary ? openFiltersFromParams(params) : { area: [], position: [], phase: [], time: [] };
  const count = openActiveCount(filters);
  const target = onLibrary ? pagePath : area ? `/app/library/${area}` : "/app/library/all";

  useEffect(() => {
    setQ(onLibrary ? params.get("q") ?? "" : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePath]);

  return (
    <div className="o-bar2">
      <div className="o-wrap o-bar2__inner">
        <form
          role="search"
          className={`o-search${searching ? " is-open" : ""}`}
          onSubmit={(e) => {
            e.preventDefault();
            const p = openParams(filters, q);
            navigate(`${target}${p.toString() ? `?${p}` : ""}`);
          }}
        >
          {/* Phones: the field folds into an icon button. */}
          <button
            type="button"
            className="o-search__toggle"
            aria-expanded={searching}
            aria-controls={searchId}
            onClick={() => {
              setSearching((v) => !v);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            <SearchIcon />
            <span className="sr-only">{searching ? "Close search" : "Search exercises"}</span>
          </button>
          <span className="o-search__icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <label htmlFor={searchId} className="sr-only">
            Search exercises
          </label>
          <input
            ref={inputRef}
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearching(false)}
            placeholder="Search"
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>

        <nav className="o-cats" aria-label="Categories">
          {CATEGORIES.slice(0, 1).map((c) => (
            <CatLink key={c.to} label={c.label} to={c.to} on={c.match(pagePath, area)} all />
          ))}
          <div className="o-cats__group">
            {CATEGORIES.slice(1).map((c) => (
              <CatLink key={c.to} label={c.label} to={c.to} on={c.match(pagePath, area)} />
            ))}
          </div>
        </nav>

        <button ref={filterBtn} type="button" className="o-pill o-pill--solid o-caps o-filterbtn" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          Filter
          {count ? <span className="o-fbadge">{count}<span className="sr-only"> on</span></span> : null}
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

function CatLink({ label, to, on, all = false }: { label: string; to: string; on: boolean; all?: boolean }) {
  return (
    <Link to={to} className={`o-cat${all ? " o-cat--all" : ""}${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined}>
      {label}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
