import { SignIn, useAuth } from "@clerk/clerk-react";
import { PageWrapper } from "@/components/PageWrapper";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * SignInPage - Clerk-powered sign in page
 *
 * Clerk handles:
 * - Email/password authentication
 * - Social logins (Google, GitHub, LinkedIn)
 * - MFA/2FA
 * - Password reset
 * - Session management
 *
 * IMPORTANT: We wait for Clerk to fully load before rendering SignIn
 * to prevent the component from mounting twice and sending duplicate OTP codes.
 */
export function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Wait for Clerk to fully initialize before showing SignIn
  // This prevents the component from mounting twice during hydration
  if (!isLoaded) {
    return (
      <PageWrapper maxWidth="md" withNavbarOffset={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PageWrapper>
    );
  }

  // Already signed in? Redirect to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageWrapper maxWidth="md" withNavbarOffset={true}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome</h1>
        <p className="text-muted-foreground">
          Sign in to access your TrueScore dashboard
        </p>
      </div>

      {/* Clerk SignIn Component */}
      <SignIn
        appearance={{
          layout: {
            socialButtonsPlacement: "bottom",
          },
          elements: {
            rootBox: "mx-auto w-full",
            card: "shadow-lg border border-border rounded-xl bg-card w-full",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "border border-border hover:bg-muted transition-colors",
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-700 transition-colors",
            footerActionLink: "text-blue-600 hover:text-blue-700",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </PageWrapper>
  );
}
