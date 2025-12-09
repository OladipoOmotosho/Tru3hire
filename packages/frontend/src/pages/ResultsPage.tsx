import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { TrustScoreDisplay } from "../components/TrustScoreDisplay";
import { RedFlagsList } from "../components/RedFlagsList";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Info,
} from "lucide-react";

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface AnalysisResult {
  trustScore: number;
  riskLevel: "safe" | "suspicious" | "high-risk";
  redFlags: RedFlag[];
  summary: string;
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const jobText = location.state?.jobText;

  useEffect(() => {
    if (!jobText) {
      navigate("/analyze");
      return;
    }

    // Simulate analysis
    const analyzeJobPosting = async () => {
      setIsLoading(true);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const analysisResult = performAnalysis(jobText);
      setResult(analysisResult);
      setIsLoading(false);
    };

    analyzeJobPosting();
  }, [jobText, navigate]);

  const performAnalysis = (text: string): AnalysisResult => {
    const redFlags: RedFlag[] = [];
    let score = 100;

    // Check for personal email domains
    const personalEmailPattern =
      /@(gmail|yahoo|hotmail|outlook|aol|live|icloud|protonmail)\.com/gi;
    if (personalEmailPattern.test(text)) {
      redFlags.push({
        id: "personal-email",
        title: "Personal Email Address",
        description:
          "Legitimate companies typically use company domain emails (e.g., @company.com), not personal email services.",
        severity: "high",
      });
      score -= 25;
    }

    // Check for payment requests
    const paymentKeywords =
      /\b(pay.*fee|payment.*required|deposit.*required|processing.*fee|application.*fee|training.*fee|pay.*upfront|send.*money|western union|money.*gram|wire.*transfer|registration.*fee)\b/gi;
    if (paymentKeywords.test(text)) {
      redFlags.push({
        id: "payment-request",
        title: "Payment or Fee Request",
        description:
          "Legitimate employers never ask for money upfront. This is a major red flag for employment scams.",
        severity: "high",
      });
      score -= 30;
    }

    // Check for unrealistic salary
    const salaryPattern =
      /\$\s*(\d+(?:,\d+)?)\s*(?:per|\/)\s*(?:hour|hr|week|wk)/gi;
    const matches = text.matchAll(salaryPattern);
    for (const match of matches) {
      const amount = parseInt(match[1].replace(/,/g, ""));
      if (match[0].includes("hour") && amount > 100) {
        redFlags.push({
          id: "unrealistic-salary",
          title: "Unrealistic Salary Promise",
          description:
            "The promised hourly rate seems unusually high for entry-level positions. Verify this carefully.",
          severity: "medium",
        });
        score -= 15;
      }
    }

    // Check for urgency tactics
    const urgencyKeywords =
      /\b(urgent|immediately|asap|act now|limited time|hurry|apply today only|first.*hired|act fast|don't wait|instant hire)\b/gi;
    const urgencyMatches = text.match(urgencyKeywords);
    if (urgencyMatches && urgencyMatches.length >= 3) {
      redFlags.push({
        id: "urgency-tactics",
        title: "Excessive Urgency Language",
        description:
          "Scammers often create false urgency to pressure you into quick decisions without proper research.",
        severity: "medium",
      });
      score -= 15;
    }

    // Check for no experience required with high pay
    const noExperiencePattern =
      /\b(no.*experience|anyone can|easy money|work from home|make.*(\$|money).*home)\b/gi;
    if (noExperiencePattern.test(text)) {
      redFlags.push({
        id: "too-good-to-be-true",
        title: '"Too Good to Be True" Promises',
        description:
          "Job offers requiring no experience with promises of high pay are often fraudulent.",
        severity: "high",
      });
      score -= 20;
    }

    // Check for generic/vague job description
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 50) {
      redFlags.push({
        id: "vague-description",
        title: "Vague or Generic Description",
        description:
          "Legitimate job postings typically include detailed information about responsibilities, qualifications, and company background.",
        severity: "low",
      });
      score -= 10;
    }

    // Check for missing company information
    const hasCompanyName = /\b(company|corporation|corp|inc|ltd|llc)\b/gi.test(
      text
    );
    if (!hasCompanyName && wordCount > 30) {
      redFlags.push({
        id: "missing-company",
        title: "Missing Company Information",
        description:
          "No clear company name or organization mentioned. Legitimate employers are transparent about their identity.",
        severity: "medium",
      });
      score -= 15;
    }

    // Check for personal information requests
    const personalInfoPattern =
      /\b(social security|sin number|credit card|bank account|passport|driver.*license|full.*address|date.*birth)\b/gi;
    if (personalInfoPattern.test(text)) {
      redFlags.push({
        id: "personal-info",
        title: "Requests Sensitive Personal Information",
        description:
          "Asking for SIN, credit card, or bank details in a job posting is highly suspicious. Never share this before being hired.",
        severity: "high",
      });
      score -= 25;
    }

    // Check for guaranteed income/success
    const guaranteedPattern =
      /\b(guaranteed.*income|guaranteed.*success|definitely.*earn|promise.*\$|100%.*success)\b/gi;
    if (guaranteedPattern.test(text)) {
      redFlags.push({
        id: "guaranteed-income",
        title: "Guaranteed Income Claims",
        description:
          "No legitimate employer can guarantee specific income amounts, especially for commission-based or entry-level roles.",
        severity: "medium",
      });
      score -= 15;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine risk level
    let riskLevel: "safe" | "suspicious" | "high-risk";
    let summary: string;

    if (score >= 70) {
      riskLevel = "safe";
      summary =
        "This job posting appears relatively safe based on our analysis. However, always research the employer independently and trust your instincts.";
    } else if (score >= 40) {
      riskLevel = "suspicious";
      summary =
        "This job posting has several suspicious elements. Proceed with extreme caution and verify the employer's legitimacy before sharing any personal information.";
    } else {
      riskLevel = "high-risk";
      summary =
        "This job posting shows multiple red flags commonly associated with employment scams. We strongly recommend avoiding this opportunity.";
    }

    return {
      trustScore: score,
      riskLevel,
      redFlags,
      summary,
    };
  };

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

  if (!result) {
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
                  Analysis Results
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-lg">
              Based on our AI analysis, here's what we found about this job
              posting.
            </p>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Trust Score */}
              <TrustScoreDisplay
                score={result.trustScore}
                riskLevel={result.riskLevel}
                summary={result.summary}
              />

              {/* Red Flags or All Clear */}
              {result.redFlags.length > 0 ? (
                <RedFlagsList redFlags={result.redFlags} />
              ) : (
                <Card className="p-8 border-green-500/20 bg-green-500/5 dark:bg-green-500/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-3">
                        No Major Red Flags Detected
                      </h3>
                      <p className="text-green-700 dark:text-green-300 mb-4 leading-relaxed">
                        Our analysis didn't find obvious warning signs in this
                        posting. However, always take these precautions:
                      </p>
                      <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">
                            •
                          </span>
                          <span>Research the company independently online</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">
                            •
                          </span>
                          <span>Verify the employer's contact information</span>
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
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 mt-0.5">
                            •
                          </span>
                          <span>
                            Trust your instincts if something feels off
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              {/* Important Reminder */}
              <Card className="p-6 md:p-8 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2">
                      Important Reminder
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 leading-relaxed">
                      This analysis is based on common scam patterns and should
                      be used as guidance only. Always conduct your own research
                      before applying to any job.
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

              {/* Additional Safety Tips */}
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
