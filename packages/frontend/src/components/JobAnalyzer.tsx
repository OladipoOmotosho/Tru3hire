import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { TrustScoreDisplay } from "./TrustScoreDisplay";
import { RedFlagsList } from "./RedFlagsList";
import {
  analyzeJobPosting,
  validateJobContent,
  AnalysisResult,
  getWordCount,
} from "../lib/scamDetection";

export function JobAnalyzer() {
  const [jobText, setJobText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobText.trim()) return;

    // Validate content before scoring
    const validation = validateJobContent(jobText);
    if (!validation.valid) {
      setValidationError(
        validation.reason ?? "This doesn't appear to be a valid job posting.",
      );
      setResult(null);
      return;
    }

    setValidationError(null);
    setIsAnalyzing(true);
    setResult(null);

    // Simulate API delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const analysisResult = analyzeJobPosting(jobText);
    setResult(analysisResult);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setJobText("");
    setResult(null);
    setValidationError(null);
  };

  return (
    <div id="analyzer" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Check a Job Posting</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Paste the job description below and our AI will analyze it for
              potential scam indicators. Results are provided instantly and
              completely free.
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
                  {getWordCount(jobText)} words
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

          {validationError && (
            <div className="mt-8">
              <Card className="p-6 border-amber-300 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-amber-800 font-semibold mb-1">
                      Not a Job Posting
                    </h3>
                    <p className="text-amber-700">{validationError}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

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
                  <h3 className="text-green-800 mb-2">
                    No Major Red Flags Detected
                  </h3>
                  <p className="text-green-700">
                    Our analysis didn't find obvious warning signs in this
                    posting. However, always:
                  </p>
                  <ul className="list-disc list-inside mt-3 text-green-700 space-y-1">
                    <li>Research the company independently online</li>
                    <li>Verify the employer's contact information</li>
                    <li>
                      Never send money or share sensitive personal information
                    </li>
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
