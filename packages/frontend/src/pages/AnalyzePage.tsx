import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { JobInputForm } from "../components/JobInputForm";
import { Shield } from "lucide-react";

export function AnalyzePage() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsAnalyzing(false);

    // Navigate to results page with the job text
    navigate("/results", { state: { jobText: text } });
  };

  return (
    <div className="py-12 bg-linear-to-br from-blue-50 via-white to-purple-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4 mt-10">
              <Shield className="w-4 h-4" />
              <span className="text-sm">AI-Powered Job Verification</span>
            </div>

            <h1 className="mb-4">Analyze a Job Posting</h1>

            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Paste the job description below and our AI will analyze it for
              potential scam indicators. Get instant results with detailed
              explanations.
            </p>
          </div>

          {/* Input Form */}
          <JobInputForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />

          {/* Tips Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="text-sm mb-1">Complete Information</h4>
              <p className="text-xs text-gray-600">
                Include all details from the posting for better analysis
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="text-sm mb-1">Instant Results</h4>
              <p className="text-xs text-gray-600">
                Get your trust score and detailed report in seconds
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-sm mb-1">Private & Secure</h4>
              <p className="text-xs text-gray-600">
                Your data is not stored or shared with anyone
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
