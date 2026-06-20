import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Pre-refactor guard (Task 10b): ProfilePage pulls in Clerk + the API client.
// Stub both so the smoke exercises rendering only.
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    user: { id: "u1", publicMetadata: {}, unsafeMetadata: {} },
    isLoaded: true,
  }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue(null) }),
}));
vi.mock("@/lib/api", () => ({
  uploadResumeWithProgress: vi.fn(),
}));

import { ProfilePage } from "./ProfilePage";

describe("ProfilePage", () => {
  it("renders the profile page heading", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
  });
});
