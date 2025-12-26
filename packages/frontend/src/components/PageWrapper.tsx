import { ReactNode, useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { ArrowUp } from "lucide-react";

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
  /** Whether to show scroll to top button (default: true) */
  showScrollButton?: boolean;
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
// Smart Scroll Button Component
// ============================================================================

function SmartScrollButton() {
  const [scrollState, setScrollState] = useState<"top" | "middle" | "bottom">(
    "top"
  );

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollableHeight = scrollHeight - clientHeight;

      // Thresholds for determining position
      const nearTop = scrollTop < 200;
      const nearBottom = scrollTop > scrollableHeight - 200;

      if (nearTop) {
        setScrollState("top");
      } else if (nearBottom) {
        setScrollState("bottom");
      } else {
        setScrollState("middle");
      }
    };

    window.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState(); // Initial check
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hide button when at top (nothing to scroll to)
  const isVisible = scrollState !== "top";

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        bg-blue-600 hover:bg-blue-700 text-white
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }
      `}
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

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
 * - Floating scroll-to-top button
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
  showScrollButton = true,
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
      {showScrollButton && <SmartScrollButton />}
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
