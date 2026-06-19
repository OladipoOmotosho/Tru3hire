import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Stub Clerk + API so the smoke renders from navigation state only (no network).
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ user: null, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue(null) }),
}));
vi.mock("../lib/api", () => ({
  analyzeJob: vi.fn(),
  analyzeJobUrl: vi.fn(),
  getAnalysis: vi.fn(),
}));

import { ResultsPage } from "./ResultsPage";

// A full TrueScore response, as the Analyze page would pass via router state.
const API_RESULT = {
  true_score: 82,
  risk_level: "safe" as const,
  breakdown: {
    authenticity: 82,
    hiring_activity: 70,
    hiring_likelihood: 70,
    resume_match: 80,
    company_reputation: 75,
    recency: 90,
  },
  insights: [],
  recommendations: [],
  company: null,
};

describe("ResultsPage", () => {
  it("renders the results view from a navigation-state analysis response", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/results",
            state: {
              jobText: "Senior Software Engineer at Acme Corporation.",
              apiResult: API_RESULT,
            },
          },
        ]}
      >
        <ResultsPage />
      </MemoryRouter>,
    );

    // Past the loading/null guard → the results view rendered.
    expect(screen.getByText(/Analysis Complete/i)).toBeInTheDocument();
    // The score breakdown component rendered for the response.
    // (The exact number is animated by ScoreGauge, so we assert the label, not
    // the value, to stay deterministic under jsdom.)
    expect(screen.getByText(/Authenticity Score/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Analyze Another/i).length).toBeGreaterThan(0);
  });
});
