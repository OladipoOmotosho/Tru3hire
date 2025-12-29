import { useState } from "react";
import {
  Shield,
  ArrowRight,
  TrendingUp,
  Info,
  ShieldCheck,
  Target,
  UserCheck,
  Scale,
  Building2,
  Star,
} from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

// TrueScore breakdown with descriptions
const scoreBreakdown = [
  {
    text: "Is It Real?",
    score: 25,
    icon: ShieldCheck,
    bgGradient: "from-green-500 to-emerald-600",
    badgeBg: "bg-green-100 dark:bg-green-900/30",
    badgeText: "text-green-700 dark:text-green-400",
    tooltip:
      "Detects scam red flags like suspicious requests, fake company info, and unrealistic promises",
  },
  {
    text: "Will They Hire?",
    score: 25,
    icon: Target,
    bgGradient: "from-blue-500 to-indigo-600",
    badgeBg: "bg-blue-100 dark:bg-blue-900/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    tooltip:
      "Analyzes if this is a real hiring effort vs. ghost job or data collection",
  },
  {
    text: "Your Fit Score",
    score: 25,
    icon: UserCheck,
    bgGradient: "from-purple-500 to-violet-600",
    badgeBg: "bg-purple-100 dark:bg-purple-900/30",
    badgeText: "text-purple-700 dark:text-purple-400",
    tooltip: "Matches your skills and experience with the job requirements",
  },
  {
    text: "Fair & Inclusive",
    score: 15,
    icon: Scale,
    bgGradient: "from-amber-500 to-orange-600",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
    tooltip:
      "Checks for biased language, unreasonable requirements, or discriminatory patterns",
  },
  {
    text: "Company Trust",
    score: 10,
    icon: Building2,
    bgGradient: "from-cyan-500 to-teal-600",
    badgeBg: "bg-cyan-100 dark:bg-cyan-900/30",
    badgeText: "text-cyan-700 dark:text-cyan-400",
    tooltip:
      "Evaluates company credibility based on reviews, age, and online presence",
  },
];

// Tooltip component
function Tooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 w-56 p-3 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg -top-2 left-full ml-2 transform">
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -left-1 top-4" />
          {content}
        </div>
      )}
    </div>
  );
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                AI-Powered Job Intelligence
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Find Real Jobs That{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Actually Want You
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                TrueHire rates job postings on a 0-100 scale. See instantly if a
                job is legit, if you're a good fit, and if the company is worth
                your time.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Check a Job Posting - Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-border hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium shadow transition-all duration-300"
              >
                Learn How It Works
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              No signup required. Get instant results in under 10 seconds.
            </p>

            {/* Stats/Trust Indicators */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  98%
                </div>
                <div className="text-sm text-muted-foreground">
                  Scam Detection Rate
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  50K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Jobs Analyzed
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  15K+
                </div>
                <div className="text-sm text-muted-foreground">
                  Users Protected
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - TrueScore Card */}
          <div className="relative">
            {/* Decorative blobs */}
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div
              className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-br from-pink-400 to-orange-400 dark:from-pink-600 dark:to-orange-600 rounded-full blur-3xl opacity-20 animate-pulse"
              style={{ animationDelay: "1s" }}
            />

            {/* Main Card */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">TrueScore™ Breakdown</h3>
                    <p className="text-blue-100 text-sm mt-1">
                      How we rate every job posting
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Score Items */}
              <div className="p-6 space-y-3">
                {scoreBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
                  >
                    {/* Icon */}
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${item.bgGradient} shadow-sm`}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Text with tooltip */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{item.text}</span>
                      <Tooltip content={item.tooltip}>
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                      </Tooltip>
                    </div>

                    {/* Percentage badge */}
                    <span
                      className={`text-sm font-bold px-2.5 py-1 rounded-full ${item.badgeBg} ${item.badgeText}`}
                    >
                      {item.score}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-xl">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Scores add up to 100 — the higher, the safer to apply
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
