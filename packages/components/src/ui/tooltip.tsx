import React, { useState } from "react";
import { cn } from "../lib/utils";

export interface TooltipProps {
  /** The content to display inside the tooltip */
  content: string;
  /** The element that triggers the tooltip on hover/focus */
  children: React.ReactNode;
  /** Additional CSS classes for the trigger element */
  className?: string;
}

/**
 * A reusable Tooltip component that shows content on hover or focus.
 *
 * @example
 * <Tooltip content="More info">
 *   <button>Hover me</button>
 * </Tooltip>
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        role="button"
        aria-label="Show tooltip"
        className={cn(
          "cursor-help focus:outline-none focus:ring-2 focus:ring-primary rounded-sm",
          className,
        )}
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
