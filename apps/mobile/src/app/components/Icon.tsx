/**
 * One small icon set, drawn for this shell: 24px grid, 1.75 stroke, round caps.
 * Icons are always decorative here; every control carries a visible text label.
 */
const PATHS = {
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" />
    </>
  ),
  plan: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  library: (
    <>
      <rect x="3.5" y="4" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="4" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="14" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="14" width="7" height="7" rx="1.8" />
    </>
  ),
  progress: <path d="M4 20V13M10 20V8M16 20v-9M21 20H3" />,
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 9.5V20h12V9.5" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z" />
      <path d="M14 6v12" strokeDasharray="2 2.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  knee: (
    <>
      <path d="M9 2.5 10.5 11 8 21" />
      <path d="M13.5 2.5 15 11l-2.5 10" />
      <circle cx="12.7" cy="11" r="1.6" />
    </>
  ),
  back: (
    <>
      <path d="M12 2.5c-2 3 2 6 0 9.5s2 6.5 0 9.5" />
      <path d="M9 6h6M9.5 10h5M9.5 14h5M9 18h6" />
    </>
  ),
  balance: (
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M12 7v7M6.5 10h11M12 14v7.5M12 14l4 2.5" />
    </>
  ),
  chevronLeft: <path d="M14.5 6 8.5 12l6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  filters: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c1.2-3.6 3.9-5.4 7-5.4s5.8 1.8 7 5.4" />
    </>
  ),
  play: <path d="M8.5 5.5v13l10.5-6.5-10.5-6.5Z" fill="currentColor" stroke="none" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 10v4.2M12 17.2v.1" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="mob-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
