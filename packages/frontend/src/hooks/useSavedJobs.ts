/**
 * useSavedJobs Hook
 *
 * Custom hook to manage saved/bookmarked jobs in localStorage.
 * Provides functions to save, unsave, check status, and retrieve all saved jobs.
 */

import { useState, useEffect, useCallback } from "react";
import { JobPosting } from "@/lib/types";

const STORAGE_KEY = "truehire_saved_jobs";

export interface SavedJob extends JobPosting {
  savedAt: string;
}

/**
 * Load saved jobs from localStorage
 */
function loadSavedJobs(): SavedJob[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load saved jobs:", error);
  }
  return [];
}

/**
 * Save jobs to localStorage
 */
function persistSavedJobs(jobs: SavedJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error("Failed to save jobs:", error);
  }
}

export function useSavedJobs() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  // Load saved jobs on mount
  useEffect(() => {
    setSavedJobs(loadSavedJobs());
  }, []);

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
      persistSavedJobs(updated);
    },
    [savedJobs, isJobSaved]
  );

  /**
   * Remove a saved job
   */
  const unsaveJob = useCallback(
    (jobId: string): void => {
      const updated = savedJobs.filter((job) => job.id !== jobId);
      setSavedJobs(updated);
      persistSavedJobs(updated);
    },
    [savedJobs]
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
    persistSavedJobs([]);
  }, []);

  return {
    savedJobs,
    saveJob,
    unsaveJob,
    toggleSaveJob,
    isJobSaved,
    getSavedJobs,
    clearAllSavedJobs,
    savedCount: savedJobs.length,
  };
}
