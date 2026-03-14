import React from "react";
import {
  MapPin,
  Briefcase,
  Code,
  Building2,
  Factory,
  ChevronUp,
  ChevronDown,
  Plus,
  Compass,
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
  seniority: { icon: Briefcase, label: "Level" },
  skills: { icon: Code, label: "Skills" },
  company_size: { icon: Building2, label: "Company" },
  industry: { icon: Factory, label: "Industry" },
};

/** Human-friendly explanations for technical or domain terms */
const TERM_TOOLTIPS: Record<string, string> = {
  Embedded: "Embedded systems: firmware, IoT, automotive & microcontroller software",
  Backend: "Backend development: APIs, databases, server-side logic",
  Frontend: "Frontend development: web UI, React, Vue, Angular",
  DevOps: "DevOps: CI/CD, cloud infra, deployment automation",
  Statistics: "Statistics & data analysis",
  Fintech: "Financial technology",
  SaaS: "Software-as-a-Service products",
  Startup: "Early-stage or small company",
  Enterprise: "Large organization",
  "Big tech": "Major tech company (FAANG, etc.)",
};

function getActionPrefix(type: string): {
  icon: React.ElementType;
  label: string;
} {
  if (type.startsWith("expand_")) return { icon: ChevronUp, label: "Broaden" };
  if (type.startsWith("narrow_")) return { icon: ChevronDown, label: "Focus" };
  if (type.startsWith("add_")) return { icon: Plus, label: "Add" };
  return { icon: Plus, label: "" };
}

function getActionColor(type: string) {
  if (type.startsWith("expand_"))
    return "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/40";
  if (type.startsWith("narrow_"))
    return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/40";
  if (type.startsWith("add_"))
    return "bg-violet-50 text-violet-700 hover:bg-violet-100 hover:shadow-sm dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50 border border-violet-200/60 dark:border-violet-800/40";
  return "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/40";
}

/**
 * Faceted Spectrum suggestions — expand/narrow tags grouped by dimension.
 * Click any tag to instantly refine results along that dimension.
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
      <div className="flex items-center gap-2 mb-2.5">
        <Compass className="w-4 h-4 text-primary/70" />
        <span className="text-sm font-medium text-muted-foreground">
          Refine results
        </span>
        <span className="text-xs text-muted-foreground/60">
          — click a tag to narrow or broaden your search
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(grouped).map(([dimension, items]) => {
          const config = DIMENSION_CONFIG[dimension] || {
            icon: Plus,
            label: dimension,
          };
          const DimIcon = config.icon;

          return (
            <div key={dimension} className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground shrink-0 w-20">
                <DimIcon className="w-3.5 h-3.5" />
                {config.label}
              </span>
              {items.map((suggestion) => {
                const { icon: ActionIcon } = getActionPrefix(suggestion.type);
                const baseTerm = suggestion.text.replace(/\s*\([^)]*\)\s*$/, "").trim();
                const tooltip = TERM_TOOLTIPS[baseTerm] ?? TERM_TOOLTIPS[suggestion.text];
                const title = tooltip
                  ? `${suggestion.text} — ${tooltip}`
                  : suggestion.reason;
                return (
                  <button
                    key={suggestion.signal}
                    onClick={() => onFacetClick(suggestion.signal)}
                    className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${getActionColor(suggestion.type)}`}
                    title={title}
                  >
                    <ActionIcon className="w-3 h-3 opacity-70" />
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
