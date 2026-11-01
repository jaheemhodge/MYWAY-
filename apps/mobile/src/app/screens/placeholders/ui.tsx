import "@fontsource/inter-tight/400.css";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { imageFor } from "../../data/images";
import { AREA_LABEL, displayName, type Exercise } from "../../data/library";
import { minutesFor, toneFor } from "../../open/data";
import "../../open/open.css";
import "./core.css";
import type { Choice } from "./questions";

/*
 * Small building blocks shared by the account, onboarding and in-app screens. They only use the
 * classes from open.css (the /app/home look) plus core.css next to this file.
 */

/** Full-page frame for screens outside the app shell (sign in, sign up, reset, onboarding). */
export function Frame({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mob-root t-open c-frame">
      <header className="o-wrap c-frame__bar">
        <Link to="/" className="o-wordmark">
          Mobility
        </Link>
        {aside}
      </header>
      <main id="main" tabIndex={-1} className="o-wrap c-frame__main">
        {children}
      </main>
    </div>
  );
}

/** Page head inside the app shell, on the same scale as Home's row titles. */
export function PageHead({ title, line, children }: { title: string; line?: ReactNode; children?: ReactNode }) {
  return (
    <div className="c-head">
      <h1 className="c-head__title">{title}</h1>
      {line ? <p className="c-line">{line}</p> : null}
      {children}
    </div>
  );
}

/** Loading, empty and error blocks. Never a blank screen. */
export function StateBlock({
  kind,
  title,
  children,
  action,
}: {
  kind: "loading" | "empty" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="c-state c-glass" role={kind === "error" ? "alert" : "status"} aria-live="polite">
      <span className="c-state__icon" aria-hidden="true">
        {kind === "loading" ? <span className="c-spinner" /> : <Icon name={kind === "error" ? "alert" : "today"} size={26} />}
      </span>
      <h2 className="c-state__title">{title}</h2>
      {children ? <div className="c-small">{children}</div> : null}
      {action}
    </div>
  );
}

/** Same blocks, wrapped in the in-app page layout. */
export function PageState(props: Parameters<typeof StateBlock>[0]) {
  return (
    <div className="o-wrap c-page">
      <StateBlock {...props} />
    </div>
  );
}

export type Notice = { tone: "error" | "info"; text: string } | null;

export function Message({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const error = notice.tone === "error";
  return (
    <p className={`c-msg${error ? " c-msg--error" : ""}`} role={error ? "alert" : "status"}>
      <Icon name={error ? "alert" : "check"} size={22} />
      <span>{notice.text}</span>
    </p>
  );
}

/** Label above a 60px input. `revealable` adds a Show / Hide button for passwords. */
export function Field({
  label,
  hint,
  revealable,
  type = "text",
  ...input
}: { label: string; hint?: string; revealable?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [shown, setShown] = useState(false);
  return (
    <div className="c-field">
      <label className="c-field__label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="c-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="c-field__row">
        <input
          id={id}
          className={`c-input${revealable ? " c-input--with-btn" : ""}`}
          type={revealable && shown ? "text" : type}
          aria-describedby={hint ? hintId : undefined}
          {...input}
        />
        {revealable ? (
          <button type="button" className="c-reveal" aria-pressed={shown} aria-controls={id} onClick={() => setShown((s) => !s)}>
            {shown ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** One question, big tap-choice rows. Radio for one answer, checkbox for several. */
export function Choices({
  name,
  options,
  value,
  onChange,
  multiple = false,
  columns = 1,
}: {
  name: string;
  options: Choice[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multiple?: boolean;
  columns?: 1 | 2;
}) {
  return (
    <div className={`c-choices${columns === 2 ? " c-choices--two" : ""}`}>
      {options.map((o) => {
        const checked = multiple ? (value as string[]).includes(o.value) : value === o.value;
        return (
          <label key={o.value} className={`c-choice${multiple ? " c-choice--multi" : ""}`}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => {
                if (!multiple) onChange(o.value);
                else onChange(checked ? (value as string[]).filter((v) => v !== o.value) : [...(value as string[]), o.value]);
              }}
            />
            <span className="c-choice__mark" aria-hidden="true">
              <Icon name="check" size={18} />
            </span>
            <span>{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** "Question 2 of 4" with a thin bar. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="c-quiz__progress">
      <p className="c-small">
        Question {step} of {total}
      </p>
      <div className="c-quiz__track" aria-hidden="true">
        <div className="c-quiz__fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

/** Small exercise row: the exercise's own photo (or its soft tone), name, area and minutes. */
export function ExerciseList({ exercises }: { exercises: readonly Exercise[] }) {
  return (
    <ul className="c-exlist">
      {exercises.map((e) => {
        const src = imageFor(e);
        return (
          <li key={e.id}>
            <span className="c-thumb" style={src ? undefined : { backgroundColor: toneFor(e.id) }}>
              {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : null}
            </span>
            <span>
              <span className="c-exlist__name">{displayName(e)}</span>
              <br />
              <span className="c-small">
                {AREA_LABEL[e.primaryArea]} · {minutesFor(e)} min
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function GoogleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Shown when the site has no Supabase keys yet. */
export function UnconfiguredCard() {
  return (
    <StateBlock kind="error" title="Accounts aren't switched on yet">
      This site isn't connected to its account service yet, so signing in won't work. Please try again later.
    </StateBlock>
  );
}
