import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { TrustScoreDisplay } from "../components/TrustScoreDisplay";
import { RedFlagsList } from "../components/RedFlagsList";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ArrowLeft, AlertTriangle } from "lucide-react";

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
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    const personalEmailPattern = /@(gmail|yahoo|hotmail|outlook|aol|live|icloud|protonmail)\.com/gi;
    if (personalEmailPattern.test(text)) {
      redFlags.push({
        id: "personal-email",
        title: "Personal Email Address",
        description: "Legitimate companies typically use company domain emails (e.g., @company.com), not personal email services.",
        severity: "high"
      });
      score -= 25;
    }

    // Check for payment requests
    const paymentKeywords = /\b(pay.*fee|payment.*required|deposit.*required|processing.*fee|application.*fee|training.*fee|pay.*upfront|send.*money|western union|money.*gram|wire.*transfer|registration.*fee)\b/gi;
    if (paymentKeywords.test(text)) {
      redFlags.push({
        id: "payment-request",
        title: "Payment or Fee Request",
        description: "Legitimate employers never ask for money upfront. This is a major red flag for employment scams.",
        severity: "high"
      });
      score -= 30;
    }

    // Check for unrealistic salary
    const salaryPattern = /\$\s*(\d+(?:,\d+)?)\s*(?:per|\/)\s*(?:hour|hr|week|wk)/gi;
    const matches = text.matchAll(salaryPattern);
    for (const match of matches) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (match[0].includes('hour') && amount > 100) {
        redFlags.push({
          id: "unrealistic-salary",
          title: "Unrealistic Salary Promise",
          description: "The promised hourly rate seems unusually high for entry-level positions. Verify this carefully.",
          severity: "medium"
        });
        score -= 15;
      }
    }

    // Check for urgency tactics
    const urgencyKeywords = /\b(urgent|immediately|asap|act now|limited time|hurry|apply today only|first.*hired|act fast|don't wait|instant hire)\b/gi;
    const urgencyMatches = text.match(urgencyKeywords);
    if (urgencyMatches && urgencyMatches.length >= 3) {
      redFlags.push({
        id: "urgency-tactics",
        title: "Excessive Urgency Language",
        description: "Scammers often create false urgency to pressure you into quick decisions without proper research.",
        severity: "medium"
      });
      score -= 15;
    }

    // Check for no experience required with high pay
    const noExperiencePattern = /\b(no.*experience|anyone can|easy money|work from home|make.*(\$|money).*home)\b/gi;
    if (noExperiencePattern.test(text)) {
      redFlags.push({
        id: "too-good-to-be-true",
        title: "\"Too Good to Be True\" Promises",
        description: "Job offers requiring no experience with promises of high pay are often fraudulent.",
        severity: "high"
      });
      score -= 20;
    }

    // Check for generic/vague job description
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 50) {
      redFlags.push({
        id: "vague-description",
        title: "Vague or Generic Description",
        description: "Legitimate job postings typically include detailed information about responsibilities, qualifications, and company background.",
        severity: "low"
      });
      score -= 10;
    }

    // Check for missing company information
    const hasCompanyName = /\b(company|corporation|corp|inc|ltd|llc)\b/gi.test(text);
    if (!hasCompanyName && wordCount > 30) {
      redFlags.push({
        id: "missing-company",
        title: "Missing Company Information",
        description: "No clear company name or organization mentioned. Legitimate employers are transparent about their identity.",
        severity: "medium"
      });
      score -= 15;
    }

    // Check for personal information requests
    const personalInfoPattern = /\b(social security|sin number|credit card|bank account|passport|driver.*license|full.*address|date.*birth)\b/gi;
    if (personalInfoPattern.test(text)) {
      redFlags.push({
        id: "personal-info",
        title: "Requests Sensitive Personal Information",
        description: "Asking for SIN, credit card, or bank details in a job posting is highly suspicious. Never share this before being hired.",
        severity: "high"
      });
      score -= 25;
    }

    // Check for guaranteed income/success
    const guaranteedPattern = /\b(guaranteed.*income|guaranteed.*success|definitely.*earn|promise.*\$|100%.*success)\b/gi;
    if (guaranteedPattern.test(text)) {
      redFlags.push({
        id: "guaranteed-income",
        title: "Guaranteed Income Claims",
        description: "No legitimate employer can guarantee specific income amounts, especially for commission-based or entry-level roles.",
        severity: "medium"
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
      summary = "This job posting appears relatively safe based on our analysis. However, always research the employer independently and trust your instincts.";
    } else if (score >= 40) {
      riskLevel = "suspicious";
      summary = "This job posting has several suspicious elements. Proceed with extreme caution and verify the employer's legitimacy before sharing any personal information.";
    } else {
      riskLevel = "high-risk";
      summary = "This job posting shows multiple red flags commonly associated with employment scams. We strongly recommend avoiding this opportunity.";
    }

    return {
      trustScore: score,
      riskLevel,
      redFlags,
      summary
    };
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-gray-50 min-h-[calc(100vh-4rem)]">
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
    <div className="py-12 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/analyze">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Analyze Another Job
              </Button>
            </Link>
            
            <h1 className="mb-2">Analysis Results</h1>
            <p className="text-gray-600">
              Based on our AI analysis, here's what we found about this job posting.
            </p>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <TrustScoreDisplay
              score={result.trustScore}
              riskLevel={result.riskLevel}
              summary={result.summary}
            />

            {result.redFlags.length > 0 ? (
              <RedFlagsList redFlags={result.redFlags} />
            ) : (
              <Card className="p-6 border-green-200 bg-green-50">
                <h3 className="text-green-800 mb-2">No Major Red Flags Detected</h3>
                <p className="text-green-700 mb-4">
                  Our analysis didn't find obvious warning signs in this posting. However, always:
                </p>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Research the company independently online</li>
                  <li>Verify the employer's contact information</li>
                  <li>Never send money or share sensitive personal information</li>
                  <li>Trust your instincts if something feels off</li>
                </ul>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-900 mb-2">Important Reminder</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    This analysis is based on common scam patterns and should be used as guidance only. 
                    Always conduct your own research before applying to any job.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/analyze">
                      <Button variant="outline" size="sm">
                        Check Another Job
                      </Button>
                    </Link>
                    <Link to="/">
                      <Button variant="outline" size="sm">
                        Learn More About Scams
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
