/**
 * useDiscoverJobs Hook
 *
 * AI-powered job discovery with faceted search pipeline.
 * Calls /api/jobs/discover and surfaces facet_suggestions for refinement.
 */

import { useState, useCallback, useRef } from "react";
import {
  discoverJobs,
  type DiscoveredJob,
  type FacetSuggestion,
  type DiscoverResponse,
  type SearchContext,
} from "@/lib/discover-api";

interface UseDiscoverJobsOptions {
  getToken: () => Promise<string | null>;
}

interface SearchOptions {
  province?: string;
  city?: string;
  page?: number;
  limit?: number;
  jobType?: string;
  refinements?: string[];
  context?: SearchContext | null;
}

interface UseDiscoverJobsResult {
  jobs: DiscoveredJob[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
  facet_suggestions: FacetSuggestion[];
  suggestions: DiscoverResponse["suggestions"];
  parsed_query: DiscoverResponse["parsed_query"] | null;
  search: (query: string, options?: SearchOptions) => Promise<void>;
  goToPage: (pageNum: number) => Promise<void>;
  /** Add a facet refinement and re-search */
  refineWithFacet: (signal: string) => Promise<void>;
  /** Current query and refinements (for display) */
  currentQuery: string;
  refinements: string[];
  /** Clear search state */
  clearSearch: () => void;
}

export function useDiscoverJobs(
  options: UseDiscoverJobsOptions,
): UseDiscoverJobsResult {
  const { getToken } = options;

  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [facet_suggestions, setFacetSuggestions] = useState<FacetSuggestion[]>(
    [],
  );
  const [suggestions, setSuggestions] = useState<DiscoverResponse["suggestions"]>(
    [],
  );
  const [parsed_query, setParsedQuery] =
    useState<DiscoverResponse["parsed_query"] | null>(null);

  const [currentQuery, setCurrentQuery] = useState("");
  const [refinements, setRefinements] = useState<string[]>([]);
  const [lastContext, setLastContext] = useState<SearchContext | null>(null);
  const [lastOptions, setLastOptions] = useState<SearchOptions>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(
    async (
      query: string,
      searchOptions: SearchOptions = {},
      appendRefinements: string[] = [],
    ) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          setError("Please sign in to search jobs");
          setJobs([]);
          return;
        }

        const allRefinements = [
          ...(searchOptions.refinements ?? refinements),
          ...appendRefinements,
        ];
        const pageToFetch = searchOptions.page ?? 1;

        const response = await discoverJobs(
          {
            query: query || " ",
            refinements: allRefinements,
            page: pageToFetch,
            limit: searchOptions.limit ?? 42,
            province: searchOptions.province ?? "",
            city: searchOptions.city ?? "",
            context: searchOptions.context ?? lastContext ?? undefined,
          },
          token,
        );

        if (controller.signal.aborted) return;

        setJobs(response.jobs);
        setTotal(response.total);
        setPage(response.page);
        setFacetSuggestions(response.facet_suggestions ?? []);
        setSuggestions(response.suggestions ?? []);
        setParsedQuery(response.parsed_query ?? null);
        setCurrentQuery(query);
        setRefinements(allRefinements);
        if (response.context) {
          setLastContext(response.context as SearchContext);
        }
        setLastOptions({
          province: searchOptions.province,
          city: searchOptions.city,
          limit: searchOptions.limit,
        });
      } catch (e) {
        if (controller.signal.aborted || (e instanceof Error && e.name === "AbortError")) return;
        const msg =
          e instanceof Error ? e.message : "Failed to discover jobs";
        setError(msg);
        setJobs([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [getToken, refinements, lastContext],
  );

  const search = useCallback(
    async (query: string, options: SearchOptions = {}) => {
      setRefinements(options.refinements ?? []);
      if (options.context === null) setLastContext(null);
      await performSearch(query, options, []);
    },
    [performSearch],
  );

  const goToPage = useCallback(
    async (pageNum: number) => {
      if (loading || pageNum < 1) return;
      await performSearch(currentQuery, {
        ...lastOptions,
        page: pageNum,
        refinements,
        context: lastContext ?? undefined,
      });
    },
    [loading, currentQuery, lastOptions, refinements, lastContext, performSearch],
  );

  const refineWithFacet = useCallback(
    async (signal: string) => {
      await performSearch(currentQuery, { ...lastOptions }, [signal]);
    },
    [currentQuery, lastOptions, performSearch],
  );

  const clearSearch = useCallback(() => {
    setJobs([]);
    setTotal(0);
    setPage(1);
    setFacetSuggestions([]);
    setSuggestions([]);
    setParsedQuery(null);
    setCurrentQuery("");
    setRefinements([]);
    setLastContext(null);
  }, []);

  return {
    jobs,
    loading,
    error,
    total,
    page,
    hasMore: jobs.length < total,
    facet_suggestions,
    suggestions,
    parsed_query,
    search,
    goToPage,
    refineWithFacet,
    currentQuery,
    refinements,
    clearSearch,
  };
}
