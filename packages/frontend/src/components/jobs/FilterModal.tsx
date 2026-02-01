/**
 * FilterModal - Advanced filters in a modal
 * Opens when "Advance filter" or "More filter options" is clicked
 */

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "./FilterPanel";
import { JobFilters } from "@/lib/types";

const MODAL_TITLE_ID = "filter-modal-title";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FilterModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = (newFilters: JobFilters) => {
    onFiltersChange(newFilters);
    onClose();
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_TITLE_ID}
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h3 id={MODAL_TITLE_ID} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Advanced Filters
          </h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground"
              >
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filter content - scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleApply}
            embedded
          />
        </div>
      </div>
    </div>
  );
}
