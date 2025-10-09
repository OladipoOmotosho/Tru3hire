import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// @ts-ignore: allow importing CSS as a side-effect without type declarations
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(
    'Root element with id="root" not found. Make sure index.html has <div id="root"></div>'
  );
}
createRoot(rootEl).render(<App />);
