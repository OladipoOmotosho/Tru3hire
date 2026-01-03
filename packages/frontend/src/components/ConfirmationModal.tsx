/**
 * ConfirmationModal - Reusable modal for confirmations and alerts
 *
 * Replaces browser dialogs (window.confirm, alert) with a custom styled modal.
 * Supports different variants: confirm, danger, info, success
 */

import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ReactNode } from "react";

export interface ConfirmationModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message: string | ReactNode;
  /** Variant determines the icon and styling */
  variant?: "confirm" | "danger" | "info" | "success";
  /** Text for the confirm/primary button */
  confirmText?: string;
  /** Text for the cancel button (hidden in 'info' mode if not provided) */
  cancelText?: string;
  /** Show cancel button (defaults to true for confirm/danger, false for info/success) */
  showCancel?: boolean;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes */
  onCancel: () => void;
}

const variantConfig = {
  confirm: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonClass: "",
  },
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonClass: "",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    buttonClass: "",
  },
};

export function ConfirmationModal({
  isOpen,
  title,
  message,
  variant = "confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  // Default showCancel based on variant
  const shouldShowCancel =
    showCancel ?? (variant === "confirm" || variant === "danger");

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="text-sm text-muted-foreground mb-6 pl-[52px]">
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {shouldShowCancel && (
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            className={config.buttonClass}
            variant={variant === "danger" ? "destructive" : "default"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
