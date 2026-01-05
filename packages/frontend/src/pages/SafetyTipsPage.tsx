import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageWrapper } from "../components/PageWrapper";
import {
  Shield,
  Search,
  AlertTriangle,
  Lock,
  DollarSign,
  Clock,
  Users,
  Building,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  BookOpen,
  Lightbulb,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface TipCategory {
  icon: React.ReactNode;
  title: string;
  tips: string[];
}

interface Resource {
  icon: React.ReactNode;
  title: string;
  description: string;
  url: string;
}

// ============================================================================
// Data
// ============================================================================

const tipCategories: TipCategory[] = [
  {
    icon: <Search className="w-6 h-6" />,
    title: "Research the Company",
    tips: [
      "Verify the company exists on LinkedIn, Glassdoor, and their official website",
      "Search for employee profiles to confirm real people work there",
      "Check the company's registration with provincial business registries",
      "Look for news articles or press releases about the company",
      "Verify the job is posted on the company's official careers page",
    ],
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Verify Contact Information",
    tips: [
      "Legitimate employers use company email addresses (@companyname.com)",
      "Be wary of Gmail, Yahoo, Hotmail, or other personal email services",
      "Verify phone numbers and physical addresses are real",
      "Check if the recruiter's LinkedIn profile matches the company",
      "Be suspicious if they only communicate via text or chat apps",
    ],
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Never Pay to Apply",
    tips: [
      "Real employers never ask for money upfront for any reason",
      "Don't pay for training, background checks, or equipment",
      "Avoid jobs requiring you to purchase starter kits or inventory",
      "Never wire money or buy gift cards for an employer",
      "If asked to deposit a cheque and send money back, it's a scam",
    ],
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Protect Personal Information",
    tips: [
      "Never share your SIN before receiving a formal written offer",
      "Don't provide banking details until you've started working",
      "Be cautious about sharing ID documents early in the process",
      "Avoid giving your date of birth before it's legally required",
      "Use a separate email address for job applications if possible",
    ],
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: "Watch for Red Flags",
    tips: [
      "Unrealistic salary for minimal work is a major warning sign",
      "Vague job descriptions with no specific responsibilities",
      "Pressure to accept immediately or 'limited time' offers",
      "Interviews conducted only via text or instant messaging",
      "Requests for payment or personal info before any interview",
    ],
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Trust the Process",
    tips: [
      "Legitimate hiring takes time - be suspicious of instant offers",
      "Real jobs have multiple interview stages and proper onboarding",
      "Take your time to research, even if they pressure you",
      "Trust your instincts - if something feels wrong, it probably is",
      "It's okay to ask for time to consider an offer",
    ],
  },
];

const resources: Resource[] = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Canadian Anti-Fraud Centre",
    description:
      "Official government resource for reporting and learning about fraud in Canada",
    url: "https://www.antifraudcentre-centreantifraude.ca/",
  },
  {
    icon: <Building className="w-5 h-5" />,
    title: "Better Business Bureau",
    description:
      "Check business ratings and file complaints about suspicious companies",
    url: "https://www.bbb.org/",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Settlement Services",
    description:
      "Find local newcomer support organizations within your vicinity",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/newcomer-organizations.html",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Job Bank Canada",
    description: "Official government job board with verified job postings",
    url: "https://www.jobbank.gc.ca/",
  },
];

const doList = [
  "Research the company thoroughly before applying",
  "Use official job boards and company websites",
  "Verify the recruiter's identity on LinkedIn",
  "Ask for written job offers before sharing personal info",
  "Report suspicious postings to protect others",
];

const dontList = [
  "Pay money for job applications or training",
  "Share SIN, banking, or passport details early",
  "Accept jobs without proper interviews",
  "Respond to unsolicited job offers via text/WhatsApp",
  "Feel pressured into making quick decisions",
];

// ============================================================================
// Component
// ============================================================================

export function SafetyTipsPage() {
  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      {/* Hero Section - Clean Design with Illustration */}
      <div className="relative overflow-hidden pt-24 pb-16 bg-linear-to-b from-blue-50 to-background dark:from-slate-900 dark:to-background">
        {/* Subtle decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-teal-200/30 dark:bg-teal-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full mb-6">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Protect Yourself from Scams
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Job Search{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    Safety Tips
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                  Knowledge is your best defense against employment scams. Learn
                  to recognize warning signs and protect yourself during your
                  job search in Canada.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/analyze">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Search className="w-4 h-4 mr-2" />
                      Check a Job Posting
                    </Button>
                  </Link>
                  <Link to="/report-scam">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report a Scam
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Illustration */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  {/* Large Shield Icon as Hero Illustration */}
                  <div className="w-80 h-80 bg-linear-to-br from-blue-100 to-teal-100 dark:from-blue-900/30 dark:to-teal-900/30 rounded-3xl flex items-center justify-center shadow-xl">
                    <Shield
                      className="w-40 h-40 text-blue-500"
                      strokeWidth={1}
                    />
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="absolute top-1/2 -right-8 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shadow-md">
                    <Lock className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Do's and Don'ts Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Quick Reference Guide
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-green-500/30 bg-green-500/5">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Do This
                </h3>
                <ul className="space-y-3">
                  {doList.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6 border-red-500/30 bg-red-500/5">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Avoid This
                </h3>
                <ul className="space-y-3">
                  {dontList.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>

          {/* Detailed Tips Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Detailed Safety Tips
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tipCategories.map((category, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold">{category.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          {/* Resources Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Helpful Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {resources.map((resource, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-2">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {resource.description}
                      </p>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="p-8 bg-linear-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <Lightbulb className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">
                Found a Suspicious Job Posting?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Help protect others by reporting suspicious job postings. Your
                vigilance helps us improve our AI detection system which further
                enables us to disseminate the necessary information regarding
                emerging scam tactics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/analyze">
                  <Button size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Analyze a Job
                  </Button>
                </Link>
                <Link to="/report-scam">
                  <Button size="lg" variant="outline">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report a Scam
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
