import { SignIn } from "@clerk/clerk-react";
import { PageWrapper } from "@/components/PageWrapper";

/**
 * SignInPage - Clerk-powered sign in page
 *
 * Clerk handles:
 * - Email/password authentication
 * - Social logins (Google, GitHub, LinkedIn)
 * - MFA/2FA
 * - Password reset
 * - Session management
 */
export function SignInPage() {
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
