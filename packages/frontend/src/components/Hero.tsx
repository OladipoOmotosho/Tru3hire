import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";

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
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                AI-Powered Job Verification
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Protect Yourself from{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Fake Job Scams
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                Every year, thousands of newcomers to Canada fall victim to
                fraudulent job postings. SafeHire uses AI to analyze job offers
                and help you identify scams before it's too late.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Check a Job Posting
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
                  12,400+
                </div>
                <div className="text-sm text-muted-foreground">
                  Safe Jobs Verified
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-600">
                  3,800+
                </div>
                <div className="text-sm text-muted-foreground">
                  Scams Detected
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  25,600+
                </div>
                <div className="text-sm text-muted-foreground">
                  Users Protected
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
                <h3 className="text-2xl font-bold">What We Check For</h3>

                {/* Feature List */}
                <div className="space-y-4">
                  {[
                    "Personal email addresses (not company domains)",
                    "Requests for upfront payments or fees",
                    "Unrealistic salary promises",
                    "Excessive urgency or pressure tactics",
                    "Requests for sensitive personal information",
                    "Vague or missing company details",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Shield Icon */}
                <div className="flex justify-center pt-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
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
