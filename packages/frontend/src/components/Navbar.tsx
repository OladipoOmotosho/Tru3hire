import { Shield, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTheme, toggleTheme } from "../../../../shared/utils/theme";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";

/**
 * Navbar - Main navigation component
 *
 * Uses Clerk for authentication state:
 * - SignedIn: Shows user menu with UserButton
 * - SignedOut: Shows Sign In / Get Started buttons
 */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        borderBottom: isScrolled
          ? `1px solid var(--nav-border)`
          : "0.1px solid transparent",
        backgroundColor: isScrolled
          ? "var(--nav-bg-scrolled)"
          : "var(--nav-bg)",
        backdropFilter: "blur(12px) saturate(150%)",
        WebkitBackdropFilter: "blur(12px) saturate(150%)",
        transition:
          "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: isScrolled ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-semibold text-foreground">
              TrueHire
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              to="/analyze"
              className={`transition-colors ${
                isActive("/analyze")
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Check Job
            </Link>
            <Link
              to="/safety-tips"
              className={`transition-colors ${
                isActive("/safety-tips")
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Safety Tips
            </Link>

            {/* Show dashboard links when signed in */}
            <SignedIn>
              <Link
                to="/jobs"
                className={`transition-colors ${
                  isActive("/jobs")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Find Jobs
              </Link>
              <Link
                to="/dashboard"
                className={`transition-colors ${
                  isActive("/dashboard")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={`transition-colors ${
                  isActive("/profile")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/settings"
                className={`transition-colors ${
                  isActive("/settings")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Settings
              </Link>
            </SignedIn>

            <Link
              to="/about"
              className={`transition-colors ${
                isActive("/about")
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              About
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" || theme === "system" ? (
                <Sun className="w-5 h-5 text-gray-dark" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </button>

            {/* Auth Buttons - Clerk components */}
            <SignedIn>
              {/* UserButton shows avatar and dropdown with sign out, profile, etc */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonPopoverCard: "shadow-lg border border-border",
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Link to="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/sign-up">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
          </nav>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle - Mobile */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" || theme === "system" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </button>

            {/* UserButton for Mobile (when signed in) */}
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>

            {/* Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground hover:text-blue-600 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-left transition-colors py-2 ${
                  isActive("/")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </Link>
              <Link
                to="/analyze"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-left transition-colors py-2 ${
                  isActive("/analyze")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Check Job
              </Link>
              <Link
                to="/safety-tips"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-left transition-colors py-2 ${
                  isActive("/safety-tips")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Safety Tips
              </Link>

              <SignedIn>
                <Link
                  to="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left transition-colors py-2 ${
                    isActive("/jobs")
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Find Jobs
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left transition-colors py-2 ${
                    isActive("/dashboard")
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left transition-colors py-2 ${
                    isActive("/profile")
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-left transition-colors py-2 ${
                    isActive("/settings")
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Settings
                </Link>
              </SignedIn>

              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-left transition-colors py-2 ${
                  isActive("/about")
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                About
              </Link>

              <SignedOut>
                <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                    Get Started
                  </Button>
                </Link>
              </SignedOut>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
