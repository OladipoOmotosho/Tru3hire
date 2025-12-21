import { ReactNode } from "react";
import { cn } from "../lib/utils";

// ============================================================================
// Types
// ============================================================================

export type MaxWidthSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "4xl"
  | "7xl"
  | "full";

export interface PageWrapperProps {
  /** Page content */
  children: ReactNode;
  /** Maximum width of the content container */
  maxWidth?: MaxWidthSize;
  /** Whether to include top padding for navbar offset (default: true) */
  withNavbarOffset?: boolean;
  /** Additional classes for the outer wrapper */
  className?: string;
  /** Additional classes for the inner container */
  containerClassName?: string;
  /** Whether to include horizontal padding (default: true) */
  withPadding?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_WIDTH_CLASSES: Record<MaxWidthSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

// ============================================================================
// Component
// ============================================================================

/**
 * PageWrapper - Reusable page layout wrapper
 *
 * Provides consistent page layout with:
 * - Full-height background
 * - Navbar offset padding
 * - Centered max-width container
 * - Horizontal padding
 *
 * @example
 * // Standard page with default 7xl width
 * <PageWrapper>
 *   <h1>Dashboard</h1>
 *   <p>Content here...</p>
 * </PageWrapper>
 *
 * @example
 * // Narrower page (e.g., settings, profile)
 * <PageWrapper maxWidth="4xl">
 *   <h1>Settings</h1>
 * </PageWrapper>
 *
 * @example
 * // Page without navbar offset (e.g., auth pages)
 * <PageWrapper withNavbarOffset={false} maxWidth="md">
 *   <LoginForm />
 * </PageWrapper>
 */
export function PageWrapper({
  children,
  maxWidth = "7xl",
  withNavbarOffset = true,
  className,
  containerClassName,
  withPadding = true,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        withNavbarOffset && "py-[100px]",
        className
      )}
    >
      <div
        className={cn(
          MAX_WIDTH_CLASSES[maxWidth],
          "mx-auto",
          withPadding && "px-4",
          containerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * PageSection - For pages that need multiple sections with different backgrounds
 *
 * Use this for hero sections or other full-width sections within a page.
 *
 * @example
 * <PageSection className="bg-gradient-to-b from-primary/10 to-background">
 *   <div className="max-w-4xl mx-auto px-4">
 *     <h1>Hero Title</h1>
 *   </div>
 * </PageSection>
 */
export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("w-full", className)}>{children}</section>;
}
