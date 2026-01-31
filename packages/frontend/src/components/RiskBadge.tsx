import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface RiskBadgeProps {
  level: string;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config = {
    safe: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      label: "Low Risk",
    },
    caution: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Moderate Risk",
    },
    danger: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      label: "High Risk",
    },
  }[level] || {
    bg: "bg-gray-100 dark:bg-zinc-800",
    text: "text-gray-700 dark:text-zinc-300",
    label: "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      {level === "safe" && <CheckCircle2 className="w-4 h-4" />}
      {level === "caution" && <AlertCircle className="w-4 h-4" />}
      {level === "danger" && <AlertCircle className="w-4 h-4" />}
      {config.label}
    </span>
  );
}
