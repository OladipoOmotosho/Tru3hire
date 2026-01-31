import React, { useState, useEffect, useCallback } from "react";
import {
  useLocation,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, RotateCcw, Shield } from "lucide-react";
import { analyzeJobPosting, AnalysisResult } from "../lib/scamDetection";
import { AnalysisResponse } from "../lib/api";
import { useUser } from "@clerk/clerk-react";
import { AnalysisResults } from "../components/analysis/AnalysisResults";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageWrapper } from "../components/PageWrapper";
import { Lightbulb, ChevronRight } from "lucide-react";
import { InsightCard, RecommendationCard } from "../components/InsightCard";

// ============================================================================
// Types
// ============================================================================

interface UserMetadata {
  skills?: string[];
  preferences?: {
    job_type?: string;
    employment_type?: string;
  };
  hasCompletedOnboarding?: boolean;
  parsedResume?: {
    raw_text?: string;
  };
}

function getUserMetadata(user: any): UserMetadata {
  return (user?.unsafeMetadata || {}) as UserMetadata;
}

interface LocationState {
  jobText: string;
  apiResult?: AnalysisResponse;
  needsAnalysis?: boolean; // When true, call API for fresh TrueScore
  jobMeta?: {
    title?: string;
    company?: string;
    location?: string;
    days_ago?: number;
    salary?: string;
  };
  externalUrl?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format market activity data as a subtitle string
 */
function formatMarketDataSubtitle(
  breakdown: AnalysisResponse["breakdown"],
): string | undefined {
  const companyJobs = breakdown.company_job_count;
  const similarTitles = breakdown.similar_title_count;
  const source = breakdown.market_data_source;

  // Don't show subtitle if using fallback or no data
  if (
    source === "fallback" ||
    source === "fallback_keywords" ||
    (!companyJobs && !similarTitles)
  ) {
    return undefined;
  }

  const parts: string[] = [];

  if (companyJobs && companyJobs > 0) {
    parts.push(`${companyJobs} open position${companyJobs > 1 ? "s" : ""}`);
  }

  if (similarTitles && similarTitles > 0) {
    const formatted =
      similarTitles >= 1000
        ? `${(similarTitles / 1000).toFixed(1)}k`
        : similarTitles.toString();
    parts.push(`${formatted}+ similar roles`);
  }

  return parts.length > 0 ? parts.join(" • ") : undefined;
}

// RiskBadge imported defined in separated component

// ============================================================================
// Main Component
// ============================================================================

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiResult, setApiResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const meta = getUserMetadata(user);

  // Check if user has completed onboarding
  const hasOnboarded = isUserLoaded && meta.hasCompletedOnboarding === true;

  // Get user's resume text for personalized matching
  const resumeText = meta.parsedResume?.raw_text || "";

  const state = location.state as LocationState | null;
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("id");
  const [jobText, setJobText] = useState<string>("");

  const fetchAnalysisById = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const { getAnalysis } = await import("../lib/api");
        const historyItem = await getAnalysis(id);

        if (!historyItem) {
          throw new Error("Analysis not found");
        }

        setJobText(historyItem.job_text);

        // Construct partial response from history
        setApiResult({
          true_score: historyItem.true_score,
          risk_level: historyItem.risk_level as "safe" | "caution" | "danger",
          breakdown: historyItem.breakdown || {
            authenticity: 0,
            hiring_activity: 0,
            hiring_likelihood: 0,
            resume_match: 0,
            company_reputation: 0,
          },
          insights: [], // Not stored in DB
          recommendations: [], // Not stored in DB
          company: null, // Could parse from job_text or breakdown but keeping simple
        });
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
        navigate("/analyze");
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const runFreshAnalysis = useCallback(
    async (text: string) => {
      // ... existing logic ...
      setIsLoading(true);
      try {
        const { analyzeJob } = await import("../lib/api");

        // Get user skills from metadata for skills gap analysis
        const userSkills = meta.skills || [];

        // Get user preferences for preference matching
        const userPreferences = meta.preferences;

        const response = await analyzeJob({
          jobText: text,
          resumeText: resumeText || undefined,
          userId: user?.id,
          userSkills: userSkills.length > 0 ? userSkills : undefined,
          userPreferences: userPreferences,
        });

        if (response) {
          setApiResult(response);
        } else {
          throw new Error("No response from API");
        }
      } catch (error) {
        console.error("TrueScore analysis failed:", error);
        // Fall back to local analysis
        const analysisResult = analyzeJobPosting(text);
        setResult(analysisResult);
      } finally {
        setIsLoading(false);
      }
    },
    [meta.skills, meta.preferences, resumeText, user?.id],
  );

