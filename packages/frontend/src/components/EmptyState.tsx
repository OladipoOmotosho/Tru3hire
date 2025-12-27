import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "compact" | "card";
  className?: string;
}

/**
 * Reusable empty state component for pages with no data
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        variant === "compact" ? "py-8" : "py-16"
      } ${className}`}
    >
      {/* Icon */}
      <div
        className={`rounded-full bg-muted flex items-center justify-center mb-4 ${
          variant === "compact" ? "w-12 h-12" : "w-16 h-16"
        }`}
      >
        <Icon
          className={`text-muted-foreground ${
            variant === "compact" ? "w-6 h-6" : "w-8 h-8"
          }`}
        />
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-foreground mb-2 ${
          variant === "compact" ? "text-lg" : "text-xl"
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`text-muted-foreground max-w-md mb-6 ${
          variant === "compact" ? "text-sm" : ""
        }`}
      >
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={variant === "compact" ? "sm" : "default"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return <Card className="p-6">{content}</Card>;
  }

  return content;
}

/**
 * Coming soon variant for features not yet implemented
 */
interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = "Coming Soon",
  description = "This feature is under development and will be available soon.",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
        <span className="text-2xl">🚀</span>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
