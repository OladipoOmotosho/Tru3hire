/**
 * useProgressiveJobs Hook
 *
 * Provides progressive loading for jobs:
 * 1. Fetch jobs instantly (no scores)
 * 2. Display jobs immediately
 * 3. Fetch scores in background batches
 * 4. Update UI as scores arrive
 */

import { useState, useCallback, useRef } from "react";
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
  search: (
    query: string,
    options?: {
      province?: string;
      city?: string;
      page?: number;
      jobType?: string;
    },
  ) => Promise<void>;
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

  // Track current search to cancel outdated score fetches
  const searchIdRef = useRef(0);

  const search = useCallback(
    async (
      query: string,
      searchOptions: {
        province?: string;
        city?: string;
        page?: number;
        jobType?: string;
      } = {},
    ) => {
      const currentSearchId = ++searchIdRef.current;

      // Clear previous results
      setLoading(true);
      setError(null);
      setJobs([]);

      try {
        // Step 1: Fetch jobs instantly (no scoring)
        const result = await searchJobs(query, searchOptions);

        // Check if this search is still current
        if (currentSearchId !== searchIdRef.current) return;

        if (result.error) {
          setError(result.error);
          setJobs([]);
          setTotal(0);
          return;
        }

        // Mark all jobs as loading scores
        const jobsWithLoading = result.jobs.map((job) => ({
          ...job,
          loading: true,
          true_score: undefined,
          risk_level: undefined,
        }));

        setJobs(jobsWithLoading);
        setTotal(result.total);
        setLoading(false);

        // Step 2: Fetch scores in background batches
        if (result.jobs.length > 0) {
          setScoresLoading(true);

          const batches = chunkArray(result.jobs, SCORE_BATCH_SIZE);

          for (const batch of batches) {
            // Check if search is still current
            if (currentSearchId !== searchIdRef.current) break;

            try {
              const scoresData = await fetchJobScores(batch, resumeText);

              // Update jobs with new scores
              if (currentSearchId === searchIdRef.current) {
                setJobs((prevJobs) =>
                  mergeJobScores(prevJobs, scoresData.scores),
                );
              }
            } catch (e) {
              console.warn("Failed to fetch scores for batch:", e);
              // Don't fail the whole search - just skip this batch
            }
          }

          setScoresLoading(false);
        }
      } catch (e) {
        if (currentSearchId === searchIdRef.current) {
          setError("Failed to search jobs. Please try again.");
          setJobs([]);
        }
      } finally {
        if (currentSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [resumeText],
  );

  return {
    jobs,
    loading,
    scoresLoading,
    error,
    total,
    search,
  };
}
