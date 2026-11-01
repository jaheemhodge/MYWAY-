import "@fontsource/inter-tight/400.css";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ExpandableSearchBar from "@/components/ui/expandable-search-bar";
import { FillUpLink } from "@/components/ui/fill-up-button";
import { FooterSection } from "@/components/ui/footer-section";
import { FOOTER_COMPANY, FOOTER_CONTACT, FOOTER_NEWSLETTER_URL, FOOTER_SOCIAL } from "../data/footer";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar";
import { Icon } from "../components/Icon";
import { TOTAL_DAYS } from "../data/plan";
import { useProgress } from "../state/ProgressProvider";
import { AREA_SLUGS, COLLECTION_TITLE, openFiltersFromParams, openParams, type OpenFilters } from "./data";
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
  const { currentDay } = useProgress();
  const active = activeTab(pagePath);
  // The sticky bar only blurs once it is stuck with content passing under it; at rest it is
  // fully see-through, so the background grain is not smoothed into a visible band.
  // The day's session is a focused full-screen view: no nav, pills, search, footer or tab bar.
  // (The "done" page after it keeps the normal frame.)
  const focused = /^\/app\/session\/[^/]+$/.test(pathname);
  const bar1Ref = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = bar1Ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [focused]);

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
    <div className={`mob-root t-open${focused ? " t-focus" : ""}`}>
      <a className="mob-skip" href="#main">
        Skip to content
      </a>
      {focused ? null : (
        <header className="o-bar1" ref={bar1Ref}>
          <div className="o-wrap o-bar1__inner">
            <Link to="/app/home" className="o-wordmark">
              Mobility
            </Link>
            <div className="o-topnav">
              <LiquidNavbar items={TABS} active={active} tone="mist" />
            </div>
            <p className="o-bar1__day">
              Day {currentDay} of {TOTAL_DAYS}
            </p>
          </div>
        </header>
      )}

      {focused ? null : <SubBar pagePath={pagePath} stuck={stuck} />}

      <main id="main" ref={mainRef} tabIndex={-1} className="o-main">
        <Outlet />
      </main>

      {focused ? null : (
        <>
          <FooterSection
            brand="Mobility"
            tagline="Feel like yourself again."
            note="A 60-day home movement program for adults about 50 to 70. It is not medical advice, physiotherapy or emergency care."
            links={TABS.map((t) => ({ label: t.label, to: t.to }))}
            contact={FOOTER_CONTACT}
            social={FOOTER_SOCIAL}
            newsletterUrl={FOOTER_NEWSLETTER_URL}
            legal={[{ label: "Privacy and legal", to: "/legal" }]}
            copyright={`© ${new Date().getFullYear()} ${FOOTER_COMPANY}. All rights reserved.`}
          />

          <div className="o-bottomnav">
            <LiquidNavbar items={TABS} active={active} layout="stacked" tone="mist" />
          </div>
        </>
      )}
    </div>
  );
}

function SubBar({ pagePath, stuck }: { pagePath: string; stuck: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onLibrary = pagePath.startsWith("/app/library/");
  const area = pagePath === "/app/home" ? params.get("area") : null;
  const filters: OpenFilters = onLibrary ? openFiltersFromParams(params) : { area: [], position: [], phase: [], time: [] };
  // Search within the page you are on: a See all page, the chosen area, or the whole library.
  const target = onLibrary ? pagePath : area ? `/app/library/${area}` : "/app/library/all";
  const current = onLibrary ? params.get("q") ?? "" : "";

  return (
    <div className={`o-bar2${stuck ? " is-stuck" : ""}`}>
      <div className="o-wrap o-bar2__inner">
        <ExpandableSearchBar
          key={pagePath}
          className="o-xsearch"
          placeholder="Search exercises"
          label="Search exercises"
          defaultValue={current}
          width="var(--o-xs-w)"
          onSearch={(q) => {
            const p = openParams(filters, q);
            navigate(`${target}${p.toString() ? `?${p}` : ""}`);
          }}
        />

        <nav className="o-cats" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <CatLink key={c.to} label={c.label} to={c.to} on={c.match(pagePath, area)} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function CatLink({ label, to, on }: { label: string; to: string; on: boolean; all?: boolean }) {
  return (
    <FillUpLink to={to} active={on} className="o-cat">
      {label}
    </FillUpLink>
  );
}

