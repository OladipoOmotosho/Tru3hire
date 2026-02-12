/**
 * Discover API Service
 *
 * API client for AI-powered job discovery.
 * Stateless design - frontend manages refinement context.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ============================================================================
// Types
// ============================================================================

export interface ScoreBreakdown {
  authenticity: number;
  hiring_activity: number;
  hiring_likelihood?: number;
  resume_match: number;
  company_reputation: number;
  recency?: number;
}

export interface DiscoveredJob {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary_display: string;
  category: string;
  days_ago: number;
  redirect_url: string;
  true_score: number;
  risk_level?: string;
  breakdown: ScoreBreakdown;
}

export interface ParsedQuery {
  keywords: string[];
  seniority: string | null;
  exclude_terms: string[];
  job_type: string | null;
  company_traits: string[];
  industry_preferences: string[];
  role_title: string | null;
  location_preference: string | null;
  city_preference: string | null;
  original_query: string;
  signals: string[];
  facets: Record<string, unknown>;
}

export interface Refinement {
  text: string;
  type: "filter" | "broaden" | "specify";
  reason: string;
  signal: string;
}

export interface FacetSuggestion {
  text: string;
  type: string; // "narrow_location", "expand_skills", "add_industry", etc.
  reason: string;
  signal: string;
  dimension: string; // "location", "seniority", "skills", "company_size", "industry"
}

export interface DiscoverResponse {
  jobs: DiscoveredJob[];
  total: number;
  page: number;
  parsed_query: ParsedQuery;
  suggestions: Refinement[];
  facet_suggestions: FacetSuggestion[];
  excluded_count: number;
  debug?: {
    signals: string[];
    fallback_used: boolean;
    distribution: Record<string, unknown>;
  };
}

export interface DiscoverRequest {
  query: string;
  refinements?: string[];
  page?: number;
  limit?: number;
  province?: string;
  city?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Discover jobs using natural language query.
 *
 * Pipeline:
 * 1. Extract signals from query (Gemini or fallback)
 * 2. Resolve to structured query (deterministic rules)
 * 3. Search and rank jobs
 * 4. Return with refinement suggestions
 */
export async function discoverJobs(
  request: DiscoverRequest,
): Promise<DiscoverResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const response = await fetch(`${API_URL}/api/jobs/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: request.query,
        refinements: request.refinements || [],
        page: request.page || 1,
        limit: request.limit || 40,
        province: request.province || "",
        city: request.city || "",
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to discover jobs";
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorBody.detail || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 45 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Debug endpoint: Extract signals from a query without searching.
 */
export async function extractSignals(query: string): Promise<{
  query: string;
  signals: string[];
  fallback_used: boolean;
  parsed_query: ParsedQuery;
}> {
  const response = await fetch(`${API_URL}/api/jobs/discover/signals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to extract signals");
  }

  return await response.json();
}
