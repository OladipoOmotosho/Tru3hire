import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Pre-refactor guard (Task 10b). Stub Clerk + the API-url helper.
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    user: { id: "u1", publicMetadata: {}, unsafeMetadata: {} },
    isSignedIn: true,
    isLoaded: true,
  }),
}));
vi.mock("@/lib/api-url", () => ({
  getApiUrl: vi.fn().mockResolvedValue("http://localhost:8000"),
}));

import { OnboardingPage } from "./OnboardingPage";

describe("OnboardingPage", () => {
  it("renders the first onboarding step", () => {
    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Welcome to TrueHire/i)).toBeInTheDocument();
  });
});
