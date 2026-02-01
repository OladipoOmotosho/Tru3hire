import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, X, Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  variant?: "confirm" | "danger" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  /** Show loading spinner on confirm button */
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  variant = "confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const shouldShowCancel = showCancel ?? true;

  const config = {
    confirm: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      buttonClass: "", // Default button style
    },
    danger: {
      icon: AlertTriangle,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
      buttonClass:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      buttonClass: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
      icon: CheckCircle2,
      iconColor: "text-green-500",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      buttonClass: "bg-green-600 hover:bg-green-700",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-full ${config.iconBg} shrink-0`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h3>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 -mt-1 -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="text-sm text-muted-foreground mb-6 pl-[52px]">
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end items-center">
          {shouldShowCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            className={cn(config.buttonClass)}
            variant={variant === "danger" ? "destructive" : "default"}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
