import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ScoreGauge } from "../components/ScoreGauge";
import { MetricCard, METRIC_CONFIGS } from "../components/MetricCard";
import { InsightCard, RecommendationCard } from "../components/InsightCard";
import { CompanyVerificationCard } from "../components/CompanyVerificationCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageWrapper } from "../components/PageWrapper";
import {
  ArrowLeft,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { analyzeJobPosting, AnalysisResult } from "../lib/scamDetection";
import { AnalysisResponse } from "../lib/api";
import { useUser } from "@clerk/clerk-react";

// ============================================================================
// Types
// ============================================================================

interface LocationState {
  jobText: string;
  apiResult?: AnalysisResponse;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format market activity data as a subtitle string
 */
function formatMarketDataSubtitle(
  breakdown: AnalysisResponse["breakdown"]
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

// ============================================================================
// Helper Components
// ============================================================================

function RiskBadge({ level }: { level: string }) {
  const config = {
    safe: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-400",
      label: "Low Risk",
    },
    caution: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Moderate Risk",
    },
    danger: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      label: "High Risk",
    },
  }[level] || { bg: "bg-gray-100", text: "text-gray-700", label: "Unknown" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      {level === "safe" && <CheckCircle2 className="w-4 h-4" />}
      {level === "caution" && <AlertCircle className="w-4 h-4" />}
      {level === "danger" && <AlertCircle className="w-4 h-4" />}
      {config.label}
    </span>
  );
}

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

  // Check if user has completed onboarding
  const hasOnboarded =
    isUserLoaded && user?.unsafeMetadata?.hasCompletedOnboarding === true;

  const state = location.state as LocationState | null;
  const jobText = state?.jobText;

  useEffect(() => {
    if (!jobText) {
      navigate("/analyze");
      return;
    }

    if (state?.apiResult) {
      setApiResult(state.apiResult);
      setIsLoading(false);
      return;
    }

    const runAnalysis = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const analysisResult = analyzeJobPosting(jobText);
      setResult(analysisResult);
      setIsLoading(false);
    };

    runAnalysis();
  }, [jobText, navigate, state?.apiResult]);

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
    : result?.trustScore ?? 0;
  const displayRiskLevel = hasApiResult
    ? apiResult.risk_level
    : result?.riskLevel ?? "safe";

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

      {/* Main Results Card */}
      <Card className="p-6 md:p-8 mb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Analysis Complete</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {hasOnboarded ? "Your TrueScore Results" : "Authenticity Score"}
          </h1>

          <RiskBadge level={displayRiskLevel} />
        </div>

        {/* Company Verification (Step 1) */}
        {hasApiResult && apiResult.company && (
          <div className="mb-8">
            <CompanyVerificationCard company={apiResult.company} />
          </div>
        )}

        {/* Score Display */}
        <div className="flex justify-center mb-8">
          <ScoreGauge
            score={displayScore}
            size={200}
            strokeWidth={12}
            riskLevel={displayRiskLevel}
            animated={true}
          />
        </div>

        {/* Quick Stats - Only for onboarded users */}
        {hasApiResult && hasOnboarded && (
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {apiResult.insights.filter((i) => i.type === "positive").length}
              </p>
              <p className="text-xs text-muted-foreground">Positives</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {apiResult.insights.filter((i) => i.type === "warning").length}
              </p>
              <p className="text-xs text-muted-foreground">Concerns</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {apiResult.recommendations.length}
              </p>
              <p className="text-xs text-muted-foreground">Actions</p>
            </div>
          </div>
        )}

        {/* Score Breakdown - Only for onboarded users */}
        {hasApiResult && hasOnboarded && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Score Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label={METRIC_CONFIGS.authenticity.label}
                score={apiResult.breakdown.authenticity}
                icon={METRIC_CONFIGS.authenticity.icon}
                tooltip={METRIC_CONFIGS.authenticity.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.hiringLikelihood.label}
                score={
                  apiResult.breakdown.hiring_activity ??
                  apiResult.breakdown.hiring_likelihood
                }
                icon={METRIC_CONFIGS.hiringLikelihood.icon}
                tooltip={METRIC_CONFIGS.hiringLikelihood.tooltip}
                subtitle={formatMarketDataSubtitle(apiResult.breakdown)}
              />
              <MetricCard
                label={METRIC_CONFIGS.resumeMatch.label}
                score={apiResult.breakdown.resume_match}
                icon={METRIC_CONFIGS.resumeMatch.icon}
                tooltip={METRIC_CONFIGS.resumeMatch.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.companyReputation.label}
                score={apiResult.breakdown.company_reputation}
                icon={METRIC_CONFIGS.companyReputation.icon}
                tooltip={METRIC_CONFIGS.companyReputation.tooltip}
              />
            </div>
          </div>
        )}

        {/* Simplified explainer for non-onboarded users */}
        {hasApiResult && !hasOnboarded && (
          <div className="mb-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              This score indicates how likely this job posting is to be
              legitimate.
              <br />
              <Link
                to="/sign-up"
                className="text-primary hover:underline font-medium"
              >
                Create an account
              </Link>{" "}
              to unlock personalized job matching, hiring activity data, and
              more.
            </p>
          </div>
        )}
      </Card>

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
