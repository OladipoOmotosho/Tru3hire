import { Navigate } from "react-router-dom";
import {
  useAuth,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
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
  requireOnboarding = true,
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();

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

  // TODO: Check onboarding status from database/user metadata
  // For now, we'll skip onboarding check since we're in MVP
  // if (requireOnboarding && !hasCompletedOnboarding) {
  //   return <Navigate to="/onboarding" replace />;
  // }

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
