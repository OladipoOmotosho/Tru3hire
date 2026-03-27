import {
  TrendingUp,
  Info,
  ShieldCheck,
  Target,
  UserCheck,
  Building2,
  Clock,
  Search,
  ArrowRight,
  Zap,
  ScanEye,
  Sparkles,
} from "lucide-react";

interface HeroProps {
  onGetStarted: (url?: string) => void;
}

import { Tooltip } from "@/components/ui/tooltip-custom";

// TrueScore breakdown with descriptions
const scoreBreakdown = [
  {
    text: "Your Fit Score",
    score: 30,
    icon: UserCheck,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-600/10 dark:bg-purple-400/10",
    tooltip:
      "Matches your resume with job requirements using AI semantic matching",
  },
  {
    text: "Freshness",
    score: 15,
    icon: Clock,
    color: "text-warning-600 dark:text-warning-400",
    bgColor: "bg-warning-500/10 dark:bg-warning-400/10",
    tooltip:
      "Jobs posted in the last 48 hours get 8x more responses - apply early!",
  },
  {
    text: "Is It Real?",
    score: 25,
    icon: ShieldCheck,
    color: "text-success-600 dark:text-success-400",
    bgColor: "bg-success-500/10 dark:bg-success-400/10",
    tooltip:
      "Detects scam red flags like suspicious requests, fake company info, and unrealistic promises",
  },
  {
    text: "Will They Hire?",
    score: 20,
    icon: Target,
    color: "text-info-600 dark:text-info-400",
    bgColor: "bg-info-500/10 dark:bg-info-400/10",
    tooltip:
      "Analyzes if this is a real hiring effort vs. ghost job or data collection",
  },
  {
    text: "Company Trust",
    score: 10,
    icon: Building2,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-400/10",
    tooltip:
      "Evaluates company credibility based on reviews, age, and online presence",
  },
];

// Value proposition items for the stats section
const valueProps = [
  {
    icon: ScanEye,
    headline: "Catches Known Scam Patterns",
    description:
      "Flags suspicious postings with high confidence by analyzing dozens of fraud indicators in every listing.",
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Zap,
    headline: "Less Researching, More Applying",
    description:
      "Spend less time vetting companies and more time on applications that actually matter to your career.",
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Sparkles,
    headline: "Skills Matched to Real Jobs",
    description:
      "Surfaces opportunities that genuinely align with your experience so you stop applying blind.",
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export function Hero({ onGetStarted }: HeroProps) {

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-background">
      {/* Grid background pattern */}
      <div className="absolute inset-0">
        {/* Base grid */}
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
        {/* Subtle radial gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/80" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
                Stop wasting time on{" "}
                <span className="text-muted-foreground">fake job postings</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                TrueHire's AI centralizes and analyzes job postings to pinpoint
                real opportunities, so you can apply with confidence.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <button
                onClick={() => onGetStarted("/analyze")}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full px-8 py-3.5 transition-colors shadow-lg cursor-pointer"
              >
                Analyze a Job
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Onboarding Note */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg p-3 max-w-md">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
              <p>
                <span className="font-medium text-foreground">
                  Unregistered users
                </span>{" "}
                can check if jobs are real or fake only.{" "}
                <span className="text-primary font-medium">
                  Full TrueScore™
                </span>{" "}
                analysis is only unlocked after onboarding.
              </p>
            </div>

            {/* Platform Compatibility */}
            <div className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground mb-4 tracking-wide uppercase">
                Works with most job boards including:
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
                {[
                  "Job Bank Canada",
                  "Glassdoor",
                  "ZipRecruiter",
                  "Monster",
                  "CareerBuilder",
                  "Hiring Cafe",
                ].map((company) => (
                  <span
                    key={company}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default"
                  >
                    {company}
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                Indeed & LinkedIn require manual copy-paste (anti-bot
                protection)
              </p>
            </div>


          </div>

          {/* Right Column - TrueScore Card */}
          <div
            className="relative flex justify-center lg:justify-end animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            {/* Decorative dotted lines */}
            <div className="absolute -top-8 -left-24 w-48 h-48 border border-dashed border-border rounded-lg rotate-12 opacity-40" />

            {/* Main Card */}
            <div className="relative w-full max-w-md">
              {/* Card glow effect */}
              <div className="absolute -inset-1 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl opacity-50" />

              <div className="relative bg-card backdrop-blur-sm border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          TrueScore™ Breakdown
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          How we rate every job
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        87
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        Very Good
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Items */}
                <div className="p-4 space-y-1">
                  {scoreBreakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors duration-150 group"
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>

                      {/* Text with tooltip */}
                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="text-sm text-foreground/80">
                          {item.text}
                        </span>
                        <Tooltip content={item.tooltip}>
                          <Info className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                        </Tooltip>
                      </div>

                      {/* Weight Badge - Clear indicator this is a weight, not a score */}
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.bgColor} ${item.color}`}
                      >
                        {item.score}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      Higher score = safer to apply
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Props Section - Below Hero */}
        <div className="mt-20 pt-12 border-t border-border">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-8">
            Why TrueHire
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground max-w-3xl leading-snug mb-12">
            TrueHire turns scattered job listings into actionable insights that
            protect your time and energy.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => {
              const Icon = prop.icon;
              return (
                <div key={index} className="group space-y-4">
                  <div
                    className={`inline-flex p-3 rounded-xl ${prop.bgColor} border border-transparent group-hover:border-current/10 transition-all duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-6 h-6 ${prop.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {prop.headline}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
