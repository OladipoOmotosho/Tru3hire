/**
 * useProgressiveJobs Hook
 *
 * Provides progressive loading for jobs:
 * 1. Fetch jobs instantly (no scores)
 * 2. Display jobs immediately
 * 3. Fetch scores in background batches
 * 4. Update UI as scores arrive
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  RankedJob,
  searchJobs,
  fetchJobScores,
  mergeJobScores,
  chunkArray,
} from "@/lib/jobs-api";

// Batch size for score fetching (smaller = faster first scores)
const SCORE_BATCH_SIZE = 8;

interface UseProgressiveJobsOptions {
  resumeText?: string;
}

interface UseProgressiveJobsResult {
  jobs: RankedJob[];
  loading: boolean;
  scoresLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean; // Add hasMore flag
  search: (
    query: string,
    options?: {
      province?: string;
      city?: string;
      page?: number;
      jobType?: string;
    },
  ) => Promise<void>;
  loadMore: () => Promise<void>; // Add loadMore function
}

export function useProgressiveJobs(
  options: UseProgressiveJobsOptions = {},
): UseProgressiveJobsResult {
  const { resumeText = "" } = options;

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentOptions, setCurrentOptions] = useState<{
    province?: string;
    city?: string;
    jobType?: string;
  }>({});

  // Track current search to cancel outdated score fetches
  const searchIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchJobs = useCallback(
    async (
      query: string,
      searchOptions: {
        province?: string;
        city?: string;
        page?: number;
        jobType?: string;
      } = {},
      isAppend: boolean = false,
    ) => {
      // Cancel previous in-flight requests if it's a new search (not load more)
      if (!isAppend && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new controller for this search
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const currentSearchId = ++searchIdRef.current;

      if (!isAppend) {
        setLoading(true);
        setError(null);
        setJobs([]);
        setPage(1);
        setCurrentQuery(query);
        setCurrentOptions(searchOptions);
      } else {
        setScoresLoading(true); // Show loading indicator for next batch
      }

      try {
        const pageToFetch = isAppend ? page + 1 : 1;

        // Step 1: Fetch jobs instantly (no scoring)
        const result = await searchJobs(query, {
          ...searchOptions,
          page: pageToFetch,
          limit: 30, // Updated limit to 30 as requested
        });

        // Check if this search is still current or aborted
        if (
          currentSearchId !== searchIdRef.current ||
          controller.signal.aborted
        )
          return;

        if (result.error) {
          setError(result.error);
          if (!isAppend) {
            setJobs([]);
            setTotal(0);
          }
          return;
        }

        // Mark all jobs as loading scores
        const newJobs = result.jobs.map((job) => ({
          ...job,
          loading: true,
          true_score: undefined,
          risk_level: undefined,
        }));

        if (isAppend) {
          setJobs((prev) => [...prev, ...newJobs]);
          setPage(pageToFetch);
        } else {
          setJobs(newJobs);
          setTotal(result.total);
        }

        setLoading(false);

        // Step 2: Fetch scores in background batches specifically for the NEW jobs
        if (newJobs.length > 0) {
          setScoresLoading(true);

          const batches = chunkArray(newJobs, SCORE_BATCH_SIZE);

          for (const batch of batches) {
            // Check if search is still current or aborted
            if (
              currentSearchId !== searchIdRef.current ||
              controller.signal.aborted
            )
              break;

            try {
              const scoresData = await fetchJobScores(
                batch,
                resumeText,
                controller.signal,
              );

              // Update jobs with new scores
              if (
                currentSearchId === searchIdRef.current &&
                !controller.signal.aborted
              ) {
                setJobs((prevJobs) =>
                  mergeJobScores(prevJobs, scoresData.scores),
                );
              }
            } catch (e) {
              if (e instanceof Error && e.name === "AbortError") {
                // Ignore abort errors
                break;
              }
              console.warn("Failed to fetch scores for batch:", e);
              // Don't fail the whole search - just skip this batch
            }
          }

          // Only clear loading state if this search is still active
          if (currentSearchId === searchIdRef.current) {
            setScoresLoading(false);
          }
        }
      } catch (e) {
        if (currentSearchId === searchIdRef.current) {
          setError("Failed to search jobs. Please try again.");
          if (!isAppend) setJobs([]);
        }
      } finally {
        if (currentSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [resumeText, page],
  );

  const search = useCallback(
    async (
      query: string,
      options: {
        province?: string;
        city?: string;
        page?: number;
        jobType?: string;
      } = {},
    ) => {
      await fetchJobs(query, options, false);
    },
    [fetchJobs],
  );

  const loadMore = useCallback(async () => {
    if (jobs.length >= total || loading || scoresLoading) return;
    await fetchJobs(currentQuery, currentOptions, true);
  }, [
    fetchJobs,
    currentQuery,
    currentOptions,
    jobs.length,
    total,
    loading,
    scoresLoading,
  ]);

  return {
    jobs,
    loading,
    scoresLoading,
    error,
    total,
    hasMore: jobs.length < total,
    search,
    loadMore,
  };
}
