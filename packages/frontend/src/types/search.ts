export interface FacetPosition {
  dimension: "location" | "seniority" | "skills" | "company_size" | "industry";
  level: string;
  value: string;
  parent_chain: string[];
  child_options: string[];
}

export interface Suggestion {
  text: string; // Display text: "All Quebec (47)"
  type: string; // "narrow_location", "expand_skills", "add_industry"
  reason: string; // "47 jobs in Quebec"
  signal: string; // The value to send back: "Quebec"
  dimension: string; // "location", "seniority", "skills", etc.
}

export interface JobQuery {
  keywords: string[];
  location?: string;
  seniority?: string;
  industry?: string;
  skills?: string[];
  facets: Record<string, FacetPosition>;
}
