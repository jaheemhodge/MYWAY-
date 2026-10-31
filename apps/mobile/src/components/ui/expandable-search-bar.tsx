import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import "./expandable-search-bar.css";

/**
 * A round search button that opens into a search bar. Adapted for Mobility from
 * "Expandable Search Bar" (21st.dev).
 *
 * Changes from the original:
 * - 56px tall (button and bar) with 18px text, sized for older users.
 * - No framer-motion or lucide: the bar opens with a CSS clip-path reveal (transform-free, GPU
 *   friendly) and the icons are inline SVG.
 * - Escape closes only when focus is inside the search, so it never steals Escape from dialogs.
 * - A real <label>, the closed bar is inert (not reachable by Tab), and `defaultValue` lets a
 *   page that already has a query open with it filled in.
 * - Clicking outside closes it only when it is empty (as in the original).
 */
export type ExpandableSearchBarProps = {
  expandDirection?: "left" | "right";
  placeholder?: string;
  /** Read-out name of the field. */
  label?: string;
  onSearch?: (query: string) => void;
  className?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  /** Width of the open bar, any CSS length. */
  width?: string;
};

export default function ExpandableSearchBar({
  expandDirection = "right",
  placeholder = "Search",
  label = "Search",
  onSearch,
  className,
  defaultOpen = false,
  defaultValue = "",
  width = "300px",
}: ExpandableSearchBarProps) {
  const [open, setOpen] = useState(defaultOpen || Boolean(defaultValue));
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  // A new page can bring a new query (or none).
  useEffect(() => {
    setValue(defaultValue);
    if (defaultValue) setOpen(true);
  }, [defaultValue]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && value === "") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, value]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      setValue("");
      return;
    }
    setOpen(true);
    // Focus once the bar is no longer inert.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch?.(value.trim());
  };

  return (
    <div
      ref={rootRef}
      className={["xs", className].filter(Boolean).join(" ")}
      data-open={open ? "true" : "false"}
      data-dir={expandDirection}
      style={{ ["--xs-w" as string]: width }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          setValue("");
          toggleRef.current?.focus();
        }
      }}
    >
      <form
        role="search"
        className="xs__bar"
        onSubmit={submit}
        aria-hidden={open ? undefined : true}
        {...(open ? {} : { inert: "" })}
      >
        <label htmlFor={id} className="xs__sr">
          {label}
        </label>
        <input
          ref={inputRef}
          id={id}
          className="xs__input"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className="xs__go" aria-label="Search">
          <SearchIcon />
        </button>
      </form>
      <button ref={toggleRef} type="button" className="xs__toggle" aria-expanded={open} aria-controls={id} onClick={toggle}>
        {open ? <CloseIcon /> : <SearchIcon />}
        <span className="xs__sr">{open ? "Close search" : "Open search"}</span>
      </button>
    </div>
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

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
