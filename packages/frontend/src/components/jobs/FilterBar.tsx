import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Briefcase } from "lucide-react";
import { fetchLocations, Province } from "@/lib/jobs-api";

// ============================================================================
// Types
// ============================================================================

interface FilterBarProps {
  province: string;
  city: string;
  jobType: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  onJobTypeChange: (jobType: string) => void;
}

const JOB_TYPES = [
  { value: "all", label: "All Types" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "remote", label: "Remote" },
  { value: "intern", label: "Intern" },
];

// ============================================================================
// Component
// ============================================================================

export function FilterBar({
  province,
  city,
  jobType,
  onProvinceChange,
  onCityChange,
  onJobTypeChange,
}: FilterBarProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [provinceError, setProvinceError] = useState(false);
  const [cityError, setCityError] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const load = async () => {
      setProvinceError(false);
      setLoadingProvinces(true);
      try {
        const data = await fetchLocations();
        setProvinces(data.provinces || []);
      } catch {
        console.warn("Failed to load provinces");
        setProvinceError(true);
      } finally {
        setLoadingProvinces(false);
      }
    };
    load();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (!province) {
      setCities([]);
      return;
    }
    let isActive = true;
    const load = async () => {
      setLoadingCities(true);
      setCityError(false);
      try {
        const data = await fetchLocations(province);
        if (isActive) setCities(data.cities || []);
      } catch {
        if (isActive) {
          console.warn("Failed to load cities");
          setCityError(true);
        }
      } finally {
        if (isActive) setLoadingCities(false);
      }
    };
    load();
    return () => { isActive = false; };
  }, [province]);

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value);
    onCityChange(""); // Reset city when province changes
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Province */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={loadingProvinces}
          className="appearance-none pl-8 pr-8 py-2 text-sm bg-card border border-border rounded-lg cursor-pointer
                     hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50
                     text-foreground transition-all min-w-[140px]"
          aria-label="Province"
        >
          <option value="">
            {provinceError ? "Failed to load" : "All Provinces"}
          </option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* City (only if province selected) */}
      {province && (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={loadingCities}
            className="appearance-none pl-8 pr-8 py-2 text-sm bg-card border border-border rounded-lg cursor-pointer
                       hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50
                       text-foreground transition-all min-w-[140px]"
            aria-label="City"
          >
            <option value="">
              {cityError ? "Failed to load" : "All Cities"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {/* Job Type Pills */}
      <div className="flex items-center gap-1.5">
        <Briefcase className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
        {JOB_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onJobTypeChange(type.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all
              ${
                jobType === type.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
