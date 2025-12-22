import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { TrustScoreDisplay } from "../components/TrustScoreDisplay";
import { RedFlagsList } from "../components/RedFlagsList";
import { MetricCard, METRIC_CONFIGS } from "../components/MetricCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Info,
  Lightbulb,
} from "lucide-react";
import { analyzeJobPosting, AnalysisResult } from "../lib/scamDetection";
import { AnalysisResponse } from "../lib/api";

// Type for location state
interface LocationState {
  jobText: string;
  apiResult?: AnalysisResponse;
}

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

    // Check if we have API result from navigation state
    if (state?.apiResult) {
      setApiResult(state.apiResult);
      setIsLoading(false);
      return;
    }

    // Fallback to client-side analysis
    const runAnalysis = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const analysisResult = analyzeJobPosting(jobText);
      setResult(analysisResult);
      setIsLoading(false);
    };

    runAnalysis();
  }, [jobText, navigate, state?.apiResult]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <LoadingSpinner message="Analyzing job posting..." />
          </div>
        </div>
      </div>
    );
  }

  // Use API result if available, otherwise use client result
  const hasApiResult = apiResult !== null;
  const displayScore = hasApiResult
    ? apiResult.true_score
    : result?.trustScore ?? 0;
  const displayRiskLevel = hasApiResult
    ? apiResult.risk_level
    : result?.riskLevel ?? "low";
  const displaySummary = hasApiResult
    ? `TrueScore: ${
        apiResult.true_score
      }/100 - ${apiResult.risk_level.toUpperCase()}`
    : result?.summary ?? "";

  if (!hasApiResult && !result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background ">
      {/* Header Section */}
      <div className="relative py-12 overflow-hidden ">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-background" />
        </div>

        <div className="relative container mx-auto px-4 mt-10">
          <div className="max-w-4xl mx-auto">
            <Link to="/analyze">
              <Button
                variant="ghost"
                className="mb-6 hover:bg-muted cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2 " />
                Analyze Another Job
              </Button>
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
                  {hasApiResult ? "TrueScore Results" : "Analysis Results"}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-lg">
              {hasApiResult
                ? "Your personalized job fit analysis is ready."
                : "Based on our AI analysis, here's what we found about this job posting."}
            </p>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Trust Score / TrueScore */}
              <TrustScoreDisplay
                score={displayScore}
                riskLevel={displayRiskLevel}
                summary={displaySummary}
              />

              {/* TrueScore Breakdown (API only) */}
              {hasApiResult && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    Score Breakdown
                  </h3>
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
                </div>
              )}

              {/* Insights (API only) */}
              {hasApiResult && apiResult.insights.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Insights
                  </h3>
                  <div className="space-y-3">
                    {apiResult.insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          insight.type === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/20"
                            : insight.type === "positive"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-blue-50 dark:bg-blue-900/20"
                        }`}
                      >
                        <span className="text-xl">{insight.icon}</span>
                        <p className="text-sm text-foreground">
                          {insight.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendations (API only) */}
              {hasApiResult && apiResult.recommendations.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {apiResult.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            rec.impact === "high"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : rec.impact === "medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {rec.impact.toUpperCase()}
                        </span>
                        <p className="text-sm text-foreground">{rec.action}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Red Flags or All Clear (client-side fallback) */}
              {!hasApiResult && result && (
                <>
                  {result.redFlags.length > 0 ? (
                    <RedFlagsList redFlags={result.redFlags} />
                  ) : (
                    <Card className="p-8 border-green-500/20 bg-green-500/5 dark:bg-green-500/10">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-3">
                            No Major Red Flags Detected
                          </h3>
                          <p className="text-green-700 dark:text-green-300 mb-4 leading-relaxed">
                            Our analysis didn't find obvious warning signs in
                            this posting. However, always take these
                            precautions:
                          </p>
                          <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">
                                •
                              </span>
                              <span>
                                Research the company independently online
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">
                                •
                              </span>
                              <span>
                                Verify the employer's contact information
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400 mt-0.5">
                                •
                              </span>
                              <span>
                                Never send money or share sensitive personal
                                information
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Important Reminder */}
              <Card className="p-6 md:p-8 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                      Important Reminder
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 leading-relaxed">
                      This analysis is based on AI patterns and should be used
                      as guidance only. Always conduct your own research before
                      applying to any job.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link to="/analyze">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500/30 hover:bg-blue-500/10"
                        >
                          Check Another Job
                        </Button>
                      </Link>
                      <Link to="/">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500/30 hover:bg-blue-500/10"
                        >
                          Learn More About Scams
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Safety Tips */}
              <Card className="p-6 md:p-8 bg-muted/30 border-border">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Stay Safe During Your Job Search
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Research company reviews on multiple platforms
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Verify job postings on the company's official website
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>
                        Look up the company on LinkedIn and check employee
                        profiles
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✗</span>
                      <span>Never pay fees to apply or get hired</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✗</span>
                      <span>
                        Don't share SIN, banking, or credit card details early
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✗</span>
                      <span>Avoid jobs that seem "too good to be true"</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
