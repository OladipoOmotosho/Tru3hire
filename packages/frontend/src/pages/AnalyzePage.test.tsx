import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// AnalyzePage pulls in Clerk auth and the API client; stub both so the smoke
// test exercises rendering only (no network, no real auth).
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue(null) }),
}));
vi.mock("../lib/api", () => ({
  analyzeJob: vi.fn(),
  analyzeJobUrl: vi.fn(),
}));

import { AnalyzePage } from "./AnalyzePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AnalyzePage />
    </MemoryRouter>,
  );
}

describe("AnalyzePage", () => {
  it("renders the analyzer headline", () => {
    renderPage();
    expect(screen.getByText(/Is This Job/i)).toBeInTheDocument();
  });

  it("renders a job-posting input control for the user to submit", () => {
    renderPage();
    // The input form should expose at least one textbox/area for the posting.
    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });
});
