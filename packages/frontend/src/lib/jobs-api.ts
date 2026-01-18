/**
 * Jobs API Service - Progressive Loading
 *
 * Optimized job search with instant display + background scoring.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
}

export interface JobsSearchResponse {
  jobs: RankedJob[];
  total: number;
  page: number;
  query: string;
  province?: string;
  city?: string;
  error?: string;
}

export interface JobScoresResponse {
  scores: Record<
    string,
    {
      true_score: number;
      risk_level: string;
      breakdown: JobBreakdown;
      cached?: boolean;
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

  const response = await fetch(`${API_URL}/api/jobs/search?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return response.json();
}

/**
 * Fetch TrueScores for jobs in batches
 * Use after displaying jobs to load scores progressively.
 */
export async function fetchJobScores(
  jobs: RankedJob[],
  resumeText: string = "",
): Promise<JobScoresResponse> {
  const response = await fetch(`${API_URL}/api/jobs/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  return response.json();
}

/**
 * Fetch locations (provinces and cities)
 */
export async function fetchLocations(
  province?: string,
): Promise<LocationsResponse> {
  const url = province
    ? `${API_URL}/api/jobs/locations?province=${encodeURIComponent(province)}`
    : `${API_URL}/api/jobs/locations`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }

  return response.json();
}

// ============================================================================
// Progressive Loading Helper Hook
// ============================================================================

/**
 * Apply scores to jobs array
 * Returns new array with scores merged in
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
        loading: false,
      };
    }
    return job;
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
