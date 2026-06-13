// Vitest global setup: registers jest-dom matchers (toBeInTheDocument, etc.)
// and clears mocks between tests so suites stay isolated.
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
