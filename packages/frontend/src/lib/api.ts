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
  hiring_likelihood: number;
  resume_match: number;
  bias_fairness: number;
  company_reputation: number;
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
}

export interface ApiError {
  message: string;
  status: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Analyze a job posting with optional resume for matching
 *
 * @param request - Job text, optional URL and resume file
 * @returns TrueScore analysis results
 */
export async function analyzeJob(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  const formData = new FormData();

  // Add required job text
  formData.append("job_text", request.jobText);

  // Add optional job URL
  if (request.jobUrl) {
    formData.append("job_url", request.jobUrl);
  }

  // Add optional resume file
  if (request.resumeFile) {
    formData.append("resume_file", request.resumeFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.detail || "Failed to analyze job posting",
      status: response.status,
    } as ApiError;
  }

  return response.json();
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
  report: ScamReportRequest
): Promise<ScamReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/report-scam`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.detail || "Failed to submit report",
      status: response.status,
    } as ApiError;
  }

  return response.json();
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
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
}

/**
 * Get user's analysis stats for dashboard
 */
export async function getHistoryStats(): Promise<HistoryStats> {
  const response = await fetch(`${API_BASE_URL}/api/history/stats`);
  if (!response.ok) {
    throw {
      message: "Failed to fetch stats",
      status: response.status,
    } as ApiError;
  }
  const data = await response.json();
  return data.stats;
}

/**
 * Get user's analysis history
 */
export async function getHistory(limit: number = 10): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`);
  if (!response.ok) {
    throw {
      message: "Failed to fetch history",
      status: response.status,
    } as ApiError;
  }
  const data = await response.json();
  return data.items;
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
