import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import "./fill-up-button.css";

/**
 * Outlined button whose label slides up and out on hover while an indigo fill sweeps up from the
 * bottom and brings the label back in white. Adapted for Mobility from 21st.dev "button-6".
 *
 * Changes from the original:
 * - A router link (`FillUpLink`) with an `active` state that shows the filled look all the time.
 * - 56px tall, 18px text; plain CSS (no Tailwind), the same 500ms slide on a strong ease-out.
 * - Hover motion only on devices with a mouse; reduced motion swaps colour without sliding.
 * - The second copy of the label is hidden from screen readers so it is read once.
 * - Colours come from CSS variables (--fub-c, --fub-on, --fub-border, --fub-bg, --fub-shadow,
 *   --fub-shadow-on) so a page can match its own chrome.
 */
export function FillUpLink({
  active = false,
  children,
  className,
  ...props
}: LinkProps & { active?: boolean; children: ReactNode }) {
  return (
    <Link {...props} className={["fub", active ? "is-on" : "", className].filter(Boolean).join(" ")} aria-current={active ? "page" : undefined}>
      <span className="fub__front">{children}</span>
      <span className="fub__back" aria-hidden="true">
        <span className="fub__fill" />
        <span className="fub__label">{children}</span>
      </span>
    </Link>
  );
}

export default FillUpLink;
