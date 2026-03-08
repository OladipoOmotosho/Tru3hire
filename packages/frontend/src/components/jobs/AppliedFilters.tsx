import React from "react";
import { X, Filter, Plus, Minus } from "lucide-react";
import type { ParsedQuery } from "@/lib/discover-api";

interface AppliedFiltersProps {
  parsedQuery: ParsedQuery | null;
  onRemoveFilter: (filterType: string, value: string) => void;
}

/**
 * Shows resolved filters as removable chips.
 * No parsing preview - just applied constraints.
 */
export function AppliedFilters({
  parsedQuery,
  onRemoveFilter,
}: AppliedFiltersProps) {
  if (!parsedQuery) return null;

  const hasFilters =
    parsedQuery.role_title ||
    parsedQuery.seniority ||
    parsedQuery.job_type ||
    (parsedQuery.exclude_terms?.length ?? 0) > 0 ||
    (parsedQuery.company_traits?.length ?? 0) > 0 ||
    (parsedQuery.industry_preferences?.length ?? 0) > 0 ||
    (parsedQuery.keywords?.length ?? 0) > 0 ||
    parsedQuery.location_preference ||
    parsedQuery.city_preference;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <Filter className="w-4 h-4 text-muted-foreground mr-1" />

      {/* Role title chip */}
      {parsedQuery.role_title && (
        <FilterChip
          icon={<Plus className="w-3 h-3" />}
          label={`Role: ${parsedQuery.role_title}`}
          type="positive"
          onRemove={() => onRemoveFilter("role", parsedQuery.role_title!)}
        />
      )}

      {/* Seniority chip */}
      {parsedQuery.seniority && (
        <FilterChip
          icon={<Plus className="w-3 h-3" />}
          label={`Level: ${parsedQuery.seniority}`}
          type="positive"
          onRemove={() => onRemoveFilter("seniority", parsedQuery.seniority!)}
        />
      )}

      {/* Job type chip */}
      {parsedQuery.job_type && (
        <FilterChip
          icon={<Plus className="w-3 h-3" />}
          label={parsedQuery.job_type}
          type="positive"
          onRemove={() => onRemoveFilter("job_type", parsedQuery.job_type!)}
        />
      )}

      {/* Location chip */}
      {parsedQuery.location_preference && (
        <FilterChip
          icon={<Plus className="w-3 h-3" />}
          label={parsedQuery.location_preference}
          type="positive"
          onRemove={() =>
            onRemoveFilter("location", parsedQuery.location_preference!)
          }
        />
      )}

      {/* City chip */}
      {parsedQuery.city_preference && (
        <FilterChip
          icon={<Plus className="w-3 h-3" />}
          label={parsedQuery.city_preference}
          type="positive"
          onRemove={() => onRemoveFilter("city", parsedQuery.city_preference!)}
        />
      )}

      {/* Industry preferences */}
      {(parsedQuery.industry_preferences ?? []).map((industry, i) => (
        <FilterChip
          key={`industry-${industry}-${i}`}
          icon={<Plus className="w-3 h-3" />}
          label={industry}
          type="positive"
          onRemove={() => onRemoveFilter("industry", industry)}
        />
      ))}

      {/* Company traits */}
      {(parsedQuery.company_traits ?? []).map((trait, i) => (
        <FilterChip
          key={`trait-${trait}-${i}`}
          icon={<Plus className="w-3 h-3" />}
          label={trait}
          type="positive"
          onRemove={() => onRemoveFilter("trait", trait)}
        />
      ))}

      {/* Keywords */}
      {(parsedQuery.keywords ?? []).map((kw, i) => (
        <FilterChip
          key={`kw-${kw}-${i}`}
          icon={<Plus className="w-3 h-3" />}
          label={kw}
          type="positive"
          onRemove={() => onRemoveFilter("keyword", kw)}
        />
      ))}

      {/* Exclusions */}
      {(parsedQuery.exclude_terms ?? []).slice(0, 3).map((term, i) => (
        <FilterChip
          key={`excl-${term}-${i}`}
          icon={<Minus className="w-3 h-3" />}
          label={`Not: ${term}`}
          type="negative"
          onRemove={() => onRemoveFilter("exclude", term)}
        />
      ))}
      {(parsedQuery.exclude_terms?.length ?? 0) > 3 && (
        <span className="text-xs text-muted-foreground">
          +{parsedQuery.exclude_terms!.length - 3} more exclusions
        </span>
      )}
    </div>
  );
}

// Helper component for filter chips
function FilterChip({
  icon,
  label,
  type,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  type: "positive" | "negative";
  onRemove: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${
        type === "positive"
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
      }`}
    >
      {icon}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
