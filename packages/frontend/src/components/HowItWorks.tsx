import { FileText, Brain, ShieldCheck, TrendingUp } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Submit Job Posting",
      description:
        "Copy and paste the job description, email, or any job-related text you want to verify.",
      color: "blue",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description:
        "Our AI analyzes the text using pattern recognition and rule-based logic to detect suspicious elements.",
      color: "purple",
    },
    {
      icon: ShieldCheck,
      title: "Get Trust Score",
      description:
        "Receive an instant Trust Score (0-100) with clear explanations of any red flags detected.",
      color: "green",
    },
    {
      icon: TrendingUp,
      title: "Make Informed Decisions",
      description:
        "Use the insights to decide whether to proceed, research further, or avoid the opportunity entirely.",
      color: "orange",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
        dot: "bg-blue-600 dark:bg-blue-400",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-600 dark:text-purple-400",
        dot: "bg-purple-600 dark:bg-purple-400",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-600 dark:text-green-400",
        dot: "bg-green-600 dark:bg-green-400",
      },
      orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-200 dark:border-orange-800",
        icon: "text-orange-600 dark:text-orange-400",
        dot: "bg-orange-600 dark:bg-orange-400",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How SafeHire Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered system combines pattern recognition with expert
            knowledge of employment scams to protect you in seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colors = getColorClasses(step.color);

            return (
              <div
                key={index}
                className="relative group hover:scale-105 transition-transform duration-300"
              >
                {/* Connecting Line (hidden on mobile, shown on larger screens) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border z-0" />
                )}

                {/* Card */}
                <div className="relative bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm hover:shadow-lg transition-shadow h-full">
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                  >
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress Dots */}
                  <div className="flex gap-1.5 pt-2">
                    {steps.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`h-1.5 rounded-full transition-all ${
                          dotIndex === index
                            ? `w-8 ${colors.dot}`
                            : "w-1.5 bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted rounded-full">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">
              Analysis takes less than 5 seconds
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
