import React, { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISearchInputProps {
  initialQuery: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

const EXAMPLE_QUERIES = [
  "senior python developer, remote friendly",
  "frontend engineer at startups, not management",
  "data analyst in Toronto, entry level",
  "full stack roles, high growth companies",
];

export function AISearchInput({
  initialQuery,
  onSearch,
  loading = false,
  placeholder = "Describe your ideal job in natural language...",
  className,
}: AISearchInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  // Sync with external initial query changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowExamples(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    setShowExamples(false);
    onSearch(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={className ? `relative ${className}` : "relative"}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* AI sparkle icon */}
          <div className="absolute left-4 top-4 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>

          {/* Textarea input */}
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => !query && setShowExamples(true)}
            onBlur={() => {
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = setTimeout(
                () => setShowExamples(false),
                200,
              );
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[80px] pl-12 pr-28 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-base leading-relaxed"
            rows={2}
          />

          {/* Search button */}
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 bottom-3 min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 w-4 h-4" />
                Discover
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Example queries dropdown */}
      {showExamples && !query && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-muted-foreground">
              Try these examples:
            </span>
          </div>
          {EXAMPLE_QUERIES.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <span className="text-sm">{example}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
