import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import "./flow-button.css";

/**
 * "Flow" button, adapted for Mobility from 21st.dev flow-button. On hover a dark circle grows from
 * the centre, the label turns white and slides, one arrow leaves on the right while another
 * arrives from the left, and the pill's corners tighten.
 *
 * Changes from the original:
 * - Link (`FlowLink`) and round icon (`FlowIconButton`) versions, 56px tall, 18px text.
 * - Inline SVG arrow (no lucide-react); plain CSS (no Tailwind).
 * - Hover motion only with a mouse; reduced motion swaps colours without sliding.
 * - `direction="left"` mirrors the arrows for a Previous button.
 */
function Arrow({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function FlowLink({ children, className, ...props }: LinkProps & { children: ReactNode }) {
  return (
    <Link {...props} className={["flow", className].filter(Boolean).join(" ")}>
      <Arrow className="flow__arr flow__arr--in" />
      <span className="flow__text">{children}</span>
      <span className="flow__circle" aria-hidden="true" />
      <Arrow className="flow__arr flow__arr--out" />
    </Link>
  );
}

export function FlowIconButton({
  direction = "right",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { direction?: "left" | "right" }) {
  return (
    <button type="button" {...props} className={["flow", "flow--icon", direction === "left" ? "flow--left" : "", className].filter(Boolean).join(" ")}>
      <Arrow className="flow__arr flow__arr--in" />
      <span className="flow__circle" aria-hidden="true" />
      <Arrow className="flow__arr flow__arr--out" />
    </button>
  );
}

export default FlowLink;
