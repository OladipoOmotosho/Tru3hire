import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTheme, toggleTheme } from "../../../../shared/utils/theme";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import TruehireLogo from "../assets/svg/TruehireLogo.svg";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  mobile?: boolean;
}

function NavLink({
  to,
  children,
  isActive,
  onClick,
  mobile = false,
}: NavLinkProps) {
  const baseClass = mobile
    ? "block w-full p-3 rounded-xl text-sm font-medium transition-colors text-left"
    : "px-4 py-2 rounded-full text-sm font-medium transition-all";

  const activeClass =
    "text-primary bg-primary/10 dark:bg-primary/20 font-semibold";
  const inactiveClass =
    "text-muted-foreground hover:text-foreground hover:bg-muted/50";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {children}
    </Link>
  );
}

/**
 * Navbar - Floating Island Design (Light/Dark Mode)
 */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300 ${
        isScrolled ? "scale-[0.98]" : "scale-100"
      }`}
    >
      <div className="flex items-center justify-between h-12 px-4 sm:px-6 rounded-full border transition-colors duration-300 bg-background/80 border-border/50 backdrop-blur-xl shadow-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={TruehireLogo}
            alt="TrueHire"
            className="h-8 w-auto transition-transform group-hover:scale-105"
          />
          <span className="hidden sm:block text-lg font-bold text-foreground">
            TrueHire
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" isActive={isActive("/")}>
            Home
          </NavLink>
          <SignedIn>
            <NavLink to="/dashboard" isActive={isActive("/dashboard")}>
              Dashboard
            </NavLink>
            <NavLink to="/jobs" isActive={isActive("/jobs")}>
              Find Jobs
            </NavLink>
            <NavLink to="/applications" isActive={isActive("/applications")}>
              Applications
            </NavLink>
            <NavLink to="/profile" isActive={isActive("/profile")}>
              Profile
            </NavLink>
          </SignedIn>
          <SignedOut>
            <NavLink to="/analyze" isActive={isActive("/analyze")}>
              Check Job
            </NavLink>
            <NavLink to="/safety-tips" isActive={isActive("/safety-tips")}>
              Safety Tips
            </NavLink>
            <NavLink to="/about" isActive={isActive("/about")}>
              About
            </NavLink>
          </SignedOut>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-full transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox:
                      "w-8 h-8 rounded-full ring-2 ring-background border border-border",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link
                to="/sign-in"
                className="hidden sm:block px-4 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden p-2 transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mt-2 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl md:hidden bg-background/95 border-border">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              isActive={isActive("/")}
              onClick={() => setMobileMenuOpen(false)}
              mobile
            >
              Home
            </NavLink>
            <NavLink
              to="/analyze"
              isActive={isActive("/analyze")}
              onClick={() => setMobileMenuOpen(false)}
              mobile
            >
              Check Job
            </NavLink>
            <NavLink
              to="/safety-tips"
              isActive={isActive("/safety-tips")}
              onClick={() => setMobileMenuOpen(false)}
              mobile
            >
              Safety Tips
            </NavLink>
            <NavLink
              to="/about"
              isActive={isActive("/about")}
              onClick={() => setMobileMenuOpen(false)}
              mobile
            >
              About
            </NavLink>

            <SignedIn>
              <div className="h-px my-2 bg-border" />
              <NavLink
                to="/dashboard"
                isActive={isActive("/dashboard")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/jobs"
                isActive={isActive("/jobs")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Find Jobs
              </NavLink>
              <NavLink
                to="/applications"
                isActive={isActive("/applications")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Applications
              </NavLink>
              <NavLink
                to="/profile"
                isActive={isActive("/profile")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Profile
              </NavLink>
              <NavLink
                to="/settings"
                isActive={isActive("/settings")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Settings
              </NavLink>
            </SignedIn>

            <SignedOut>
              <div className="h-px my-2 bg-border" />
              <NavLink
                to="/sign-in"
                isActive={isActive("/sign-in")}
                onClick={() => setMobileMenuOpen(false)}
                mobile
              >
                Sign In
              </NavLink>
            </SignedOut>
          </nav>
        </div>
      )}
    </header>
  );
}
