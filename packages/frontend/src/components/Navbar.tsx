import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTheme, toggleTheme } from "../../../../shared/utils/theme";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import TruehireLogo from "../assets/svg/TruehireLogo.svg";

/**
 * Navbar - Floating Island Design (Light/Dark Mode)
 *
 * Implements a modern "floating pill" style:
 * - Centered, fixed position with rounded corners
 * - Glassmorphic background adapts to theme
 * - Compact height for sleek look
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
      <div
        className={`flex items-center justify-between h-14 px-4 sm:px-6 rounded-full border transition-colors duration-300 ${
          theme === "dark"
            ? "bg-zinc-900/80 border-white/10 backdrop-blur-xl shadow-lg"
            : "bg-white/80 border-zinc-200/50 backdrop-blur-xl shadow-sm shadow-zinc-200/30"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img
            src={TruehireLogo}
            alt="TrueHire"
            className="h-8 w-auto transition-transform group-hover:scale-105"
          />
          <span
            className={`hidden sm:block text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-zinc-900"
            }`}
          >
            TrueHire
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive("/")
                ? theme === "dark"
                  ? "text-white bg-white/10"
                  : "text-zinc-900 bg-zinc-100"
                : theme === "dark"
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
            }`}
          >
            Home
          </Link>
          <Link
            to="/analyze"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive("/analyze")
                ? theme === "dark"
                  ? "text-white bg-white/10"
                  : "text-zinc-900 bg-zinc-100"
                : theme === "dark"
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
            }`}
          >
            Check Job
          </Link>
          <Link
            to="/safety-tips"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive("/safety-tips")
                ? theme === "dark"
                  ? "text-white bg-white/10"
                  : "text-zinc-900 bg-zinc-100"
                : theme === "dark"
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
            }`}
          >
            Safety Tips
          </Link>
          <Link
            to="/about"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive("/about")
                ? theme === "dark"
                  ? "text-white bg-white/10"
                  : "text-zinc-900 bg-zinc-100"
                : theme === "dark"
                  ? "text-zinc-400 hover:text-white hover:bg-white/5"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
            }`}
          >
            About
          </Link>

          <SignedIn>
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive("/dashboard")
                  ? theme === "dark"
                    ? "text-white bg-white/10"
                    : "text-zinc-900 bg-zinc-100"
                  : theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive("/profile")
                  ? theme === "dark"
                    ? "text-white bg-white/10"
                    : "text-zinc-900 bg-zinc-100"
                  : theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive("/settings")
                  ? theme === "dark"
                    ? "text-white bg-white/10"
                    : "text-zinc-900 bg-zinc-100"
                  : theme === "dark"
                    ? "text-zinc-400 hover:text-white hover:bg-white/5"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
              }`}
            >
              Settings
            </Link>
          </SignedIn>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className={`p-2 rounded-full transition-all ${
              theme === "dark"
                ? "text-zinc-400 hover:text-white hover:bg-white/10"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
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
                    avatarBox: `w-8 h-8 rounded-full ring-2 ${
                      theme === "dark" ? "ring-white/10" : "ring-zinc-200"
                    }`,
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link
                to="/sign-in"
                className={`hidden sm:block px-4 py-2 text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "text-white hover:text-zinc-300"
                    : "text-zinc-700 hover:text-zinc-900"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Get Started
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={`md:hidden p-2 transition-colors ${
              theme === "dark"
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
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
        <div
          className={`mt-2 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl md:hidden ${
            theme === "dark"
              ? "bg-zinc-900/95 border-white/10"
              : "bg-white/95 border-zinc-200"
          }`}
        >
          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                isActive("/")
                  ? theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-zinc-100 text-zinc-900"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Home
            </Link>
            <Link
              to="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                isActive("/analyze")
                  ? theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-zinc-100 text-zinc-900"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Check Job
            </Link>
            <Link
              to="/safety-tips"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                isActive("/safety-tips")
                  ? theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-zinc-100 text-zinc-900"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Safety Tips
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                isActive("/about")
                  ? theme === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-zinc-100 text-zinc-900"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              About
            </Link>

            <SignedIn>
              <div
                className={`h-px my-2 ${
                  theme === "dark" ? "bg-white/10" : "bg-zinc-200"
                }`}
              />
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? theme === "dark"
                      ? "bg-white/10 text-white"
                      : "bg-zinc-100 text-zinc-900"
                    : theme === "dark"
                      ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/profile")
                    ? theme === "dark"
                      ? "bg-white/10 text-white"
                      : "bg-zinc-100 text-zinc-900"
                    : theme === "dark"
                      ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/settings")
                    ? theme === "dark"
                      ? "bg-white/10 text-white"
                      : "bg-zinc-100 text-zinc-900"
                    : theme === "dark"
                      ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                Settings
              </Link>
            </SignedIn>

            <SignedOut>
              <div
                className={`h-px my-2 ${
                  theme === "dark" ? "bg-white/10" : "bg-zinc-200"
                }`}
              />
              <Link
                to="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full p-3 rounded-xl text-sm font-medium transition-colors text-left ${
                  theme === "dark"
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                Sign In
              </Link>
            </SignedOut>
          </nav>
        </div>
      )}
    </header>
  );
}
