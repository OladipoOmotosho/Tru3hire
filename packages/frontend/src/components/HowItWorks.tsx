import { useState } from "react";
import { FileText, Brain, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: FileText,
    title: "Submit Job Posting",
    description: "Copy and paste the job description you would like to verify.",
    color: "blue",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description:
      "Our platform analyzes the provided text using pattern recognition and rule-based logic to detect suspicious elements",
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
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "text-blue-500 dark:text-blue-400",
      dot: "bg-blue-500",
      glow: "shadow-blue-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: "text-purple-500 dark:text-purple-400",
      dot: "bg-purple-500",
      glow: "shadow-purple-500/20",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-500 dark:text-emerald-400",
      dot: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
    },
    orange: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      icon: "text-orange-500 dark:text-orange-400",
      dot: "bg-orange-500",
      glow: "shadow-orange-500/20",
    },
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

interface HowItWorksProps {
  className?: string;
}

export function HowItWorks({ className }: HowItWorksProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Get the color for dots based on which card is hovered
  const getDotColor = (cardIndex: number, dotIndex: number) => {
    const isThisCardHovered = hoveredIndex === cardIndex;

    if (isThisCardHovered && dotIndex === cardIndex) {
      return getColorClasses(steps[cardIndex].color).dot;
    }

    return "bg-zinc-300 dark:bg-zinc-700";
  };

  // Get the width for dots - expand to dash only when hovered
  const getDotWidth = (cardIndex: number, dotIndex: number) => {
    const isThisCardHovered = hoveredIndex === cardIndex;

    if (isThisCardHovered && dotIndex === cardIndex) {
      return "w-8";
    }

    return "w-1.5";
  };

  return (
    <section
      id="how-it-works"
      className={cn(
        "relative py-24 px-4 bg-zinc-50 dark:bg-zinc-950 overflow-hidden",
        className,
      )}
    >
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
            [01] Process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How TrueHire Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI combines pattern recognition with fraud indicators to protect
            you instantly.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const colors = getColorClasses(step.color);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className={cn(
                  "relative group transition-transform duration-300 hover:scale-105",
                  isHovered && "scale-105",
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Dashed Connecting Line (hidden on mobile, shown on larger screens) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] border-t border-dashed border-zinc-300 dark:border-zinc-700 z-0" />
                )}

                {/* Card */}
                <div
                  className={`relative bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 transition-all duration-300 h-full ${
                    isHovered
                      ? `shadow-xl ${colors.glow} border-zinc-300 dark:border-zinc-700`
                      : "hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-md">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 rounded-xl ${colors.bg} border ${colors.border} transition-transform duration-300 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground font-display">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress Dots - Animated on hover */}
                  <div className="flex gap-1.5 pt-2">
                    {steps.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`h-1.5 rounded-full transition-all duration-300 ease-out ${getDotWidth(
                          index,
                          dotIndex,
                        )} ${getDotColor(index, dotIndex)}`}
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
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-full backdrop-blur-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm font-medium text-muted-foreground">
              Analysis takes less than 5 seconds
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
