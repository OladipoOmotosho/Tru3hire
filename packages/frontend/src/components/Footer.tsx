import { Link } from "react-router-dom";
import { Mail, Github, Twitter } from "lucide-react";
import TruehireLogo from "../assets/svg/TruehireLogo.svg";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-0 mb-4">
                <img
                  src={TruehireLogo}
                  alt="TrueHire"
                  className="h-[70px] w-auto"
                />
                <div className="flex flex-col leading-tight -ml-4">
                  <span className="text-base font-bold tracking-tight bg-linear-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                    TrueHire
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 font-medium tracking-wide uppercase">
                    Guiding newcomers to real opportunities
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Protecting newcomers from employment scams with AI-powered job
                posting verification. Free, fast, and confidential.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#analyzer"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Check Job Posting
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <Link
                    to="/safety-tips"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Safety Tips
                  </Link>
                </li>
                <li>
                  <Link
                    to="/report-scam"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Report Scam
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>
                © {currentYear} TrueHire. Built to protect newcomers to Canada.
              </p>
              <p className="text-xs">
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
