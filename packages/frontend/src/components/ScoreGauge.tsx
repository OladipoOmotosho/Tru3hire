import { useEffect, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface ScoreGaugeProps {
  /** Score value from 0-100 */
  score: number;
  /** Size of the gauge in pixels */
  size?: number;
  /** Stroke width of the arc */
  strokeWidth?: number;
  /** Whether to animate on mount */
  animated?: boolean;
  /** Label below the score */
  label?: string;
  /** Risk level for color coding */
  riskLevel?: "safe" | "caution" | "danger";
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

function getScoreGradient(score: number): [string, string] {
  if (score >= 70) return ["#22c55e", "#16a34a"]; // green gradient
  if (score >= 40) return ["#eab308", "#ca8a04"]; // yellow gradient
  return ["#ef4444", "#dc2626"]; // red gradient
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Caution";
  return "High Risk";
}

function getRiskBadgeStyles(riskLevel: string): {
  bg: string;
  text: string;
  glow: string;
} {
  switch (riskLevel) {
    case "safe":
      return {
        bg: "bg-green-500/20",
        text: "text-green-400",
        glow: "shadow-green-500/20",
      };
    case "caution":
      return {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        glow: "shadow-yellow-500/20",
      };
    case "danger":
      return {
        bg: "bg-red-500/20",
        text: "text-red-400",
        glow: "shadow-red-500/20",
      };
    default:
      return {
        bg: "bg-gray-500/20",
        text: "text-gray-400",
        glow: "shadow-gray-500/20",
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ScoreGauge - Animated circular gauge for displaying TrueScore
 *
 * Features:
 * - Smooth animation on mount
 * - Color-coded based on score (red/yellow/green)
 * - Gradient arc with glow effect
 * - Responsive sizing
 */
export function ScoreGauge({
  score,
  size = 200,
  strokeWidth = 12,
  animated = true,
  label = "TrueScore",
  riskLevel = "safe",
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const [progress, setProgress] = useState(animated ? 0 : score);

  // Animate score on mount
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      setProgress(score);
      return;
    }

    const duration = 1500; // ms
    const startTime = Date.now();
    const startScore = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progressRatio, 3);

      const currentScore = Math.round(
        startScore + (score - startScore) * eased
      );
      const currentProgress = startScore + (score - startScore) * eased;

      setDisplayScore(currentScore);
      setProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  // SVG calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const [gradientStart, gradientEnd] = getScoreGradient(score);
  const scoreLabel = getScoreLabel(score);
  const badgeStyles = getRiskBadgeStyles(riskLevel);

  return (
    <div className="flex flex-col items-center">
      {/* Gauge Container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: getScoreColor(score) }}
        />

        {/* SVG Gauge */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Gradient Definition */}
          <defs>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#glow)"
            className="transition-all duration-300"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-foreground"
            style={{ fontSize: size * 0.25 }}
          >
            {displayScore}
          </span>
          <span
            className="text-muted-foreground font-medium"
            style={{ fontSize: size * 0.08 }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Score Label Badge */}
      <div
        className={`mt-4 px-4 py-1.5 rounded-full font-medium text-sm ${badgeStyles.bg} ${badgeStyles.text} shadow-lg ${badgeStyles.glow}`}
      >
        {scoreLabel}
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { getScoreColor, getScoreLabel, getRiskBadgeStyles };
