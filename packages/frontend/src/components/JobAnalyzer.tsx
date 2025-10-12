import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";
import { TrustScoreDisplay } from "./TrustScoreDisplay";
import { RedFlagsList } from "./RedFlagsList";

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

export function JobAnalyzer() {
  const [jobText, setJobText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeJobPosting = (text: string): AnalysisResult => {
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

  const handleAnalyze = async () => {
    if (!jobText.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysisResult = analyzeJobPosting(jobText);
    setResult(analysisResult);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setJobText("");
    setResult(null);
  };

  return (
    <div id="analyzer" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Check a Job Posting</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Paste the job description below and our AI will analyze it for potential scam indicators. 
              Results are provided instantly and completely free.
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="job-text" className="block mb-2 text-gray-700">
                  Job Posting Text
                </label>
                <Textarea
                  id="job-text"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the job description here... Include details like company name, job title, responsibilities, salary, contact information, etc."
                  className="min-h-[200px] resize-y"
                  disabled={isAnalyzing}
                />
                <div className="text-sm text-gray-500 mt-2">
                  {jobText.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAnalyze}
                  disabled={!jobText.trim() || isAnalyzing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Job Posting"
                  )}
                </Button>
                {result && (
                  <Button onClick={handleReset} variant="outline">
                    Check Another
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {result && (
            <div className="mt-8 space-y-6">
              <TrustScoreDisplay
                score={result.trustScore}
                riskLevel={result.riskLevel}
                summary={result.summary}
              />

              {result.redFlags.length > 0 && (
                <RedFlagsList redFlags={result.redFlags} />
              )}

              {result.redFlags.length === 0 && (
                <Card className="p-6 border-green-200 bg-green-50">
                  <h3 className="text-green-800 mb-2">No Major Red Flags Detected</h3>
                  <p className="text-green-700">
                    Our analysis didn't find obvious warning signs in this posting. However, always:
                  </p>
                  <ul className="list-disc list-inside mt-3 text-green-700 space-y-1">
                    <li>Research the company independently online</li>
                    <li>Verify the employer's contact information</li>
                    <li>Never send money or share sensitive personal information</li>
                    <li>Trust your instincts if something feels off</li>
                  </ul>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
