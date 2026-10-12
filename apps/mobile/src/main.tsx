import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { PhoneFrame } from "./components/PhoneFrame";
import { AppStateProvider } from "./store/AppState";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/screens.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStateProvider>
      <BrowserRouter>
        <PhoneFrame>
          <App />
        </PhoneFrame>
      </BrowserRouter>
    </AppStateProvider>
  </React.StrictMode>,
);
