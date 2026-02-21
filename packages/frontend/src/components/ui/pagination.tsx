import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const MIN_PER_PAGE = 1;
const MAX_PER_PAGE = 50; // Matches backend/Adzuna API limit

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange,
}) => {
  const [inputValue, setInputValue] = useState(String(itemsPerPage));

  useEffect(() => {
    setInputValue(String(itemsPerPage));
  }, [itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const applyItemsPerPage = (value: string) => {
    const num = parseInt(value, 10);
    if (!Number.isNaN(num) && num >= MIN_PER_PAGE && num <= MAX_PER_PAGE) {
      onItemsPerPageChange(num);
    } else {
      setInputValue(String(itemsPerPage));
    }
  };

  return (
    <div className="flex justify-center w-full py-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center space-x-1 px-2 py-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-lg rounded-full">
        {/* Previous Buttons */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1 px-1 sm:px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            const isActive = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Buttons */}
        <button
          onClick={() => totalPages > 0 && onPageChange(currentPage + 1)}
          disabled={totalPages === 0 || currentPage >= totalPages}
          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => totalPages > 0 && onPageChange(totalPages)}
          disabled={totalPages === 0 || currentPage === totalPages}
          className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
