import { Shield, Mail, Github, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
                <span className="text-foreground text-lg">SafeHire</span>
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
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Safety Tips
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-blue-400 transition-colors text-muted-foreground"
                  >
                    Report Scam
                  </a>
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
                © {currentYear} SafeHire. Built to protect newcomers to Canada.
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
