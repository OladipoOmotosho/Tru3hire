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
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-blue-600"
          >
            <X className="w-4 h-4 mr-1" />
            Reset
          </Button>
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
              value={filters.trueScoreMin || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  trueScoreMin: e.target.value ? Number(e.target.value) : undefined,
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
              value={filters.trueScoreMax || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  trueScoreMax: e.target.value ? Number(e.target.value) : undefined,
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
            value={filters.postedWithinDays || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                postedWithinDays: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                checked={filters.verifiedOnly || false}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
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
                checked={filters.freshPostingsOnly || false}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
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
                checked={filters.diversityFriendlyOnly || false}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
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
              value={filters.salaryMin || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  salaryMin: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.salaryMax || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  salaryMax: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
