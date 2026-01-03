/**
 * useSavedJobs Hook
 *
 * Custom hook to manage saved/bookmarked jobs in localStorage.
 * Provides functions to save, unsave, check status, and retrieve all saved jobs.
 *
 * IMPORTANT: Storage is scoped per-user using userId to prevent data leakage.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { JobPosting } from "@/lib/types";
import { useUser } from "@clerk/clerk-react";

export interface SavedJob extends JobPosting {
  savedAt: string;
}

/**
 * Get the storage key for a specific user
 */
function getStorageKey(userId?: string): string {
  return userId ? `truehire_saved_jobs_${userId}` : "truehire_saved_jobs_guest";
}

/**
 * Load saved jobs from localStorage for a specific user
 */
function loadSavedJobs(userId?: string): SavedJob[] {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load saved jobs:", error);
  }
  return [];
}

/**
 * Save jobs to localStorage for a specific user
 */
function persistSavedJobs(jobs: SavedJob[], userId?: string): void {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(jobs));
  } catch (error) {
    console.error("Failed to save jobs:", error);
  }
}

export function useSavedJobs() {
  const { user } = useUser();
  const userId = user?.id;

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  // Memoize the storage key
  const storageKey = useMemo(() => getStorageKey(userId), [userId]);

  // Load saved jobs when userId changes
  useEffect(() => {
    setSavedJobs(loadSavedJobs(userId));
  }, [userId]);

  /**
   * Check if a job is saved
   */
  const isJobSaved = useCallback(
    (jobId: string): boolean => {
      return savedJobs.some((job) => job.id === jobId);
    },
    [savedJobs]
  );

  /**
   * Save a job
   */
  const saveJob = useCallback(
    (job: JobPosting): void => {
      if (isJobSaved(job.id)) return;

      const savedJob: SavedJob = {
        ...job,
        savedAt: new Date().toISOString(),
      };

      const updated = [...savedJobs, savedJob];
      setSavedJobs(updated);
      persistSavedJobs(updated, userId);
    },
    [savedJobs, isJobSaved, userId]
  );

  /**
   * Remove a saved job
   */
  const unsaveJob = useCallback(
    (jobId: string): void => {
      const updated = savedJobs.filter((job) => job.id !== jobId);
      setSavedJobs(updated);
      persistSavedJobs(updated, userId);
    },
    [savedJobs, userId]
  );

  /**
   * Toggle save state
   */
  const toggleSaveJob = useCallback(
    (job: JobPosting): void => {
      if (isJobSaved(job.id)) {
        unsaveJob(job.id);
      } else {
        saveJob(job);
      }
    },
    [isJobSaved, saveJob, unsaveJob]
  );

  /**
   * Get all saved jobs
   */
  const getSavedJobs = useCallback((): SavedJob[] => {
    return savedJobs;
  }, [savedJobs]);

  /**
   * Clear all saved jobs
   */
  const clearAllSavedJobs = useCallback((): void => {
    setSavedJobs([]);
    persistSavedJobs([], userId);
  }, [userId]);

  return {
    savedJobs,
    saveJob,
    unsaveJob,
    toggleSaveJob,
    isJobSaved,
    getSavedJobs,
    clearAllSavedJobs,
    savedCount: savedJobs.length,
    storageKey, // Exposed for debugging
  };
}
