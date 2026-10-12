import { Outlet } from "react-router-dom";
import { TabBar } from "../components/ui/TabBar";
import { useApp } from "../store/AppState";

export function AppShell() {
  const { state } = useApp();
  return (
    <div className={`app-shell ${state.settings.largeText ? "large-text" : ""}`}>
      <Outlet />
      <TabBar />
    </div>
  );
}
