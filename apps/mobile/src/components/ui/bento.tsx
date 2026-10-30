/**
 * Bento grid, adapted for Mobility from the 21st.dev "FUI Bento Grid".
 *
 * Changes from the original:
 * - Light Mobility surfaces instead of the dark theme; no clsx or framer-motion (CSS hover only).
 * - Text never sits on the image: each tile is photo on top, words underneath on a soft surface.
 * - Each tile is one link (the title), so the whole tile is clickable and reads once to a screen reader.
 * - Layout and corner shapes live in app.css (.bento): 3 + 3 / 2 + 2 + 2 columns on desktop,
 *   2 columns on tablets, one column on phones, large outer corners and small inner ones.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function BentoGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ol className="bento" aria-label={label}>
      {children}
    </ol>
  );
}

export function BentoCard({
  to,
  image,
  imagePosition = "50% 22%",
  eyebrow,
  title,
  description,
  className = "",
}: {
  to: string;
  image: string;
  imagePosition?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <li className={`bento__card ${className}`}>
      <div className="bento__media">
        <img src={image} alt="" loading="lazy" decoding="async" style={{ objectPosition: imagePosition }} />
      </div>
      <div className="bento__body">
        <p className="bento__eyebrow">{eyebrow}</p>
        <h3 className="bento__title">
          <Link to={to} className="bento__link">
            {title}
          </Link>
        </h3>
        {description ? <p className="bento__desc">{description}</p> : null}
      </div>
    </li>
  );
}
