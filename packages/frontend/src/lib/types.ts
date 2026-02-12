// TrueScore breakdown metrics
export interface TrueScoreMetrics {
  authenticity: number;
  hiringLikelihood: number;
  resumeMatch: number;
  recency?: number;
  companyReputation: number;
}

// Job posting interface
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description: string;
  requirements: string[];
  postedDate: string;
  /** Display string from API (e.g. "$80k-$158k/yr") when structured salary not available */
  salaryDisplay?: string;
  trueScore: number | null;
  trueScoreMetrics: TrueScoreMetrics;
  tags: string[];
  isVerified: boolean;
  isFreshPosting: boolean;
  isDiversityFriendly: boolean;
  hasInsights: boolean;
  jobType?: string;
  experienceLevel?: string;
  url?: string;
  // Phase 3: Eligibility
  eligibilityScore?: number;
  eligibilityBadges?: string[];
}

// Company information
export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  size: string;
  website?: string;
  reputationScore: number;
  glassdoorRating?: number;
  diversityScore?: number;
  openPositions: number;
}

// Company insights
export interface CompanyInsights {
  company: Company;
  reviewsSummary: string;
  redditMentions: number;
  pros: string[];
  cons: string[];
  interviewExperiences: string[];
  hiringActivity: {
    averageTimeToHire: number;
    recentHires: number;
  };
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  resumeUrl?: string;
  skills: string[];
  experience: Experience[];
  preferences: JobPreferences;
}

// Experience timeline
export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
}

// Job preferences
export interface JobPreferences {
  desiredTitles: string[];
  industries: string[];
  salaryMin?: number;
  workArrangement: "remote" | "hybrid" | "onsite" | "any";
  locations: string[];
}

// Skill gap analysis
export interface SkillGap {
  skill: string;
  frequency: number;
  priority: "high" | "medium" | "low";
}

// Course recommendation
export interface CourseRecommendation {
  title: string;
  platform: string;
  duration: string;
  cost: string;
  url: string;
  relevance: string;
  skillsCovered: string[];
}

// Application status
export type ApplicationStatus =
  | "interested"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

// Application tracking
export interface Application {
  id: string;
  job: JobPosting;
  status: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
}

// Filter options
export interface JobFilters {
  trueScoreMin?: number;
  trueScoreMax?: number;
  industries?: string[];
  experienceLevels?: string[];
  postedWithinDays?: number;
  companySize?: string[];
  verifiedOnly?: boolean;
  freshPostingsOnly?: boolean;
  diversityFriendlyOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  locations?: string[];
  jobTypes?: string[];
}
