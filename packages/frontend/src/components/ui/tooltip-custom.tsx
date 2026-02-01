import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={cn("cursor-help", className)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 w-56 p-3 text-xs text-popover-foreground bg-popover rounded-lg shadow-xl -top-2 left-full ml-2 transform border border-border animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute w-2 h-2 bg-popover border-l border-b border-border transform rotate-45 -left-1 top-4" />
          {content}
        </div>
      )}
    </div>
  );
}
