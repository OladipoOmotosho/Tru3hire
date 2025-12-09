import { AlertCircle, X } from "lucide-react";
import { Card } from "./ui/card";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ 
  title = "Error", 
  message, 
  onDismiss 
}: ErrorAlertProps) {
  return (
    <Card className="p-4 border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-red-800 mb-1">{title}</h4>
          <p className="text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </Card>
  );
}
