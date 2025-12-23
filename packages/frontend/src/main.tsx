import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";
import { initTheme } from "../../../shared/utils/theme";

// ============================================================================
// Clerk Configuration
// ============================================================================

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables"
  );
}

// ============================================================================
// Initialize Theme
// ============================================================================

// Ensure theme is applied before React mounts to avoid flash
initTheme();

// ============================================================================
// Render App
// ============================================================================

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(
    'Root element with id="root" not found. Make sure packages/frontend/index.html has <div id="root"></div>'
  );
}

createRoot(rootEl).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    afterSignOutUrl={"/sign-in"}
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/onboarding"
  >
    <App />
  </ClerkProvider>
);
