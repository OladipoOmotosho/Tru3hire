import { Shield, ArrowRight, CheckCircle2, Star, TrendingUp } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
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
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Actually Want You
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                TrueHire rates job postings by credibility, diversity, and personal fit.
                Get a TrueScore (0-100) for every job showing how worthwhile it is to apply,
                plus insights from real employees and personalized skill recommendations.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Upload Resume & Get Started
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

            {/* Stats/Trust Indicators */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  98%
                </div>
                <div className="text-sm text-muted-foreground">
                  Accuracy Rate
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
                  Job Seekers Helped
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Element */}
          <div className="relative">
            {/* Card with Features */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Decorative linear blob */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-linear-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 rounded-full blur-3xl opacity-20" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-linear-to-br from-pink-400 to-orange-400 dark:from-pink-600 dark:to-orange-600 rounded-full blur-3xl opacity-20" />

              <div className="relative space-y-6">
                <h3 className="text-2xl font-bold">The TrueScore™ Model</h3>

                {/* Feature List */}
                <div className="space-y-4">
                  {[
                    { text: "Authenticity Check", score: "25%" },
                    { text: "Hiring Likelihood", score: "25%" },
                    { text: "Resume Match", score: "25%" },
                    { text: "Bias & Fairness", score: "15%" },
                    { text: "Company Reputation", score: "10%" },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature.text}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {feature.score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* TrueScore Icon */}
                <div className="flex justify-center pt-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
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
