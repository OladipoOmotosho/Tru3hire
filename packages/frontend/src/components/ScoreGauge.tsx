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
  riskLevel?: "safe" | "caution" | "danger" | "suspicious" | "high-risk";
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green-500
  if (score >= 40) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

function getScoreGradient(score: number): [string, string, string] {
  // 3-stop gradient for more depth
  if (score >= 70) return ["#4ade80", "#22c55e", "#16a34a"]; // green gradient
  if (score >= 40) return ["#fde047", "#eab308", "#ca8a04"]; // yellow gradient
  return ["#f87171", "#ef4444", "#dc2626"]; // red gradient
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
  border: string;
} {
  switch (riskLevel) {
    case "safe":
      return {
        bg: "bg-green-500/10 backdrop-blur-sm",
        text: "text-green-500 dark:text-green-400",
        border: "border border-green-500/20",
      };
    case "caution":
      return {
        bg: "bg-yellow-500/10 backdrop-blur-sm",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border border-yellow-500/20",
      };
    case "suspicious":
      return {
        bg: "bg-orange-500/10 backdrop-blur-sm",
        text: "text-orange-500 dark:text-orange-400",
        border: "border border-orange-500/20",
      };
    case "danger":
    case "high-risk":
      return {
        bg: "bg-red-500/10 backdrop-blur-sm",
        text: "text-red-500 dark:text-red-400",
        border: "border border-red-500/20",
      };
    default:
      return {
        bg: "bg-gray-500/10 backdrop-blur-sm",
        text: "text-gray-500 dark:text-gray-400",
        border: "border border-gray-500/20",
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ScoreGauge - Glassmorphism-style circular gauge for displaying TrueScore
 *
 * Features:
 * - Frosted glass background effect
 * - Smooth animation on mount
 * - Multi-stop gradient arc with soft glow
 * - Refined inner shadow for depth
 */
export function ScoreGauge({
  score,
  size = 200,
  strokeWidth = 14,
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

  const [gradientStart, gradientMid, gradientEnd] = getScoreGradient(score);
  const scoreLabel = getScoreLabel(score);
  const badgeStyles = getRiskBadgeStyles(riskLevel);
  const glowColor = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      {/* Gauge Container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glassmorphism background circle */}
        <div
          className="absolute inset-2 rounded-full bg-white/5 dark:bg-white/[0.03] backdrop-blur-xl"
          style={{
            boxShadow: `
              inset 0 2px 20px rgba(255,255,255,0.1),
              inset 0 -2px 20px rgba(0,0,0,0.1),
              0 4px 24px rgba(0,0,0,0.1)
            `,
          }}
        />

        {/* Inner frosted ring */}
        <div
          className="absolute rounded-full bg-gradient-to-b from-white/10 to-transparent dark:from-white/5"
          style={{
            inset: strokeWidth + 8,
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
          }}
        />

        {/* SVG Gauge */}
        <svg
          width={size}
          height={size}
          className="relative z-10 transform -rotate-90"
        >
          {/* Gradient Definitions */}
          <defs>
            {/* Main arc gradient - 3 stops for depth */}
            <linearGradient
              id="scoreGradientGlass"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={gradientStart} stopOpacity="1" />
              <stop offset="50%" stopColor={gradientMid} stopOpacity="1" />
              <stop offset="100%" stopColor={gradientEnd} stopOpacity="1" />
            </linearGradient>

            {/* Soft glow filter */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Track gradient for subtle depth */}
            <linearGradient
              id="trackGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Background Track - subtle glass effect */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#trackGradient)"
            strokeWidth={strokeWidth}
            className="dark:opacity-50"
          />

          {/* Progress Arc with glow */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#scoreGradientGlass)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#softGlow)"
            className="transition-all duration-300"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          {/* Score number with subtle shadow */}
          <span
            className="font-bold text-foreground drop-shadow-sm"
            style={{
              fontSize: size * 0.28,
              letterSpacing: "-0.02em",
            }}
          >
            {displayScore}
          </span>
          {/* Label */}
          <span
            className="text-muted-foreground font-medium tracking-wide uppercase"
            style={{ fontSize: size * 0.065 }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Score Label Badge - Glassmorphism style */}
      <div
        className={`mt-5 px-5 py-2 rounded-full font-semibold text-sm ${badgeStyles.bg} ${badgeStyles.text} ${badgeStyles.border}`}
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
