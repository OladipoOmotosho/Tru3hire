import { cn, getTrueScoreColor, getTrueScoreBgColor } from "@/lib/utils";

interface TrueScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TrueScoreGauge({
  score,
  size = "md",
  showLabel = true,
  className,
}: TrueScoreGaugeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-20 h-20 text-xl",
    lg: "w-32 h-32 text-3xl",
  };

  const strokeWidth = {
    sm: 3,
    md: 4,
    lg: 6,
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-500",
              getTrueScoreColor(score)
            )}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", getTrueScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600">TrueScore</span>
      )}
    </div>
  );
}
