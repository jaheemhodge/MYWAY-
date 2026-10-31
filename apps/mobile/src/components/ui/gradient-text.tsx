import type { ElementType, HTMLAttributes, ReactNode } from "react";
import "./gradient-text.css";

/**
 * Text filled with four soft colour blobs that drift slowly through the letters.
 * Adapted for Mobility from "Gradient Text" (21st.dev).
 *
 * Changes from the original:
 * - The original paints a solid white (or black) box behind the word and blends the blobs on top
 *   with mix-blend-mode. On this site's gradient page that would show as a white rectangle, so the
 *   blobs are drawn inside the letters instead (background-clip: text) and the page shows around them.
 * - No Tailwind and no motion library: the original only used motion to wrap the element; the
 *   movement itself is CSS keyframes, kept here with the same timings (12s, alternating).
 * - The blobs sit on an ink base, so the strokes never fade into the page between blobs.
 * - prefers-reduced-motion: the colours stay, the drifting stops.
 */
export interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: ElementType;
}

export function GradientText({ as: Component = "span", className, children, ...props }: GradientTextProps) {
  return (
    <Component className={["gradient-text", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}

export default GradientText;
