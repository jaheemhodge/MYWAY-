import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AREAS, AREA_LABEL, PHASES, POSITIONS, POSITION_LABEL } from "../data/library";
import { PHASE_INFO } from "../data/plan";
import {
  applyFilters,
  EMPTY_FILTERS,
  optionCount,
  toggleValue,
  type FilterGroup,
  type Filters,
} from "../data/filters";
import { Icon } from "./Icon";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Filters dialog: centered on desktop, bottom sheet on phone (CSS). Native modal <dialog> plus an
 * explicit Tab trap; Escape closes; focus returns to the opener. Changes are a draft until the
 * primary button applies them.
 */
export function FilterDialog({
  open,
  initial,
  query,
  onApply,
  onClose,
}: {
  open: boolean;
  initial: Filters;
  query: string;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Filters>(initial);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft(initial);
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // initial is read only when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = applyFilters(draft, query).length;

  function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (node) => node.offsetParent !== null || node === document.activeElement,
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function group<G extends FilterGroup>(
    key: G,
    legend: string,
    values: readonly Filters[G][number][],
    label: (value: Filters[G][number]) => string,
  ) {
    return (
      <fieldset className="mob-filter-group">
        <legend>{legend}</legend>
        <div className="mob-chips">
          {values.map((value) => {
            const selected = (draft[key] as Filters[G][number][]).includes(value);
            const count = optionCount(draft, key, value, query);
            return (
              <button
                key={String(value)}
                type="button"
                className="mob-chip"
                aria-pressed={selected}
                onClick={() => setDraft((current) => toggleValue(current, key, value))}
              >
                <span className="mob-chip__check" aria-hidden="true">
                  {selected ? <Icon name="check" size={20} /> : null}
                </span>
                <span>{label(value)}</span>
                <span className="mob-chip__count">
                  <span className="sr-only">, </span>
                  {count}
                  <span className="sr-only"> exercises</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="mob-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      onKeyDown={trapTab}
    >
      <div className="mob-dialog__panel">
        <header className="mob-dialog__head">
          <h2 id={titleId} className="mob-dialog__title">
            Filters
          </h2>
          <button type="button" className="mob-btn mob-btn--ghost mob-dialog__close" onClick={onClose} data-autofocus>
            <Icon name="close" />
            Close
          </button>
        </header>

        <div className="mob-dialog__body">
          {group("area", "Area", AREAS, (value) => AREA_LABEL[value])}
          {group("position", "How do you want to move", POSITIONS, (value) => POSITION_LABEL[value])}
          {group("phase", "Phase", PHASES, (value) => {
            const phase = PHASE_INFO[value];
            return `${phase.name} · Days ${phase.startDay}–${phase.endDay}`;
          })}
        </div>

        <footer className="mob-dialog__foot">
          <button type="button" className="mob-btn mob-btn--text" onClick={() => setDraft(EMPTY_FILTERS)}>
            Clear
          </button>
          <button
            type="button"
            className="mob-btn mob-btn--primary"
            aria-disabled={total === 0}
            onClick={() => {
              if (total === 0) return;
              onApply(draft);
            }}
          >
            {total === 0 ? "No exercises match" : `Show ${total} ${total === 1 ? "exercise" : "exercises"}`}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
