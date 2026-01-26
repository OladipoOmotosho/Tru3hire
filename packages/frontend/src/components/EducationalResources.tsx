import {
  BookOpen,
  Users,
  Lightbulb,
  ExternalLink,
  AlertTriangle,
  Shield,
  Search,
  Mail,
  DollarSign,
  Star,
  Lock,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export function EducationalResources() {
  const tips = [
    {
      title: "Research the Company",
      description:
        "Always verify the existence of the company. Check their official website, LinkedIn page, as well as online reviews.",
      icon: Search,
      size: "large",
    },
    {
      title: "Verify Contact Info",
      description:
        "Legitimate employers use company email addresses (@companyname.com), not Gmail or Yahoo.",
      icon: Mail,
      size: "small",
    },
    {
      title: "Never Pay to Apply",
      description:
        "Real employers never ask for money upfront for applications, training, or equipment.",
      icon: DollarSign,
      size: "small",
    },
    {
      title: "Watch for Unrealistic Promises",
      description:
        "Be skeptical of jobs offering very high pay for minimal work or 'get rich quick' opportunities.",
      icon: Star,
      size: "medium",
    },
    {
      title: "Protect Personal Info",
      description:
        "Never share your SIN, banking details, or passport before receiving a formal job offer.",
      icon: Lock,
      size: "medium",
    },
    {
      title: "Trust Your Instincts",
      description:
        "If something feels off or too good to be true, it probably is. Take your time.",
      icon: Heart,
      size: "small",
    },
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Canadian Anti-Fraud Centre",
      description:
        "Official resource for reporting and learning about fraud in Canada",
      link: "https://antifraudcentre-centreantifraude.ca/index-eng.htm",
    },
    {
      icon: Users,
      title: "Settlement Services",
      description: "Find local newcomer support organizations in your area",
      link: "https://ircc.canada.ca/english/newcomers/services/index.asp",
    },
    {
      icon: Lightbulb,
      title: "Job Search Guide",
      description: "Learn about the Canadian job market and hiring practices",
      link: "https://www.jobbank.gc.ca/findajob/newcomers",
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-zinc-50 dark:bg-[#09090B] overflow-hidden">
      {/* Grid background pattern */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          {/* Numbered Label */}
          <p className="text-xs text-blue-600 dark:text-blue-400 tracking-widest uppercase font-mono">
            [03] Protect Yourself
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Quick Tips to Stay Safe
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Knowledge is your best defense against employment scams. Learn to
            recognize warning signs and make safer job search decisions.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            const isLarge = tip.size === "large";
            const isMedium = tip.size === "medium";

            return (
              <div
                key={index}
                className={`group relative bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-lg ${
                  isLarge ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""
                } ${isMedium ? "md:col-span-1" : ""}`}
              >
                {/* Icon */}
                <div className="inline-flex p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>

                {/* Content */}
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {tip.title}
                </h4>
                <p
                  className={`text-sm text-muted-foreground leading-relaxed ${isLarge ? "md:text-base" : ""}`}
                >
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Resources Section */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            Helpful Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <a
                  key={index}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    <Icon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/50 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Report Scam CTA */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent" />

          {/* Content */}
          <div className="relative p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon */}
                <div className="shrink-0">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-white">
                    Found a Scam?
                  </h3>
                  <p className="text-white/90 text-sm md:text-base mb-6">
                    Help protect others by reporting suspicious job postings.
                    Your vigilance helps us improve our AI detection system.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Link
                      to="/report-scam"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-white/90 transition-colors shadow-lg"
                    >
                      <Shield className="w-4 h-4" />
                      Report a Scam
                    </Link>
                    <Link
                      to="/safety-tips"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-full font-medium hover:bg-white/20 backdrop-blur-sm transition-colors"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
