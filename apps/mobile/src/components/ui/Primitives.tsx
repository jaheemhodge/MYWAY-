import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  block = true,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "light" | "quiet" | "danger";
  block?: boolean;
}) {
  return (
    <button className={`btn btn-${variant} ${block ? "btn-block" : ""}`} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="text-input" {...props} />;
}

export function Notice({ children, icon = "lock" }: { children: ReactNode; icon?: string }) {
  return (
    <div className="notice">
      <span aria-hidden="true">{icon === "lock" ? "🔒" : icon === "info" ? "ⓘ" : "♡"}</span>
      <p>{children}</p>
    </div>
  );
}

export function ChoiceRow({
  selected,
  onClick,
  icon,
  children,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      className={`choice ${selected ? "is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon ? <span className="choice-icon">{icon}</span> : null}
      <span className="choice-label">{children}</span>
      <span className={`mark ${multi ? "box" : "radio"}`} aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`chip ${selected ? "is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
      {children}
      <span className="mark box" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

export function StepHeader({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  return (
    <div className="step-header">
      <button type="button" className="icon-btn" onClick={onBack} aria-label="Go back">
        ‹
      </button>
      <div className="step-track" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={index < step ? "done" : ""} />
        ))}
      </div>
      <span className="step-count">
        {step} of {total}
      </span>
    </div>
  );
}

export function DemoBadge({ children = "Demonstration" }: { children?: ReactNode }) {
  return <span className="demo-badge">{children}</span>;
}
