import { Link } from "react-router-dom";
import { Mail, Github, Twitter, ArrowRight } from "lucide-react";
import TruehireLogo from "../assets/svg/TruehireLogo.svg";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Check Job Posting", href: "#analyzer" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Safety Tips", href: "/safety-tips", isRoute: true },
    { label: "Report Scam", href: "/report-scam", isRoute: true },
  ];

  const resources = [
    { label: "About Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact", href: "#" },
  ];

  return (
    <footer className="relative bg-background overflow-hidden">
      {/* Grid background pattern */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Featured CTA Card */}
          <div className="mb-16 p-6 bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to protect your job search?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Check any job posting in seconds — completely free.
                </p>
              </div>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium hover:opacity-90 transition-colors shrink-0"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-0 mb-4">
                <img
                  src={TruehireLogo}
                  alt="TrueHire"
                  className="h-[60px] w-auto opacity-90"
                />
                <div className="flex flex-col leading-tight -ml-3">
                  <span className="text-lg font-bold text-foreground">
                    TrueHire
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                    Guiding newcomers to real opportunities
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Protecting newcomers from employment scams with AI-powered job
                posting verification. Free, fast, and confidential.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Resources
              </h4>
              <ul className="space-y-3">
                {resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
              <p>
                © {currentYear} TrueHire. Built to protect newcomers to Canada.
              </p>
              <p>
                This tool provides guidance only. Always conduct independent
                research.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
