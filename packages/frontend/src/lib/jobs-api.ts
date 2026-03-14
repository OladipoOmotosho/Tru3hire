/**
 * Jobs API Service - Progressive Loading
 *
 * Optimized job search with instant display + background scoring.
 */

import { getApiUrl } from "./api-url";

// ============================================================================
// Types
// ============================================================================

export interface JobBreakdown {
  authenticity: number;
  hiring_activity: number;
  resume_match: number;
  company_reputation: number;
  recency?: number;
}

export interface RankedJob {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary_display: string;
  category: string;
  days_ago: number;
  redirect_url: string;
  true_score?: number;
  risk_level?: string;
  breakdown?: JobBreakdown;
  loading?: boolean; // For progressive loading UI
  friction_signals?: string[]; // P1: labor market friction signals
}

import { Suggestion } from "@/types/search";

export interface JobsSearchResponse {
  jobs: RankedJob[];
  total: number;
  page: number;
  query: string;
  province?: string;
  city?: string;
  error?: string;
  suggestions?: Suggestion[];
}

export interface JobScoresResponse {
  scores: Record<
    string,
    {
      true_score: number;
      risk_level: string;
      breakdown: JobBreakdown;
      cached?: boolean;
      friction_signals?: string[];
    }
  >;
}

export interface Province {
  code: string;
  name: string;
}

export interface LocationsResponse {
  provinces?: Province[];
  cities?: string[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search for jobs (fast, no scoring)
 * Use this for instant job display, then fetch scores separately.
 */
export async function searchJobs(
  query: string,
  options: {
    province?: string;
    city?: string;
    page?: number;
    limit?: number;
    jobType?: string;
  } = {},
): Promise<JobsSearchResponse> {
  const {
    province = "",
    city = "",
    page = 1,
    limit = 40,
    jobType = "all",
  } = options;

  const params = new URLSearchParams({
    q: query,
    province,
    city,
    page: page.toString(),
    limit: limit.toString(),
    job_type: jobType,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const API_URL = await getApiUrl();
    const response = await fetch(`${API_URL}/api/jobs/search?${params}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch jobs";
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 30 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch TrueScores for jobs in batches
 * Use after displaying jobs to load scores progressively.
 */
export async function fetchJobScores(
  jobs: RankedJob[],
  resumeText: string = "",
  signal?: AbortSignal,
): Promise<JobScoresResponse> {
  const API_URL = await getApiUrl();
  const response = await fetch(`${API_URL}/api/jobs/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        description: j.description,
        days_ago: j.days_ago,
      })),
      resume_text: resumeText,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch job scores");
  }

  return await response.json();
}

/**
 * Fetch locations (provinces and cities)
 */
export async function fetchLocations(
  province?: string,
): Promise<LocationsResponse> {
  const API_URL = await getApiUrl();
  const url = province
    ? `${API_URL}/api/jobs/locations?province=${encodeURIComponent(province)}`
    : `${API_URL}/api/jobs/locations`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }

  return await response.json();
}

/**
 * Fetch the full job description by scraping the posting URL.
 * Lightweight endpoint — does NOT run TrueScore analysis.
 */
export interface JobPreview {
  description: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  error: string | null;
}

export async function fetchJobPreview(jobUrl: string): Promise<JobPreview> {
  const API_URL = await getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(
      `${API_URL}/api/jobs/preview?url=${encodeURIComponent(jobUrl)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch job preview");
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Job preview request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Progressive Loading Helper Hook
// ============================================================================

/**
 * Apply scores to jobs array
 * Returns new array with scores merged in
 * Always sets loading:false for all jobs
 */
export function mergeJobScores(
  jobs: RankedJob[],
  scores: JobScoresResponse["scores"],
): RankedJob[] {
  return jobs.map((job) => {
    const score = scores[job.id];
    if (score) {
      return {
        ...job,
        true_score: score.true_score,
        risk_level: score.risk_level,
        breakdown: score.breakdown,
        friction_signals: score.friction_signals,
        loading: false,
      };
    }
    // Always clear loading flag even if no score found
    return { ...job, loading: false };
  });
}

/**
 * Chunk an array for batch processing
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
