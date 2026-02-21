import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suggestion } from "@/types/search";
import { cn } from "@/lib/utils";

interface JobSearchHeaderProps {
  initialQuery: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  total?: number;
  suggestions?: Suggestion[];
}

export function JobSearchHeader({
  initialQuery,
  onSearch,
  loading,
  total = 0,
  suggestions = [],
}: JobSearchHeaderProps) {
  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query with history if it's the first load
  useEffect(() => {
    if (initialQuery && history.length === 0) {
      setHistory([initialQuery]);
    }
  }, [initialQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = inputValue.trim();
    if (!val && history.length === 0) return;

    let newHistory = [...history];
    if (val) {
      newHistory.push(val);
    }

    setHistory(newHistory);
    setInputValue("");
    onSearch(newHistory.join(" "));
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const val = suggestion.signal;
    const newHistory = [...history, val];
    setHistory(newHistory);
    onSearch(newHistory.join(" "));
  };

  const handleClearHistory = () => {
    setHistory([]);
    setInputValue("");
    onSearch("");
  };

  const isRefineMode = history.length > 0;

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border pt-[88px] pb-3 sm:pb-4 shadow-sm w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <div
            className={cn(
              "relative flex items-center w-full h-14 rounded-full border border-border bg-card hover:shadow-md transition-all duration-300",
              "focus-within:bg-background focus-within:border-primary/50 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20",
            )}
          >
            <div className="pl-6 pr-3 text-muted-foreground">
              {isRefineMode ? (
                <Sparkles className="w-5 h-5 text-blue-500" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isRefineMode
                  ? "Refine your previous results..."
                  : "Search jobs with natural language (e.g. 'Software Engineer')"
              }
              className="flex-1 h-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base px-2"
              disabled={loading}
            />

            {(inputValue || history.length > 0) && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-2 mr-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="pr-2 py-2">
              <Button
                type="submit"
                disabled={
                  loading || (!inputValue.trim() && history.length === 0)
                }
                className="h-full px-6 rounded-full transition-all shadow-sm font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRefineMode ? (
                  "Refine"
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Conversation History Trail */}
        {history.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap max-w-3xl mx-auto">
            <span className="font-medium text-foreground">Conversation:</span>
            {history.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ArrowRight className="w-3 h-3 text-border" />}
                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border/50">
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-xs font-medium text-muted-foreground text-center flex items-center justify-center">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching...
            </span>
          ) : total > 0 ? (
            `${total.toLocaleString()} jobs found based on your conversation.`
          ) : (
            "No jobs found."
          )}
        </div>
      </div>
    </div>
  );
}
