import { Link } from "react-router-dom";
import { PageWrapper } from "../components/PageWrapper";
import {
  Shield,
  Search,
  AlertTriangle,
  Lock,
  DollarSign,
  Building,
  Mail,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/components/ui/utils";

// ============================================================================
// Data
// ============================================================================

const tipCategories = [
  {
    id: "research",
    icon: Search,
    title: "Research the Company",
    description: "Always verify the existence of the company before engaging.",
    tips: [
      "Verify the company on LinkedIn and Glassdoor.",
      "Search for employee profiles to confirm real people work there.",
      "Check provincial business registries.",
      "Look for news articles or press releases.",
      "Verify the job is on the official careers page.",
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Verify Contact Information",
    description: "Scammers often use fake or personal email addresses.",
    tips: [
      "Legitimate employers use @companyname.com domains.",
      "Be wary of Gmail, Yahoo, or Hotmail addresses.",
      "Verify phone numbers and physical addresses.",
      "Check if the recruiter's profile matches the company.",
      "Be suspicious of text-only communication.",
    ],
  },
  {
    id: "payments",
    icon: DollarSign,
    title: "Never Pay to Apply",
    description: "Real jobs pay you. You never pay them.",
    tips: [
      "Real employers never ask for money upfront.",
      "Don't pay for training, background checks, or equipment.",
      "Avoid 'starter kit' purchases.",
      "Never wire money or buy gift cards.",
      "Cheque cashing scams are very common.",
    ],
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Protect Personal Information",
    description: "Your data is valuable. Don't give it away easily.",
    tips: [
      "Never share your SIN before a formal offer.",
      "Don't provide banking details early.",
      "Be cautious with ID documents.",
      "Avoid giving date of birth unless required.",
      "Use a dedicated email for job apps.",
    ],
  },
  {
    id: "red-flags",
    icon: AlertTriangle,
    title: "Watch for Red Flags",
    description: "If it sounds too good to be true, it is.",
    tips: [
      "Unrealistic salary for minimal work.",
      "Vague job descriptions.",
      "Pressure to accept immediately.",
      "Interviews via text/WhatsApp only.",
      "Requests for payment before interview.",
    ],
  },
];

const resources = [
  {
    title: "Canadian Anti-Fraud Centre",
    description: "Report fraud and identity theft.",
    url: "https://www.antifraudcentre-centreantifraude.ca/",
    icon: Shield,
  },
  {
    title: "Better Business Bureau",
    description: "Check business ratings and complaints.",
    url: "https://www.bbb.org/",
    icon: Building,
  },
  {
    title: "Job Bank Canada",
    description: "Official verified government job board.",
    url: "https://www.jobbank.gc.ca/",
    icon: BookOpen,
  },
];

// ============================================================================
// Component
// ============================================================================

const SCROLL_SECTIONS = [
  "introduction",
  ...tipCategories.map((c) => c.id),
  "resources",
];
const LAST_SECTION_ID =
  SCROLL_SECTIONS[SCROLL_SECTIONS.length - 1] ?? "resources";

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: "introduction", label: "Introduction" },
  ...tipCategories.map((c) => ({ id: c.id, label: c.title })),
  { id: "resources", label: "Resources" },
];

function NavButton({
  item,
  activeSection,
  onClick,
  variant = "sidebar",
}: {
  item: NavItem;
  activeSection: string;
  onClick: (id: string) => void;
  variant?: "sidebar" | "toc";
}) {
  const isActive = activeSection === item.id;

  if (variant === "toc") {
    return (
      <button
        onClick={() => onClick(item.id)}
        className={cn(
          "block text-sm text-left transition-colors mb-2 w-full",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {item.label}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(item.id)}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {item.label}
    </button>
  );
}

export function SafetyTipsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const programmaticScrollRef = useRef(false);

  // Handle scroll spy with throttling and bottom-of-page detection
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (programmaticScrollRef.current) return;
      if (rafId != null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const scrollBottom = window.innerHeight + window.scrollY;
        const pageBottom = document.documentElement.scrollHeight - 1;

        if (scrollBottom >= pageBottom) {
          setActiveSection(LAST_SECTION_ID);
          return;
        }

        for (const section of SCROLL_SECTIONS) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= 300) {
              setActiveSection(section);
              return;
            }
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToSection = (id: string) => {
    programmaticScrollRef.current = true;
    const element = document.getElementById(id);

    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      });
      setActiveSection(id);

      // Clear guard after scroll duration (approx 800ms for smooth scroll)
      setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 1000);
    } else {
      programmaticScrollRef.current = false;
    }
  };

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false} maxWidth="full">
      <div className="flex min-h-screen bg-background">
        {/* Left Sidebar - Navigation (Desktop) */}
        <aside className="hidden lg:block w-64 border-r border-border bg-background/95 backdrop-blur-sm fixed top-20 bottom-0 left-0 overflow-y-auto z-40">
          <div className="p-6">
            <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Contents
            </h5>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  activeSection={activeSection}
                  onClick={scrollToSection}
                />
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-border">
              <Link
                to="/analyze"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Search className="w-4 h-4" />
                Analyze a Job
              </Link>{" "}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 xl:pr-64 min-w-0">
          {" "}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
            {/* Introduction */}
            <section id="introduction" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-2 mb-6">
                <span className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Shield className="w-6 h-6" />
                </span>
                <span className="text-sm font-medium text-primary uppercase tracking-widest">
                  Safety Center
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Protect yourself from job scams
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Knowledge is your best defense. Learn how to recognize the
                warning signs and verify the legitimacy of any job opening
                before you apply.
              </p>
            </section>

            <hr className="border-border mb-16" />

            {/* Tip Categories */}
            <div className="space-y-24">
              {tipCategories.map((category) => (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-24"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-muted rounded-xl">
                      <category.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {category.title}
                      </h2>
                      <p className="text-muted-foreground text-lg">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                    <ul className="grid gap-4">
                      {category.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-foreground/80 leading-relaxed">
                            {tip}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </div>

            <hr className="border-border my-16" />

            {/* Resources */}
            <section id="resources" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Official Resources
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-6 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-muted/50 transition-all"
                  >
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      <resource.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-medium mb-1 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-primary font-medium">
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="mt-20 p-8 bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 rounded-2xl text-center">
              {" "}
              <h3 className="text-xl font-bold text-foreground mb-4">
                Found something suspicious?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Help the community by reporting new scam types. Your report
                helps train our AI.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/report-scam"
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Report a Scam
                </Link>
              </div>
            </div>

            {/* Footer space to prevent content being covered */}
            <div className="h-20" />
          </div>
        </main>

        {/* Right Sidebar - On This Page (Desktop XL) */}
        <aside className="hidden xl:block w-64 p-6 fixed top-20 right-0 h-[calc(100vh-80px)] overflow-y-auto">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            On this page
          </h5>
          <div className="space-y-1 border-l border-border pl-4">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                activeSection={activeSection}
                onClick={scrollToSection}
                variant="toc"
              />
            ))}
          </div>
        </aside>
      </div>
    </PageWrapper>
  );
}
