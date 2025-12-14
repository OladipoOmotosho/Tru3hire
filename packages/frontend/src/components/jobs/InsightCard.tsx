import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TrendingUp } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
  type?: "info" | "success" | "warning" | "trend";
  className?: string;
}

export function InsightCard({
  title,
  description,
  type = "info",
  className,
}: InsightCardProps) {
  const iconMap = {
    info: Info,
    success: CheckCircle2,
    warning: AlertCircle,
    trend: TrendingUp,
  };

  const colorMap = {
    info: "text-blue-600 bg-blue-50",
    success: "text-green-600 bg-green-50",
    warning: "text-yellow-600 bg-yellow-50",
    trend: "text-purple-600 bg-purple-50",
  };

  const Icon = iconMap[type];

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex gap-3">
        <div className={cn("flex-shrink-0 p-2 rounded-lg", colorMap[type])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-gray-light mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}
