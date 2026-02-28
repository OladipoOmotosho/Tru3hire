import { Pathway, CredentialStep } from "@/components/dashboard/RoadmapView";

import { getApiUrl } from "./api-url";

export interface CredentialAnalysisRequest {
  resume_text: string;
  target_role: string;
}

export interface CredentialAnalysisResponse {
  pathway: Omit<Pathway, "steps">; // Backend returns pathway metadata separate from steps
  status: string;
  steps: CredentialStep[];
}

export async function analyzeCredentials(
  resumeText: string,
  targetRole: string,
  token?: string,
): Promise<Pathway | null> {
  try {
    const API_BASE_URL = await getApiUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/credentials/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        resume_text: resumeText,
        target_role: targetRole,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to analyze credentials");
    }

    const data: CredentialAnalysisResponse = await response.json();

    // Map backend response to Frontend Pathway interface
    return {
      ...data.pathway,
      steps: data.steps,
      overallStatus: data.status,
    } as Pathway;
  } catch (error) {
    console.error("Error analyzing credentials:", error);
    return null;
  }
}

export async function getPathwayDefinition(
  role: string,
): Promise<Pathway | null> {
  try {
    const API_BASE_URL = await getApiUrl();
    const response = await fetch(
      `${API_BASE_URL}/api/credentials/pathway?role=${encodeURIComponent(role)}`,
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch pathway");
    }

    const data: CredentialAnalysisResponse = await response.json();

    return {
      ...data.pathway,
      steps: data.steps,
      overallStatus: data.status || "not_started",
    } as Pathway;
  } catch (error) {
    console.error("Error fetching pathway definition:", error);
    return null;
  }
}
