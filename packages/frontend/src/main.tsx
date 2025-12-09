import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// import initTheme from "../../../shared/utils/theme.ts";
// Use named import for initTheme (no default export)
import { initTheme } from "../../../shared/utils/theme";

// ensure theme is applied before React mounts to avoid flash
initTheme();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(
    'Root element with id="root" not found. Make sure packages/frontend/index.html has <div id="root"></div>'
  );
}
createRoot(rootEl).render(<App />);
