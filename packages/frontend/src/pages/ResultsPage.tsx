import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ScoreGauge } from "../components/ScoreGauge";
import { MetricCard, METRIC_CONFIGS } from "../components/MetricCard";
import { InsightCard, RecommendationCard } from "../components/InsightCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  ArrowLeft,
  Shield,
  Share2,
  Download,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { analyzeJobPosting, AnalysisResult } from "../lib/scamDetection";
import { AnalysisResponse } from "../lib/api";

// ============================================================================
// Types
// ============================================================================

interface LocationState {
  jobText: string;
  apiResult?: AnalysisResponse;
}

// ============================================================================
// Component
// ============================================================================

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiResult, setApiResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          <LoadingSpinner message="Analyzing your job posting..." />
          <p className="text-sm text-muted-foreground mt-4">
            Running AI analysis on 5 dimensions...
          </p>
        </div>
      </div>
    );
  }

  const hasApiResult = apiResult !== null;
  const displayScore = hasApiResult
    ? apiResult.true_score
    : result?.trustScore ?? 0;
  const displayRiskLevel = hasApiResult
    ? apiResult.risk_level
    : result?.riskLevel ?? "safe";

  if (!hasApiResult && !result) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ================================================================== */}
      {/* HERO SECTION - Score Display */}
      {/* ================================================================== */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link to="/analyze">
              <Button
                variant="ghost"
                className="mb-8 text-slate-300 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Analyze Another
              </Button>
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI Analysis Complete
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Your TrueScore Results
              </h1>
              <p className="text-slate-400">
                Based on our 5-dimension AI analysis
              </p>
            </div>

            {/* Score Gauge */}
            <div className="flex justify-center mb-8">
              <ScoreGauge
                score={displayScore}
                size={220}
                strokeWidth={14}
                riskLevel={displayRiskLevel}
                animated={true}
              />
            </div>

            {/* Quick Stats */}
            {hasApiResult && (
              <div className="flex justify-center gap-4 flex-wrap">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">
                    {
                      apiResult.insights.filter((i) => i.type === "positive")
                        .length
                    }
                  </p>
                  <p className="text-xs text-slate-400">Positives</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">
                    {
                      apiResult.insights.filter((i) => i.type === "warning")
                        .length
                    }
                  </p>
                  <p className="text-xs text-slate-400">Concerns</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">
                    {apiResult.recommendations.length}
                  </p>
                  <p className="text-xs text-slate-400">Actions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Score Breakdown */}
        {hasApiResult && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Score Breakdown
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                label={METRIC_CONFIGS.authenticity.label}
                score={apiResult.breakdown.authenticity}
                icon={METRIC_CONFIGS.authenticity.icon}
                tooltip={METRIC_CONFIGS.authenticity.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.hiringLikelihood.label}
                score={apiResult.breakdown.hiring_likelihood}
                icon={METRIC_CONFIGS.hiringLikelihood.icon}
                tooltip={METRIC_CONFIGS.hiringLikelihood.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.resumeMatch.label}
                score={apiResult.breakdown.resume_match}
                icon={METRIC_CONFIGS.resumeMatch.icon}
                tooltip={METRIC_CONFIGS.resumeMatch.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.biasAndFairness.label}
                score={apiResult.breakdown.bias_fairness}
                icon={METRIC_CONFIGS.biasAndFairness.icon}
                tooltip={METRIC_CONFIGS.biasAndFairness.tooltip}
              />
              <MetricCard
                label={METRIC_CONFIGS.companyReputation.label}
                score={apiResult.breakdown.company_reputation}
                icon={METRIC_CONFIGS.companyReputation.icon}
                tooltip={METRIC_CONFIGS.companyReputation.tooltip}
              />
            </div>
          </section>
        )}

        {/* Insights */}
        {hasApiResult && apiResult.insights.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Key Insights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apiResult.insights.map((insight, index) => (
                <InsightCard
                  key={index}
                  type={insight.type as "positive" | "warning" | "tip"}
                  icon={insight.icon}
                  message={insight.message}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {hasApiResult && apiResult.recommendations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Recommended Actions
              </h2>
            </div>

            <Card className="p-4 space-y-3">
              {apiResult.recommendations.map((rec, index) => (
                <RecommendationCard
                  key={index}
                  action={rec.action}
                  impact={rec.impact as "high" | "medium" | "low"}
                />
              ))}
            </Card>
          </section>
        )}

        {/* Fallback for client-side analysis */}
        {!hasApiResult && result && (
          <section>
            <Card className="p-6 bg-muted/30">
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
          </section>
        )}

        {/* Action Buttons */}
        <section className="flex flex-wrap gap-4 justify-center pt-4">
          <Link to="/analyze">
            <Button variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Analyze Another Job
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" disabled>
            <Share2 className="w-4 h-4" />
            Share Results
          </Button>
          <Button variant="outline" className="gap-2" disabled>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </section>

        {/* Safety Tips */}
        <Card className="p-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Stay Safe During Your Job Search
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                ✓ Do This
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Research company on LinkedIn & Glassdoor</li>
                <li>• Verify job on company's official website</li>
                <li>• Check for real employee profiles</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ✗ Avoid This
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Never pay fees to apply or get hired</li>
                <li>• Don't share SSN or banking details early</li>
                <li>• Avoid "too good to be true" offers</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
