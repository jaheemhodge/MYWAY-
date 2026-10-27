import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { routes } from "../routes";
import { cx } from "./hooks";
import styles from "./SlideNav.module.css";

export interface NavItem {
  href: `#${string}`;
  label: string;
}

interface Cursor {
  left: number;
  width: number;
  visible: boolean;
}

/**
 * Sliding-pill section nav (after the "slide tabs" pattern): a cream pill glides under the link
 * you point at or focus, and rests on the section you are reading. Plain CSS transitions, no
 * animation library; with reduced motion the pill jumps instead of sliding.
 *
 * Wide screens get the pill row. Narrow screens get a Menu button that opens the same links
 * as large full-width rows.
 */
export function SlideNav({ items }: { items: readonly NavItem[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [hovered, setHovered] = useState(-1);
  const [cursor, setCursor] = useState<Cursor>({ left: 0, width: 0, visible: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const target = hovered >= 0 ? hovered : active;

  const place = useCallback(() => {
    const link = target >= 0 ? linkRefs.current[target] : null;
    if (!link) {
      setCursor((current) => ({ ...current, visible: false }));
      return;
    }
    // Measure the list item, whose offsetParent is the pill row (the link's is its own item).
    const item = link.parentElement ?? link;
    setCursor({ left: item.offsetLeft, width: item.offsetWidth, visible: true });
  }, [target]);

  useLayoutEffect(place, [place]);

  useEffect(() => {
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place).catch(() => undefined);
    return () => window.removeEventListener("resize", place);
  }, [place]);

  // Rest the pill on the section you are reading: the last one whose top has passed 30% of the window.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = -1;
      items.forEach((item, index) => {
        const node = document.getElementById(item.href.slice(1));
        if (node && node.getBoundingClientRect().top <= line) current = index;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // The menu closes on Escape, returning focus to its button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <nav className={styles.nav} aria-label="On this page">
      <ul ref={listRef} className={styles.tabs} onMouseLeave={() => setHovered(-1)}>
        {items.map((item, index) => (
          <li key={item.href} className={styles.tab}>
            <a
              ref={(node) => {
                linkRefs.current[index] = node;
              }}
              href={item.href}
              className={cx(styles.link, index === target && cursor.visible && styles.onCursor)}
              aria-current={index === active ? "location" : undefined}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(-1)}
              onClick={() => setActive(index)}
            >
              {item.label}
            </a>
          </li>
        ))}
        <li
          aria-hidden="true"
          className={cx(styles.cursor, cursor.visible && styles.cursorVisible)}
          style={{ transform: `translateX(${cursor.left}px)`, width: cursor.width }}
        />
      </ul>

      <div className={styles.menu}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="section-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          {menuOpen ? "Close" : "Menu"}
        </button>
        {menuOpen ? (
          <ul id="section-menu" className={styles.sheet}>
            {items.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cx(styles.sheetLink, index === active && styles.sheetActive)}
                  aria-current={index === active ? "location" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className={styles.sheetCta}>
              <Link className="web-btn web-btn-light" to={routes.safety} onClick={() => setMenuOpen(false)}>
                Take the free movement check-in
              </Link>
            </li>
          </ul>
        ) : null}
      </div>
    </nav>
  );
}
