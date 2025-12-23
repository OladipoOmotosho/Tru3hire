import { Card } from "./ui/card";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface InsightCardProps {
  type: "positive" | "warning" | "tip" | "danger";
  icon?: string;
  message: string;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInsightStyles(type: InsightCardProps["type"]) {
  switch (type) {
    case "positive":
      return {
        bg: "bg-green-500/10 dark:bg-green-500/20 border-green-500/20",
        iconBg: "bg-green-500/20",
        iconColor: "text-green-500",
        Icon: CheckCircle2,
      };
    case "warning":
      return {
        bg: "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/20",
        iconBg: "bg-yellow-500/20",
        iconColor: "text-yellow-500",
        Icon: AlertTriangle,
      };
    case "tip":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-500",
        Icon: Lightbulb,
      };
    case "danger":
      return {
        bg: "bg-red-500/10 dark:bg-red-500/20 border-red-500/20",
        iconBg: "bg-red-500/20",
        iconColor: "text-red-500",
        Icon: AlertCircle,
      };
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * InsightCard - Displays analysis insights with type-based styling
 */
export function InsightCard({
  type,
  icon,
  message,
  className = "",
}: InsightCardProps) {
  const styles = getInsightStyles(type);
  const { Icon } = styles;

  return (
    <Card
      className={`
        p-4 border transition-all duration-200 hover:scale-[1.02]
        ${styles.bg} ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}
        >
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            <Icon className={`w-4 h-4 ${styles.iconColor}`} />
          )}
        </div>

        {/* Message */}
        <p className="text-sm text-foreground leading-relaxed pt-1">
          {message}
        </p>
      </div>
    </Card>
  );
}

// ============================================================================
// Recommendation Card
// ============================================================================

export interface RecommendationCardProps {
  action: string;
  impact: "high" | "medium" | "low";
  className?: string;
}

function getImpactStyles(impact: RecommendationCardProps["impact"]) {
  switch (impact) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

export function RecommendationCard({
  action,
  impact,
  className = "",
}: RecommendationCardProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-muted/50 hover:bg-muted/80 transition-colors
        ${className}
      `}
    >
      <span
        className={`
          text-xs font-bold px-2 py-1 rounded border
          ${getImpactStyles(impact)}
        `}
      >
        {impact.toUpperCase()}
      </span>
      <p className="text-sm text-foreground">{action}</p>
    </div>
  );
}
