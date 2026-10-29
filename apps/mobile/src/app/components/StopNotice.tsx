import { Icon } from "./Icon";

/** Required on every exercise screen. Copy is fixed by the brief. */
export function StopNotice() {
  return (
    <p className="mob-stop">
      <Icon name="alert" />
      <strong>Stop if this causes pain.</strong>
    </p>
  );
}
