export function ChoiceButtons({
  legendId,
  options,
  selected,
  onSelect,
  multi = false,
}: {
  legendId: string;
  options: readonly { id: string; label: string; help?: string }[];
  selected: string | readonly string[] | null;
  onSelect: (id: string) => void;
  multi?: boolean;
}) {
  const isSelected = (id: string) => (Array.isArray(selected) ? selected.includes(id) : selected === id);
  return (
    <div className={`web-choices ${multi ? "is-multi" : ""}`} role={multi ? "group" : "radiogroup"} aria-labelledby={legendId}>
      {options.map((option) => {
        const active = isSelected(option.id);
        return (
          <button
            key={option.id}
            type="button"
            className={`web-choice ${active ? "is-selected" : ""} ${multi ? "is-multi" : ""}`}
            aria-pressed={active}
            onClick={() => onSelect(option.id)}
          >
            <span>
              {option.label}
              {option.help ? <small>{option.help}</small> : null}
            </span>
            <span className="web-mark" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
