import React from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import type { Refinement } from "@/lib/discover-api";

interface RefinementSuggestionsProps {
  suggestions: Refinement[];
  onRefinementClick: (signal: string) => void;
  loading?: boolean;
}

/**
 * Data-driven refinement suggestions.
 * These come from result distribution analysis, not LLM generation.
 */
export function RefinementSuggestions({
  suggestions,
  onRefinementClick,
  loading = false,
}: RefinementSuggestionsProps) {
  if (loading || suggestions.length === 0) return null;

  return (
    <div className="py-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-2.5">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-muted-foreground">
          Suggested filters
        </span>
        <span className="text-xs text-muted-foreground/60">
          — click to apply
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onRefinementClick(suggestion.signal)}
            className="cursor-pointer group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 hover:text-primary hover:shadow-sm rounded-full transition-all duration-150 border border-transparent hover:border-primary/20"
            title={suggestion.reason}
          >
            <span>{suggestion.text}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
