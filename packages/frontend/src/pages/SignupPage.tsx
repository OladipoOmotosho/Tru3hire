import { PageWrapper } from "@/components/PageWrapper";
import { SignUp } from "@clerk/clerk-react";

/**
 * SignUpPage - Clerk-powered sign up page
 *
 * Registration Flow:
 * 1. User creates account here (email/password or social)
 * 2. After sign-up, user is redirected to /onboarding
 * 3. Onboarding collects profile data (resume, skills, preferences)
 *
 * Clerk handles:
 * - Email verification
 * - Password strength validation
 * - Social sign up (Google, GitHub, LinkedIn)
 * - CAPTCHA protection
 */
export function SignUpPage() {
  return (
    <PageWrapper maxWidth="md" withNavbarOffset={true}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create Your Account
        </h1>
        <p className="text-muted-foreground">
          Join TrueHire to get personalized job matching
        </p>
      </div>

      {/* Clerk SignUp Component */}
      <SignUp
        appearance={{
          layout: {
            socialButtonsPlacement: "bottom",
          },
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg border border-border rounded-xl bg-card",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "border border-border hover:bg-muted transition-colors",
            formButtonPrimary:
              "bg-blue-600 hover:bg-blue-700 transition-colors",
            footerActionLink: "text-blue-600 hover:text-blue-700",
            formFieldInput: "bg-background border-border",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />

      {/* Info about next steps */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
          <strong>Next:</strong> After sign-up, you'll set up your profile with
          your resume and job preferences.
        </p>
      </div>
    </PageWrapper>
  );
}
