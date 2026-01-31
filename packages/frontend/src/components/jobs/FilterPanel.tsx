import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobFilters } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterPanelProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  className?: string;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  className,
}: FilterPanelProps) {
  // Local state for buffering changes
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);

  // Sync local state when external filters change (e.g. reset from parent)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;
  // Check if current local filters are different from applied filters
  const hasUnsavedChanges =
    JSON.stringify(localFilters) !== JSON.stringify(filters);

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-light">Filters</h3>
        </div>
        {(hasActiveFilters || hasUnsavedChanges) && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground h-8 px-2"
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* TrueScore Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            TrueScore Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min"
              value={localFilters.trueScoreMin || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  trueScoreMin: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max"
              value={localFilters.trueScoreMax || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  trueScoreMax: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {/* Posted Within */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Posted Within
          </label>
          <select
            value={localFilters.postedWithinDays || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                postedWithinDays: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-background"
          >
            <option value="">Any time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Trust Badges */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Trust Badges
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={localFilters.verifiedOnly || false}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    verifiedOnly: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              Verified Employers Only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={localFilters.freshPostingsOnly || false}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    freshPostingsOnly: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              Fresh Postings Only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={localFilters.diversityFriendlyOnly || false}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    diversityFriendlyOnly: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              Diversity Friendly Only
            </label>
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Salary Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.salaryMin || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  salaryMin: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={localFilters.salaryMax || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  salaryMax: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <Button
          className="w-full mt-4"
          onClick={handleApply}
          disabled={!hasUnsavedChanges}
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}
