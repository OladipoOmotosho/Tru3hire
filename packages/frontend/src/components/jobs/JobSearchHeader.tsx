import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Loader2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLocations, Province } from "@/lib/jobs-api";

interface JobSearchHeaderProps {
  initialQuery: string;
  initialProvince: string;
  initialCity: string;
  initialPostedWithin?: number;
  initialJobType?: string;
  onSearch: (query: string, province: string, city: string) => void;
  onPostedWithinChange?: (days: number | undefined) => void;
  onJobTypeChange?: (type: string) => void;
  onAdvanceFilterClick?: () => void;
  loading?: boolean;
  total?: number;
  companiesCount?: number;
}

const POSTED_OPTIONS = [
  { label: "Any time", value: undefined },
  { label: "24 hours", value: 1 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "3 months", value: 90 },
];

const JOB_TYPE_OPTIONS = [
  { label: "All jobs", value: "all" },
  { label: "Full-time", value: "fulltime" },
  { label: "Part-time", value: "parttime" },
  { label: "Contract", value: "contract" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
];

export function JobSearchHeader({
  initialQuery,
  initialProvince,
  initialCity,
  initialPostedWithin,
  initialJobType = "all",
  onSearch,
  onPostedWithinChange,
  onJobTypeChange,
  onAdvanceFilterClick,
  loading,
  total = 0,
  companiesCount = 0,
}: JobSearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [province, setProvince] = useState(initialProvince);
  const [city, setCity] = useState(initialCity);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await fetchLocations();
        if (data.provinces) setProvinces(data.provinces);
      } catch (e) {
        console.error("Failed to load provinces", e);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!province) {
      setCities([]);
      setCity("");
      return;
    }
    let cancelled = false;
    const loadCities = async () => {
      setLoadingLocations(true);
      try {
        const data = await fetchLocations(province);
        if (cancelled) return;
        const newCities = data.cities || [];
        setCities(newCities);
        setCity((prev) => (prev && !newCities.includes(prev) ? "" : prev));
      } catch {
        if (cancelled) return;
        setCities([]);
        setCity("");
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    };
    loadCities();
    return () => {
      cancelled = true;
    };
  }, [province]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, province, city);
  };

  return (
    <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar - Search + Location */}
        <form onSubmit={handleSubmit} className="py-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Job title, keywords, or company..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:flex-initial lg:min-w-[280px]">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={province}
                  onChange={(e) => {
                    const newProvince = e.target.value;
                    setProvince(newProvince);
                    // Reset city when province changes
                    if (!newProvince) {
                      setCity("");
                    }
                    // Trigger search immediately
                    onSearch(query, newProvince, newProvince ? city : "");
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-background appearance-none"
                >
                  <option value="">All Provinces</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1">
                <select
                  value={city}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setCity(newCity);
                    // Trigger search immediately
                    onSearch(query, province, newCity);
                  }}
                  disabled={!province || loadingLocations}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-background appearance-none disabled:opacity-50"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {loadingLocations && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full lg:w-auto min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </form>

        {/* Filter Bar - Relevance, Posted, Job Type, Advance Filter */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <select
            value={initialPostedWithin ?? ""}
            onChange={(e) =>
              onPostedWithinChange?.(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="px-2 sm:px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-background text-xs sm:text-sm min-w-0"
          >
            {POSTED_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={initialJobType}
            onChange={(e) => onJobTypeChange?.(e.target.value)}
            className="px-2 sm:px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-background text-xs sm:text-sm min-w-0"
          >
            {JOB_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {onAdvanceFilterClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdvanceFilterClick}
              className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <span className="sm:hidden">Filters</span>
            </Button>
          )}

          {/* AI Discovery link */}
          <Link to="/discover" className="ml-auto">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 sm:gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm px-2 sm:px-3"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Discovery</span>
              <span className="sm:hidden">AI</span>
            </Button>
          </Link>
        </div>

        {/* Results Summary */}
        {(total > 0 || loading) && (
          <div className="py-3 text-sm text-muted-foreground">
            {total > 0
              ? `${total.toLocaleString()} jobs • ${companiesCount > 0 ? `${companiesCount.toLocaleString()} companies • ` : ""}Latest jobs - Canada`
              : "Searching..."}
          </div>
        )}
      </div>
    </div>
  );
}
