import React from "react";
import {
  MapPin,
  Briefcase,
  Code,
  Building2,
  Factory,
  Maximize2,
  Minimize2,
  Plus,
} from "lucide-react";
import type { FacetSuggestion } from "@/lib/discover-api";

interface FacetSuggestionsProps {
  suggestions: FacetSuggestion[];
  onFacetClick: (signal: string) => void;
  loading?: boolean;
}

const DIMENSION_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  location: { icon: MapPin, label: "Location" },
  seniority: { icon: Briefcase, label: "Seniority" },
  skills: { icon: Code, label: "Skills" },
  company_size: { icon: Building2, label: "Company Size" },
  industry: { icon: Factory, label: "Industry" },
};

function getActionIcon(type: string) {
  if (type.startsWith("expand_")) return Maximize2;
  if (type.startsWith("narrow_")) return Minimize2;
  if (type.startsWith("add_")) return Plus;
  return Plus;
}

function getActionColor(type: string) {
  if (type.startsWith("expand_"))
    return "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50";
  if (type.startsWith("narrow_"))
    return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50";
  if (type.startsWith("add_"))
    return "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50";
  return "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
}

/**
 * Faceted Spectrum suggestions — expand/narrow tags grouped by dimension.
 * Lets users refine their search along specific dimensions like location,
 * seniority, skills, company size, and industry.
 */
export function FacetSuggestions({
  suggestions,
  onFacetClick,
  loading = false,
}: FacetSuggestionsProps) {
  if (loading || suggestions.length === 0) return null;

  // Group suggestions by dimension
  const grouped = suggestions.reduce<Record<string, FacetSuggestion[]>>(
    (acc, s) => {
      const dim = s.dimension || "other";
      if (!acc[dim]) acc[dim] = [];
      acc[dim].push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="py-3 border-t border-gray-100 dark:border-gray-800">
      <div className="space-y-2">
        {Object.entries(grouped).map(([dimension, items]) => {
          const config = DIMENSION_CONFIG[dimension] || {
            icon: Plus,
            label: dimension,
          };
          const DimIcon = config.icon;

          return (
            <div key={dimension} className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <DimIcon className="w-3 h-3" />
                {config.label}
              </span>
              {items.map((suggestion, idx) => {
                const ActionIcon = getActionIcon(suggestion.type);
                return (
                  <button
                    key={idx}
                    onClick={() => onFacetClick(suggestion.signal)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${getActionColor(suggestion.type)}`}
                    title={suggestion.reason}
                  >
                    <ActionIcon className="w-3 h-3" />
                    <span>{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
