import React, { useState, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLocations, Province } from "@/lib/jobs-api";

interface JobSearchHeaderProps {
  initialQuery: string;
  initialProvince: string;
  initialCity: string;
  onSearch: (query: string, province: string, city: string) => void;
  loading?: boolean;
}

export function JobSearchHeader({
  initialQuery,
  initialProvince,
  initialCity,
  onSearch,
  loading,
}: JobSearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [province, setProvince] = useState(initialProvince);
  const [city, setCity] = useState(initialCity);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load provinces on mount
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

  // Load cities when province changes
  useEffect(() => {
    if (province) {
      const loadCities = async () => {
        setLoadingLocations(true);
        try {
          const data = await fetchLocations(province);
          if (data.cities) setCities(data.cities);
        } catch (e) {
          setCities([]);
        } finally {
          setLoadingLocations(false);
        }
      };
      loadCities();
    } else {
      setCities([]);
      setCity("");
    }
  }, [province]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, province, city);
  };

  return (
    <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Job title, keywords, or company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
              >
                <option value="">All Provinces</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province || loadingLocations}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-background focus:ring-2 focus:ring-primary focus:border-transparent appearance-none disabled:opacity-50"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {loadingLocations && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Find Jobs"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