  const runLocalAnalysis = useCallback(async (text: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const analysisResult = analyzeJobPosting(text);
    setResult(analysisResult);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // 1. If we have state from navigation (Dashboard/Analyze), use it
    if (state?.jobText) {
      setJobText(state.jobText);
      if (state.apiResult) {
        setApiResult(state.apiResult);
        setIsLoading(false);
      } else if (state.needsAnalysis) {
        // ... logic for fresh analysis ...
        runFreshAnalysis(state.jobText); // Extracted to function
      } else {
        // Fallback to local
        runLocalAnalysis(state.jobText);
      }
      return;
    }

    // 2. If no state, try fetching by ID (Refresh scenario)
    if (analysisId && user?.id) {
      fetchAnalysisById(analysisId);
      return;
    }

    // 3. Neither state nor ID -> Redirect
    navigate("/analyze");
  }, [
    state,
    analysisId,
    user?.id,
    navigate,
    fetchAnalysisById,
    runFreshAnalysis,
    runLocalAnalysis,
  ]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner message="Analyzing job posting..." />
          <p className="text-sm text-muted-foreground mt-4">
            Running AI scam detection...
          </p>
        </div>
      </div>
    );
  }

  const hasApiResult = apiResult !== null;

  // For non-onboarded users: show only Authenticity score
  // For onboarded users: show full TrueScore
  const displayScore = hasApiResult
    ? hasOnboarded
      ? apiResult.true_score
      : apiResult.breakdown.authenticity
    : (result?.trustScore ?? 0);
  const displayRiskLevel = hasApiResult
    ? apiResult.risk_level
    : (result?.riskLevel ?? "safe");

  if (!hasApiResult && !result) return null;

  return (
    <PageWrapper withNavbarOffset={true} withPadding={true} maxWidth="4xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link to="/analyze">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Analyze Another
          </Button>
        </Link>
      </div>

      <AnalysisResults
        apiResult={apiResult}
        localResult={result}
        hasOnboarded={hasOnboarded}
      />

      {/* Insights Section */}
      {hasApiResult && apiResult.insights.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Key Insights
          </h2>
          <div className="space-y-3">
            {apiResult.insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type as "positive" | "warning" | "tip"}
                icon={insight.icon}
                message={insight.message}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations Section */}
      {hasApiResult && apiResult.recommendations.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-primary" />
            Recommended Actions
          </h2>
          <div className="space-y-2">
            {apiResult.recommendations.map((rec, index) => (
              <RecommendationCard
                key={index}
                action={rec.action}
                impact={rec.impact as "high" | "medium" | "low"}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Fallback for client-side analysis */}
      {!hasApiResult && result && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
          <p className="text-muted-foreground">{result.summary}</p>
          {result.redFlags.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.redFlags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500">⚠️</span>
                  <span>{flag.description}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Link to="/analyze">
          <Button variant="default" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Analyze Another Job
          </Button>
        </Link>
        {/* Only show Create Account for non-logged-in users */}
        {(!isUserLoaded || !user) && (
          <Link to="/sign-up">
            <Button variant="outline" className="gap-2">
              Create Free Account
            </Button>
          </Link>
        )}
        {/* Show Dashboard link for logged-in users */}
        {isUserLoaded && user && (
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              Go to Dashboard
            </Button>
          </Link>
        )}
      </div>

      {/* Safety Tips - Clean Card */}
      <Card className="p-6 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Stay Safe During Your Job Search
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
              ✓ Do This
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Research company on LinkedIn & Glassdoor</li>
              <li>• Verify job on company's official website</li>
              <li>• Check for real employee profiles</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
              ✗ Avoid This
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Never pay fees to apply or get hired</li>
              <li>• Don't share SSN or banking details early</li>
              <li>• Avoid "too good to be true" offers</li>
            </ul>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
