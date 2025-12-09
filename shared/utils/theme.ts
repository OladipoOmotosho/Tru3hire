// ...new file...
/**
 * theme.ts
 * Simple theme helpers: read/store preference and toggle the `.dark` class on <html>.
 *
 * Exports:
 *  - initTheme(): apply saved or system theme (call early, before render)
 *  - getTheme(): "dark" | "light" | "system"
 *  - toggleTheme(): switch between "dark" and "light" (persists choice)
 */

type Theme = "dark" | "light" | "system";

const LS_KEY = "theme-preference";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(LS_KEY) as Theme | null;
  return stored ?? "system";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else if (theme === "light") {
    html.classList.remove("dark");
  } else {
    // system
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.toggle("dark", prefersDark);
  }
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);

  // If user prefers 'system' we want to listen for changes
  if (
    theme === "system" &&
    typeof window !== "undefined" &&
    window.matchMedia
  ) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      applyTheme("system");
    };
    // modern API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", listener);
    } else {
      // fallback
      // @ts-ignore
      mql.addListener(listener);
    }
  }
}

/**
 * Toggle between dark and light.
 * If current saved value is 'dark' -> set 'light', otherwise set 'dark'.
 * Returns the new effective theme ("dark" | "light").
 */
export function toggleTheme(): "dark" | "light" {
  const current = getTheme();
  const newTheme = current === "dark" ? "light" : "dark";
  localStorage.setItem(LS_KEY, newTheme);
  applyTheme(newTheme);
  return newTheme;
}
