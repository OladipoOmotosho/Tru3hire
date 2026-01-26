import { Navigate } from "react-router-dom";
import {
  useAuth,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/clerk-react";
import { LoadingSpinner } from "./LoadingSpinner";

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, redirects to onboarding if not completed */
  requireOnboarding?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProtectedRoute - Protects routes that require authentication
 *
 * Uses Clerk's useAuth hook to check if user is signed in.
 *
 * @example
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requireOnboarding = false, // Default to false so existing users aren't affected
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Only check onboarding when explicitly required (e.g., for /jobs route)
  if (requireOnboarding) {
    // Check both key names for backwards compatibility
    const hasCompletedOnboarding =
      user?.unsafeMetadata?.onboardingComplete === true ||
      user?.unsafeMetadata?.hasCompletedOnboarding === true;
    if (!hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}

// ============================================================================
// Alternative: Using Clerk's built-in components
// ============================================================================

/**
 * ClerkProtectedRoute - Alternative using Clerk's declarative components
 *
 * This approach is more declarative and lets Clerk handle the redirect.
 */
export function ClerkProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
