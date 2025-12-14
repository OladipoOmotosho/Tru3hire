import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SkillTagProps {
  skill: string;
  variant?: "default" | "matched" | "missing";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function SkillTag({
  skill,
  variant = "default",
  removable = false,
  onRemove,
  className,
}: SkillTagProps) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    matched: "bg-green-100 text-green-700 border-green-300",
    missing: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <Badge
      variant="outline"
      className={cn("px-3 py-1", variantClasses[variant], className)}
    >
      {skill}
      {removable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove?.();
          }}
          className="ml-2 hover:text-gray-light"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Badge>
  );
}
