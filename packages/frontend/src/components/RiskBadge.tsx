import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export type RiskLevel = "safe" | "caution" | "danger";

interface RiskBadgeProps {
  level: RiskLevel | string; // Validate runtime strings
}

export function RiskBadge({ level }: RiskBadgeProps) {
  // Runtime validation / normalization
  const normalizedLevel: RiskLevel = ["safe", "caution", "danger"].includes(
    level,
  )
    ? (level as RiskLevel)
    : "caution"; // Fallback

  const config = {
    safe: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      label: "Low Risk",
      icon: CheckCircle2,
    },
    caution: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Moderate Risk",
      icon: AlertCircle,
    },
    danger: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      label: "High Risk",
      icon: AlertCircle,
    },
  }[normalizedLevel];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}
