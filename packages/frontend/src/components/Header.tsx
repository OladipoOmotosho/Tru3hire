import { Shield, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface HeaderProps {
  onCheckJob: () => void;
}

export function Header({ onCheckJob }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            <span className="text-xl text-gray-900">SafeHire</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("analyzer")}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Check Job
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              How It Works
            </button>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Resources
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              About
            </a>
            <Button
              onClick={onCheckJob}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("analyzer")}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors py-2"
              >
                Check Job
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors py-2"
              >
                How It Works
              </button>
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
              >
                Resources
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
              >
                About
              </a>
              <Button
                onClick={() => {
                  onCheckJob();
                  setMobileMenuOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                Get Started
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
