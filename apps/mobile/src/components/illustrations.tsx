export function ChairFigure({ variant = "sit" }: { variant?: "sit" | "lean" | "stand" | "tall" }) {
  const person =
    variant === "stand" || variant === "tall" ? (
      <g transform="translate(46 8)">
        <circle cx="12" cy="8" r="6" fill="#8d8a86" />
        <path d="M12 14v28" stroke="#8d8a86" strokeWidth="5" strokeLinecap="round" />
        <path d="M12 22h14" stroke="#8d8a86" strokeWidth="4" strokeLinecap="round" />
        <path d="M12 42v18" stroke="#8d8a86" strokeWidth="5" strokeLinecap="round" />
      </g>
    ) : variant === "lean" ? (
      <g transform="translate(28 28)">
        <circle cx="18" cy="8" r="6" fill="#8d8a86" />
        <path d="M16 14c6 8 8 16 6 24" stroke="#8d8a86" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 24h16" stroke="#8d8a86" strokeWidth="4" strokeLinecap="round" />
      </g>
    ) : (
      <g transform="translate(34 22)">
        <circle cx="16" cy="8" r="6" fill="#8d8a86" />
        <path d="M16 14v18" stroke="#8d8a86" strokeWidth="5" strokeLinecap="round" />
        <path d="M16 22h14" stroke="#8d8a86" strokeWidth="4" strokeLinecap="round" />
        <path d="M16 32v16" stroke="#8d8a86" strokeWidth="5" strokeLinecap="round" />
      </g>
    );

  return (
    <svg className="chair-figure" viewBox="0 0 160 140" role="img" aria-label="Chair-supported movement illustration">
      <path d="M38 58h52v8H46v52h-8V66H28v-8h10Z" fill="#5c4033" />
      <path d="M90 66v52h-8V74H48v-8h42Z" fill="#5c4033" />
      {person}
    </svg>
  );
}

export function LogoMark({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "is-light" : ""}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      </svg>
      Mobility
    </span>
  );
}
