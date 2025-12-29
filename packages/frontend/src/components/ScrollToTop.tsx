import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - Automatically scrolls to top on route change
 *
 * This component should be placed inside the BrowserRouter but
 * outside of Routes to ensure it runs on every navigation.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
