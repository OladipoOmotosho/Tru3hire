/**
 * useHybridJobs Hook
 *
 * Fast default load + AI discovery when user searches:
 * - Empty query: uses simple search (instant jobs, no auth required)
 * - Non-empty query: uses discover API (facets, refinement)
 */

import { useState, useCallback, useRef } from "react";
import { useProgressiveJobs } from "./useProgressiveJobs";
import { useDiscoverJobs } from "./useDiscoverJobs";
import type { DiscoveredJob } from "@/lib/discover-api";
import type { RankedJob } from "@/lib/jobs-api";
import type { FacetSuggestion } from "@/lib/discover-api";

type JobResult = RankedJob | DiscoveredJob;

interface UseHybridJobsOptions {
  getToken: () => Promise<string | null>;
  resumeText?: string;
}

interface UseHybridJobsResult {
  jobs: JobResult[];
  loading: boolean;
  scoresLoading: boolean;
  total: number;
  page: number;
  facet_suggestions: FacetSuggestion[];
  searchMode: "simple" | "discover";
  search: (
    query: string,
    options?: {
      province?: string;
      city?: string;
      page?: number;
      limit?: number;
      jobType?: string;
      refinements?: string[];
    },
  ) => Promise<void>;
  goToPage: (pageNum: number) => Promise<void>;
  refineWithFacet: (signal: string) => Promise<void>;
  currentQuery: string;
  refinements: string[];
  clearSearch: () => void;
}

export function useHybridJobs(options: UseHybridJobsOptions): UseHybridJobsResult {
  const { getToken, resumeText = "" } = options;

  const progressive = useProgressiveJobs({ resumeText });
  const discover = useDiscoverJobs({ getToken });

  const [lastQuery, setLastQuery] = useState("");
  const lastQueryRef = useRef(lastQuery);
  const hasQuery = (q: string) => q.trim().length > 0;
  const isDiscoverMode = hasQuery(lastQuery);

  const search = useCallback(
    async (
      query: string,
      opts?: {
        province?: string;
        city?: string;
        page?: number;
        limit?: number;
        jobType?: string;
        refinements?: string[];
      },
    ) => {
      setLastQuery(query);
      lastQueryRef.current = query;
      if (hasQuery(query)) {
        await discover.search(query, {
          province: opts?.province ?? "",
          city: opts?.city ?? "",
          page: opts?.page,
          limit: opts?.limit ?? 42,
          refinements: opts?.refinements,
        });
      } else {
        discover.clearSearch();
        await progressive.search(query, {
          province: opts?.province,
          city: opts?.city,
          page: opts?.page,
          limit: opts?.limit ?? 42,
          jobType: opts?.jobType,
        });
      }
    },
    [discover, progressive],
  );

  const goToPage = useCallback(
    async (pageNum: number) => {
      if (hasQuery(lastQueryRef.current)) {
        await discover.goToPage(pageNum);
      } else {
        await progressive.goToPage(pageNum);
      }
    },
    [discover, progressive],
  );

  const refineWithFacet = useCallback(
    async (signal: string) => {
      if (hasQuery(lastQueryRef.current)) {
        await discover.refineWithFacet(signal);
      }
    },
    [discover],
  );

  return {
    jobs: isDiscoverMode ? discover.jobs : progressive.jobs,
    loading: isDiscoverMode ? discover.loading : progressive.loading,
    scoresLoading: isDiscoverMode ? false : progressive.scoresLoading,
    total: isDiscoverMode ? discover.total : progressive.total,
    page: isDiscoverMode ? discover.page : progressive.page,
    facet_suggestions: isDiscoverMode ? discover.facet_suggestions : [],
    searchMode: isDiscoverMode ? "discover" : "simple",
    search,
    goToPage,
    refineWithFacet,
    currentQuery: isDiscoverMode ? discover.currentQuery : progressive.currentQuery,
    refinements: isDiscoverMode ? discover.refinements : [],
    clearSearch: discover.clearSearch,
  };
}
