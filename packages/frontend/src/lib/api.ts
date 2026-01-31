/**
 * API Service - TrueHire Backend Integration
 *
 * This module handles all communication with the TrueHire backend API.
 */

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ============================================================================
// Types
// ============================================================================

export interface TrueScoreBreakdown {
  authenticity: number;
  hiring_activity: number; // Real market data from job boards
  hiring_likelihood: number; // Legacy alias for hiring_activity
  resume_match: number;
  company_reputation: number;

  // Market activity metadata
  company_job_count?: number; // Jobs from this company on job boards
  similar_title_count?: number; // Similar job titles in market
  market_data_source?: string; // "adzuna" or "fallback"
}

export interface Insight {
  type: "warning" | "positive" | "tip";
  icon: string;
  message: string;
}

export interface Recommendation {
  action: string;
  impact: "high" | "medium" | "low";
}

export interface CompanyInfo {
  company_name: string | null;
  status: string;
  status_label: string;
  risk_level: string;
  confidence: number;
  matched_name: string | null;
  notes: string | null;
}

export interface AnalysisResponse {
  true_score: number;
  risk_level: "safe" | "caution" | "danger";
  breakdown: TrueScoreBreakdown;
  insights: Insight[];
  recommendations: Recommendation[];
  company: CompanyInfo | null;
}

export interface AnalysisRequest {
  jobText: string;
  jobUrl?: string;
  resumeFile?: File;
  resumeText?: string; // For using saved resume from Clerk metadata
  userId?: string;
  userSkills?: string[]; // For skills gap analysis
  userPreferences?: {
    job_type?: string;
    employment_type?: string;
  };
}

export interface SkillGap {
  skill: string;
  count: number;
  last_seen: string;
}

export interface SkillGapResponse {
  skills: SkillGap[];
}

export interface ApiError {
  message: string;
  status: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generic API request wrapper
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.detail || `Request failed: ${response.statusText}`,
      status: response.status,
    } as ApiError;
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Analyze a job posting with optional resume for matching
 *
 * @param request - Job text, optional URL and resume file
 * @returns TrueScore analysis results
 */
export async function analyzeJob(
  req: AnalysisRequest,
): Promise<AnalysisResponse> {
  const formData = new FormData();

  // Add required job text
  formData.append("job_text", req.jobText);

  // Add optional job URL
  if (req.jobUrl) {
    formData.append("job_url", req.jobUrl);
  }

  // Add optional user ID for history
  if (req.userId) {
    formData.append("user_id", req.userId);
  }

  // Add optional resume file
  if (req.resumeFile) {
    formData.append("resume_file", req.resumeFile);
  }

  // Add optional resume text (for saved resume from profile)
  if (req.resumeText) {
    formData.append("resume_text", req.resumeText);
  }

  // Add optional user skills for gap analysis
  if (req.userSkills && req.userSkills.length > 0) {
    formData.append("user_skills", JSON.stringify(req.userSkills));
  }

  // Add optional user preferences for preference matching
  if (req.userPreferences) {
    formData.append("user_preferences", JSON.stringify(req.userPreferences));
  }

  return request<AnalysisResponse>("/api/analyze", {
    method: "POST",
    body: formData,
  });
}

/**
 * Check if the API is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// URL Analysis Types & API
// ============================================================================

export interface ScrapedMetadata {
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  source_domain: string;
}

export interface UrlAnalysisResponse extends AnalysisResponse {
  scraped: ScrapedMetadata;
}

/**
 * Analyze a job posting from a URL
 *
 * @param jobUrl - The URL of the job posting to analyze
 * @returns TrueScore analysis results with scraped metadata
 */
export async function analyzeJobUrl(
  jobUrl: string,
): Promise<UrlAnalysisResponse> {
  const formData = new FormData();
  formData.append("job_url", jobUrl);

  return request<UrlAnalysisResponse>("/api/analyze-url", {
    method: "POST",
    body: formData,
  });
}

// ============================================================================
// Scam Report Types & API
// ============================================================================

export interface ScamReportRequest {
  job_url?: string;
  job_text: string;
  reason: string;
  email?: string;
}

export interface ScamReportResponse {
  success: boolean;
  message: string;
  report_id: number;
}

/**
 * Submit a scam report
 *
 * @param report - The scam report data
 * @returns Success response with report ID
 */
export async function submitScamReport(
  report: ScamReportRequest,
): Promise<ScamReportResponse> {
  return request<ScamReportResponse>("/api/report-scam", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });
}

// ============================================================================
// History API Functions
// ============================================================================

export interface HistoryStats {
  total_analyses: number;
  avg_score: number;
  danger_count: number;
  safe_count: number;
}

export interface HistoryItem {
  id: number;
  job_text: string;
  job_url?: string;
  true_score: number;
  risk_level: string;
  created_at: string;
  breakdown?: TrueScoreBreakdown;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
}

/**
 * Get user's analysis stats for dashboard
 * @param userId - Clerk user ID for filtering (required for user-specific data)
 */
export async function getHistoryStats(userId?: string): Promise<HistoryStats> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const data = await request<{ stats: HistoryStats }>(
    `/api/history/stats${params}`,
  );
  return data.stats;
}

/**
 * Get user's analysis history
 * @param limit - Number of items to return
 * @param userId - Clerk user ID for filtering (required for user-specific data)
 */
export async function getHistory(
  limit: number = 20,
  userId?: string,
): Promise<HistoryItem[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (userId) {
    params.append("user_id", userId);
  }

  const data = await request<HistoryResponse>(`/api/history?${params}`);
  return data.items;
}

/**
 * Get a single analysis by ID
 * @param id - Analysis ID
 */
export async function getAnalysis(id: number | string): Promise<HistoryItem> {
  return request<HistoryItem>(`/api/history/${id}`);
}

