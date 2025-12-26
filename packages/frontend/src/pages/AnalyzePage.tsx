import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { JobInputForm } from "../components/JobInputForm";
import { ResumeUploader } from "../components/ResumeUploader";
import { Shield, FileText, Zap, Lock, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { analyzeJob, AnalysisResponse } from "../lib/api";
import { PageWrapper } from "../components/PageWrapper";

export function AnalyzePage() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Call backend API
      const result: AnalysisResponse = await analyzeJob({
        jobText: text,
        resumeFile: resumeFile || undefined,
      });

      // Navigate to results page with the API response
      navigate("/results", {
        state: {
          jobText: text,
          apiResult: result,
        },
      });
    } catch (err) {
      const apiError = err as { message: string };
      setError(
        apiError.message || "Failed to analyze job posting. Please try again."
      );
      setIsAnalyzing(false);
    }
  };

  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      {/* Hero Section with Custom Gradient */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-hero-bg">
          <div className="absolute inset-0 bg-linear-to-br from-hero-gradient-from via-hero-gradient-via to-hero-gradient-to" />
        </div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 mt-10">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI-Powered Job Verification
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground">
                Analyze a Job Posting
              </h1>

              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Paste the job description below and our AI will analyze it for
                potential scam indicators. Upload your resume for personalized
                match scoring.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Resume Upload (Optional) */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">
                Upload Resume{" "}
                <span className="text-muted-foreground">(optional)</span>
              </h3>
              <ResumeUploader
                selectedFile={resumeFile}
                onFileSelect={setResumeFile}
                disabled={isAnalyzing}
              />
            </div>

            {/* Input Form */}
            <div className="mb-12">
              <JobInputForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            </div>

            {/* Tips Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-card border-border group">
                <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium mb-2 text-foreground">
                  Complete Information
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Include all details from the posting for better analysis
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-card border-border group">
                <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium mb-2 text-foreground">
                  Instant Results
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get your TrueScore and detailed report in seconds
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-card border-border group">
                <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium mb-2 text-foreground">
                  Private & Secure
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your data is not stored or shared with anyone
                </p>
              </Card>
            </div>

            {/* Additional Trust Indicators */}
            <div className="mt-12 text-center">
              <p className="text-xs text-muted-foreground">
                🔒 All analysis happens in real-time • No data stored • 100%
                confidential
              </p>
            </div>

            {/* Upgrade CTA */}
            <Card className="mt-8 p-6 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Want More Than Just Scam Detection?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Sign up to unlock TrueScore with resume matching, company
                  insights, skill gap analysis, and personalized job
                  recommendations.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/signup">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button variant="outline">Learn More</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
