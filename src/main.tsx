import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// @ts-ignore: allow importing CSS as a side-effect without type declarations
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
