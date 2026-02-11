import { Pathway } from "@/components/dashboard/RoadmapView";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface CredentialAnalysisRequest {
  resume_text: string;
  target_role: string;
}

export interface CredentialAnalysisResponse {
  pathway: Omit<Pathway, "steps">; // Backend returns pathway metadata separate from steps
  status: string;
  steps: any[]; // Adjust to match frontend Step type
}

export async function analyzeCredentials(
  resumeText: string,
  targetRole: string,
): Promise<Pathway | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/credentials/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      overallStatus: data.status as any,
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
      overallStatus: "not_started", // Default for definition
    } as Pathway;
  } catch (error) {
    console.error("Error fetching pathway definition:", error);
    return null;
  }
}
