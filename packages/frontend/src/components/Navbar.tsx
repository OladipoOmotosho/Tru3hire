import { Shield, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTheme, toggleTheme } from "../../../../shared/utils/theme";

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
              SafeHire
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
              Analyze Job
            </Link>
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

            {/* Theme Toggle Button - Desktop */}
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

            <Link to="/analyze">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
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
                Analyze Job
              </Link>
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
              <Link to="/analyze" onClick={() => setMobileMenuOpen(false)}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