// ============================================================================
// Skill Gap API Functions
// ============================================================================
// Note: SkillGap interface is defined above near line 67

export interface SkillGapResponse {
  skills: SkillGap[];
}

/**
 * Get aggregated skill gaps for a user
 */
export async function getUserSkillGaps(
  userId: string,
  limit: number = 5,
): Promise<SkillGap[]> {
  const params = new URLSearchParams({
    user_id: userId,
    limit: limit.toString(),
  });

  const data = await request<SkillGapResponse>(`/api/skill-gaps?${params}`);
  return data.skills;
}

/**
 * Ignore a specific skill gap for a user
 */
export async function ignoreSkillGap(
  userId: string,
  skill: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/api/skill-gaps/ignore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, skill }),
  });
}

// ============================================================================
// Resume Parsing API
// ============================================================================

export interface ParsedWorkExperience {
  title: string;
  company: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  is_current: boolean;
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string | null;
  field: string | null;
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  location: string | null;
  skills: string[];
  experience: ParsedWorkExperience[];
  education: ParsedEducation[];
  years_of_experience: number | null;
  raw_text: string;
}

export interface ResumeParseResponse {
  success: boolean;
  data: ParsedResume;
}

/**
 * Upload and parse a resume file
 *
 * @param file - PDF or DOCX resume file
 * @returns Parsed resume data
 */
export async function uploadResume(file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await request<ResumeParseResponse>("/api/resume/parse", {
    method: "POST",
    body: formData,
  });
  return result.data;
}

/**
 * Upload and parse a resume file with progress tracking
 *
 * @param file - PDF or DOCX resume file
 * @param onProgress - Callback with progress percentage (0-100)
 * @returns Parsed resume data
 */
export function uploadResumeWithProgress(
  file: File,
  onProgress: (progress: number) => void,
): Promise<ParsedResume> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result: ResumeParseResponse = JSON.parse(xhr.responseText);
          resolve(result.data);
        } catch {
          reject({
            message: "Invalid response from server",
            status: xhr.status,
          } as ApiError);
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject({
            message: errorData.detail || "Failed to parse resume",
            status: xhr.status,
          } as ApiError);
        } catch {
          reject({
            message: "Failed to parse resume",
            status: xhr.status,
          } as ApiError);
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject({ message: "Network error during upload", status: 0 } as ApiError);
    });

    xhr.addEventListener("abort", () => {
      reject({ message: "Upload cancelled", status: 0 } as ApiError);
    });

    xhr.open("POST", `${API_BASE_URL}/api/resume/parse`);
    xhr.send(formData);
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the risk level color for UI display
 */
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case "safe":
      return "green";
    case "caution":
      return "yellow";
    case "danger":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get the score color based on value
 */
export function getScoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

// ============================================================================
// Application Tracking API (Phase 2)
// ============================================================================

export interface ApplicationData {
  job_title: string;
  company_name: string;
  job_id?: string;
  job_url?: string;
  true_score_at_apply?: number;
  job_age_days?: number;
}

export interface Application {
  id: number;
  job_id?: string;
  job_title: string;
  company_name: string;
  job_url?: string;
  true_score_at_apply?: number;
  job_age_days?: number;
  applied_at: string;
  outcome?: string;
  days_to_response?: number;
}

export interface ApplicationStats {
  total_applications: number;
  tracked_outcomes: number;
  no_response: number;
  rejected: number;
  interviews: number;
  offers: number;
  avg_days_to_response?: number;
  avg_truescore_applied?: number;
  response_rate?: number;
  interview_rate?: number;
}

/**
 * Log a new job application
 * Requires auth token for JWT verification
 */
export async function logApplication(
  authToken: string,
  data: ApplicationData,
): Promise<{ success: boolean; application_id: number }> {
  return request<{ success: boolean; application_id: number }>(
    "/api/applications",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    },
  );
}

/**
 * Get user's applications
 */
export async function getUserApplications(
  userId: string,
  limit: number = 50,
): Promise<{ applications: Application[]; count: number }> {
  return request<{ applications: Application[]; count: number }>(
    `/api/applications?user_id=${encodeURIComponent(userId)}&limit=${limit}`,
  );
}

/**
 * Get applications pending feedback
 */
export async function getPendingFeedback(
  userId: string,
  daysThreshold: number = 7,
): Promise<{ pending: Application[]; count: number }> {
  return request<{ pending: Application[]; count: number }>(
    `/api/applications/pending?user_id=${encodeURIComponent(
      userId,
    )}&days_threshold=${daysThreshold}`,
  );
}

/**
 * Report application outcome
 */
export async function reportOutcome(
  applicationId: number,
  outcome: "no_response" | "rejected" | "interview" | "offer",
  daysToResponse?: number,
  notes?: string,
): Promise<{ success: boolean; outcome_id: number }> {
  return request<{ success: boolean; outcome_id: number }>(
    `/api/applications/${applicationId}/outcome`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome,
        days_to_response: daysToResponse,
        notes,
      }),
    },
  );
}

/**
 * Get user's application statistics
 */
export async function getApplicationStats(
  userId: string,
): Promise<ApplicationStats> {
  return request<ApplicationStats>(
    `/api/applications/stats?user_id=${encodeURIComponent(userId)}`,
  );
}

/**
 * Get company response stats
 */
export async function getCompanyStats(companyName: string): Promise<{
  company_name: string;
  total_applications: number;
  response_rate?: number;
  avg_response_days?: number;
}> {
  return request<{
    company_name: string;
    total_applications: number;
    response_rate?: number;
    avg_response_days?: number;
  }>(`/api/applications/companies/${encodeURIComponent(companyName)}/stats`);
}
