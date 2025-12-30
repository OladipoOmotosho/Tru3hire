import { Card } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { LucideIcon, Info } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface MetricCardProps {
  /** The metric label (e.g., "Authenticity", "Resume Match") */
  label: string;
  /** The metric score from 0-100 */
  score: number;
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Tooltip description explaining what this metric measures */
  tooltip: string;
  /** Optional: Custom color override (otherwise uses score-based coloring) */
  colorOverride?: "green" | "yellow" | "red" | "blue" | "purple";
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color classes based on score
 */
function getScoreColors(
  score: number,
  colorOverride?: MetricCardProps["colorOverride"]
) {
  if (colorOverride) {
    const colorMap = {
      green: {
        bg: "bg-green-500/10 dark:bg-green-500/20",
        text: "text-green-600 dark:text-green-400",
        progress: "bg-green-500",
        border: "border-green-500/20",
      },
      yellow: {
        bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
        text: "text-yellow-600 dark:text-yellow-400",
        progress: "bg-yellow-500",
        border: "border-yellow-500/20",
      },
      red: {
        bg: "bg-red-500/10 dark:bg-red-500/20",
        text: "text-red-600 dark:text-red-400",
        progress: "bg-red-500",
        border: "border-red-500/20",
      },
      blue: {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        progress: "bg-blue-500",
        border: "border-blue-500/20",
      },
      purple: {
        bg: "bg-purple-500/10 dark:bg-purple-500/20",
        text: "text-purple-600 dark:text-purple-400",
        progress: "bg-purple-500",
        border: "border-purple-500/20",
      },
    };
    return colorMap[colorOverride];
  }

  // Score-based coloring
  if (score >= 70) {
    return {
      bg: "bg-green-500/10 dark:bg-green-500/20",
      text: "text-green-600 dark:text-green-400",
      progress: "bg-green-500",
      border: "border-green-500/20",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
      text: "text-yellow-600 dark:text-yellow-400",
      progress: "bg-yellow-500",
      border: "border-yellow-500/20",
    };
  }
  return {
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    progress: "bg-red-500",
    border: "border-red-500/20",
  };
}

/**
 * Get a qualitative label for the score
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Critical";
}

// ============================================================================
// Component
// ============================================================================

/**
 * MetricCard - Displays an individual TrueScore metric
 *
 * Used in the Results Dashboard to show the breakdown of the 4 TrueScore dimensions:
 * - Authenticity (30%)
 * - Hiring Likelihood (30%)
 * - Resume Match (30%)
 * - Company Reputation (10%)
 */
export function MetricCard({
  label,
  score,
  icon: Icon,
  tooltip,
  colorOverride,
}: MetricCardProps) {
  const colors = getScoreColors(score, colorOverride);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card
      className={`p-4 md:p-5 ${colors.border} bg-card hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with label and tooltip */}
          <div className="flex items-center gap-1.5 mb-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {label}
            </h4>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`More info about ${label}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs text-sm"
                  sideOffset={5}
                >
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Score display */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className={`text-xs font-medium ${colors.text} ml-auto`}>
              {scoreLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Preset Metric Cards (for convenience)
// ============================================================================

import {
  ShieldCheck,
  TrendingUp,
  FileSearch,
  Scale,
  Building2,
} from "lucide-react";

export const METRIC_CONFIGS = {
  authenticity: {
    label: "Authenticity",
    icon: ShieldCheck,
    tooltip:
      "Measures how likely the job posting is legitimate based on our fake job detection model. Higher scores indicate lower fraud risk.",
  },
  hiringLikelihood: {
    label: "Hiring Likelihood",
    icon: TrendingUp,
    tooltip:
      "Estimates whether the employer is actively hiring based on posting recency, engagement signals, and urgency language.",
  },
  resumeMatch: {
    label: "Resume Match",
    icon: FileSearch,
    tooltip:
      "Semantic similarity between your resume and the job description. Higher scores mean better alignment with your skills.",
  },
  companyReputation: {
    label: "Company Reputation",
    icon: Building2,
    tooltip:
      "Aggregated sentiment from employee reviews and online mentions. Based on Glassdoor ratings and social signals.",
  },
} as const;

export type MetricType = keyof typeof METRIC_CONFIGS;
