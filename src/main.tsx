// @ts-ignore: allow importing CSS as a side-effect without type declarations
import { createRoot } from "react-dom/client";
// @ts-ignore: allow importing CSS as a side-effect without type declarations
import "./index.css";
import App from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(
    'Root element with id="root" not found. Make sure index.html has <div id="root"></div>'
  );
}
// @ts-ignore: allow importing CSS as a side-effect without type declarations
createRoot(rootEl).render(<App />);
