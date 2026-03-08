import React, { useState, useRef } from "react";
import {
  Search,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Building2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Suggestion } from "@/types/search";

interface FacetedSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  placeholder?: string;
  className?: string;
  showButton?: boolean;
}

export function FacetedSearchBar({
  query,
  onQueryChange,
  onSearch,
  suggestions,
  onSuggestionClick,
  placeholder = "Search for jobs (e.g. 'Software Engineer in Toronto')",
  className,
  showButton = true,
}: FacetedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const getIconForType = (dim: string) => {
    switch (dim) {
      case "location":
        return <MapPin className="w-3.5 h-3.5" />;
      case "seniority":
        return <GraduationCap className="w-3.5 h-3.5" />;
      case "industry":
        return <Building2 className="w-3.5 h-3.5" />;
      case "skills":
        return <Layers className="w-3.5 h-3.5" />;
      case "company_size":
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <Search className="w-3.5 h-3.5" />;
    }
  };

  const getStylesForType = (type: string) => {
    if (type.startsWith("narrow")) {
      return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300";
    }
    if (type.startsWith("expand")) {
      return "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 hover:border-purple-300";
    }
    if (type.startsWith("add")) {
      return "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300";
    }
    return "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300";
  };

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {/* Search Input Box */}
      <div
        className={cn(
          "relative flex items-center w-full h-12 rounded-xl border bg-white transition-all duration-200 group/search",
          isFocused
            ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5"
            : "border-gray-200 shadow-sm hover:border-gray-300",
        )}
      >
        <div className="pl-4 pr-3 text-gray-400 group-focus-within/search:text-blue-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent outline-none text-gray-900 placeholder:text-gray-400 font-medium text-base"
        />

        {query && (
          <button
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            className="p-2 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {showButton && (
          <div className="pr-1.5 py-1.5">
            <button
              onClick={onSearch}
              className="h-full px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              Search
            </button>
          </div>
        )}
      </div>

      {/* Smart Suggestions (Pills) */}
      {suggestions && suggestions.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 pl-1"
          role="listbox"
          aria-label="Search suggestions"
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
            Build your search:
          </div>
          {suggestions.map((suggestion, idx) => (
            <button
              key={`${suggestion.type}-${suggestion.signal}-${idx}`}
              role="option"
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 active:scale-95 shadow-sm",
                getStylesForType(suggestion.type),
              )}
              title={suggestion.reason}
            >
              <span className="opacity-70">
                {getIconForType(suggestion.dimension)}
              </span>
              <span>{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
