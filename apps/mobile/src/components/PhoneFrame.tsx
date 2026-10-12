import { useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function PhoneFrame({ children }: { children: ReactNode }) {
  const location = useLocation();

  useLayoutEffect(() => {
    const stage = document.querySelector(".phone-stage");
    if (stage instanceof HTMLElement) stage.scrollTop = 0;
    document.querySelectorAll(".screen").forEach((node) => {
      if (node instanceof HTMLElement) node.scrollTop = 0;
    });
  }, [location.pathname]);

  return (
    <div className="device-stage">
      <div className="phone-shell" role="presentation">
        <div className="phone-stage">{children}</div>
      </div>
    </div>
  );
}
