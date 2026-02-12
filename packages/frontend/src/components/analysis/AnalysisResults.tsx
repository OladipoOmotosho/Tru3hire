import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield } from "lucide-react";
import { Card } from "../ui/card";
import { RiskBadge } from "../RiskBadge";
import { CompanyVerificationCard } from "../CompanyVerificationCard";
import { ScoreGauge } from "../ScoreGauge";
import { MetricCard, METRIC_CONFIGS } from "../MetricCard";
import { AnalysisResponse } from "@/lib/api";
import { AnalysisResult } from "@/lib/scamDetection";

interface AnalysisResultsProps {
  apiResult: AnalysisResponse | null;
  localResult: AnalysisResult | null;
  hasOnboarded: boolean;
}

// Helper for subtitle
function formatMarketDataSubtitle(
  breakdown: AnalysisResponse["breakdown"],
): string | undefined {
  if (!breakdown) return undefined;

  const companyJobs = breakdown.company_job_count;
  const similarTitles = breakdown.similar_title_count;
  const source = breakdown.market_data_source;

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

export function AnalysisResults({
  apiResult,
  localResult,
  hasOnboarded,
}: AnalysisResultsProps) {
  const hasApiResult = apiResult !== null;

  // For non-onboarded users: show only Authenticity score; guard against missing breakdown
  const displayScore = hasApiResult
    ? hasOnboarded
      ? apiResult.true_score
      : (apiResult.breakdown?.authenticity ?? localResult?.trustScore ?? 0)
    : (localResult?.trustScore ?? 0);

  const displayRiskLevel = hasApiResult
    ? apiResult.risk_level
    : (localResult?.riskLevel ?? "safe");

  const counts = useMemo(() => {
    if (!apiResult) {
      return { positives: 0, warnings: 0, actions: 0 };
    }
    return {
      positives: apiResult.insights.filter((i) => i.type === "positive").length,
      warnings: apiResult.insights.filter((i) => i.type === "warning").length,
      actions: apiResult.recommendations.length,
    };
  }, [apiResult]);

  if (!hasApiResult && !localResult) return null;

  return (
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

      {/* Company Verification */}
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
          <div className="text-center p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              {counts.positives}
            </p>
            <p className="text-xs text-muted-foreground">Positives</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
            <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
              {counts.warnings}
            </p>
            <p className="text-xs text-muted-foreground">Concerns</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-info-50 dark:bg-info-900/20">
            <p className="text-2xl font-bold text-info-600 dark:text-info-400">
              {counts.actions}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <MetricCard
              label={METRIC_CONFIGS.authenticity.label}
              score={apiResult.breakdown?.authenticity ?? 0}
              icon={METRIC_CONFIGS.authenticity.icon}
              tooltip={METRIC_CONFIGS.authenticity.tooltip}
            />
            <MetricCard
              label={METRIC_CONFIGS.hiringLikelihood.label}
              score={
                apiResult.breakdown?.hiring_activity ??
                apiResult.breakdown?.hiring_likelihood ??
                0
              }
              icon={METRIC_CONFIGS.hiringLikelihood.icon}
              tooltip={METRIC_CONFIGS.hiringLikelihood.tooltip}
              subtitle={formatMarketDataSubtitle(apiResult.breakdown)}
            />
            <MetricCard
              label={METRIC_CONFIGS.resumeMatch.label}
              score={apiResult.breakdown?.resume_match ?? 0}
              icon={METRIC_CONFIGS.resumeMatch.icon}
              tooltip={METRIC_CONFIGS.resumeMatch.tooltip}
            />
            <MetricCard
              label={METRIC_CONFIGS.recency.label}
              score={apiResult.breakdown?.recency ?? 0}
              icon={METRIC_CONFIGS.recency.icon}
              tooltip={METRIC_CONFIGS.recency.tooltip}
            />
            <MetricCard
              label={METRIC_CONFIGS.companyReputation.label}
              score={apiResult.breakdown?.company_reputation ?? 0}
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
            to unlock personalized job matching, hiring activity data, and more.
          </p>
        </div>
      )}
    </Card>
  );
}
