import { useEffect, useId, useRef, useState } from "react";
import { EXERCISES, POSITIONS, PHASES, POSITION_LABEL, type PhaseNumber, type Position } from "../data/library";
import { PHASE_INFO } from "../data/plan";
import { applyOpen, TIME_BUCKETS, TIME_LABEL, type OpenFilters, type TimeBucket } from "./data";

type Group = "position" | "time" | "phase";

/**
 * Filter panel: Position, Time and Phase, each chip showing the exact number of exercises it
 * would give with the other groups as they are. Modal dialog: focus stays inside, Esc closes.
 */
export function FilterPanel({
  open,
  initial,
  query,
  onApply,
  onClose,
}: {
  open: boolean;
  initial: OpenFilters;
  query: string;
  onApply: (f: OpenFilters) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(initial);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setDraft(initial);
      d.showModal();
    } else if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = applyOpen(EXERCISES, draft, query).length;

  function toggle<G extends Group>(group: G, value: OpenFilters[G][number]) {
    setDraft((d) => {
      const cur = d[group] as OpenFilters[G][number][];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...d, [group]: next };
    });
  }

  function count<G extends Group>(group: G, value: OpenFilters[G][number]) {
    return applyOpen(EXERCISES, { ...draft, [group]: [value] } as OpenFilters, query).length;
  }

  function chips<G extends Group>(group: G, legend: string, values: readonly OpenFilters[G][number][], label: (v: OpenFilters[G][number]) => string) {
    return (
      <fieldset className="o-fgroup">
        <legend>{legend}</legend>
        <div className="o-fchips">
          {values.map((v) => {
            const on = (draft[group] as OpenFilters[G][number][]).includes(v);
            return (
              <button key={String(v)} type="button" className={`o-pill ${on ? "o-pill--solid" : "o-pill--outline"}`} aria-pressed={on} onClick={() => toggle(group, v)}>
                {label(v)}
                <span className="o-fcount">
                  <span className="sr-only">, </span>
                  {count(group, v)}
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
      ref={ref}
      className="o-fpanel"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="o-fpanel__inner">
        <div className="o-fpanel__head">
          <h2 id={titleId} className="o-fpanel__title">
            Filter
          </h2>
          <button type="button" className="o-pill o-pill--icon" onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="o-fpanel__body">
          {chips("position", "Position", POSITIONS as Position[], (v) => (v === "floor" ? "Floor" : POSITION_LABEL[v as Position]))}
          {chips("time", "Time", TIME_BUCKETS as TimeBucket[], (v) => TIME_LABEL[v as TimeBucket])}
          {chips("phase", "Phase", PHASES as PhaseNumber[], (v) => `${v} · ${PHASE_INFO[v as PhaseNumber].name}`)}
        </div>
        <div className="o-fpanel__foot">
          <button type="button" className="o-pill o-pill--ghost" onClick={() => setDraft({ ...draft, position: [], time: [], phase: [] })}>
            Clear
          </button>
          <button type="button" className="o-pill o-pill--solid" aria-disabled={total === 0} onClick={() => total > 0 && onApply(draft)}>
            {total === 0 ? "No exercises match" : `Show ${total} ${total === 1 ? "exercise" : "exercises"}`}
          </button>
        </div>
      </div>
    </dialog>
  );
}
