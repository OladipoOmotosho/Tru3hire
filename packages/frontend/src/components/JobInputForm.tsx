import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, FileText, Link2, Globe } from "lucide-react";

interface JobInputFormProps {
  onAnalyze: (text: string, isUrl: boolean) => void;
  isLoading?: boolean;
}

export function JobInputForm({
  onAnalyze,
  isLoading = false,
}: JobInputFormProps) {
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "url") {
      if (jobUrl.trim()) {
        onAnalyze(jobUrl.trim(), true);
      }
    } else {
      if (jobText.trim()) {
        onAnalyze(jobText, false);
      }
    }
  };

  const wordCount = jobText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canSubmit =
    inputMode === "url"
      ? jobUrl.trim() && isValidUrl(jobUrl.trim())
      : jobText.trim() && wordCount >= 100;

  return (
    <Card className="p-6 md:p-8">
      {/* Input Mode Toggle */}
      <div className="flex mb-6 bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            inputMode === "text"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setInputMode("url")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            inputMode === "url"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="w-4 h-4" />
          Paste URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {inputMode === "text" ? (
          /* Text Input Mode */
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <label htmlFor="job-text" className="text-gray-light">
                Job Posting Text
              </label>
            </div>

            <Textarea
              id="job-text"
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the complete job description here...

Include details like:
• Company name and contact information
• Job title and responsibilities
• Salary or compensation details
• Application requirements
• Any other relevant information from the posting"
              className="min-h-[300px] resize-y"
              disabled={isLoading}
              required={inputMode === "text"}
            />

            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-500">
                {wordCount} word{wordCount !== 1 ? "s" : ""}
              </span>
              {wordCount > 0 && wordCount < 100 && (
                <span className="text-red-600">
                  Minimum 100 words required ({100 - wordCount} more needed)
                </span>
              )}
              {wordCount >= 100 && (
                <span className="text-green-600">✓ Ready to analyze</span>
              )}
            </div>
          </div>
        ) : (
          /* URL Input Mode */
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <label htmlFor="job-url" className="text-gray-light">
                Job Posting URL
              </label>
            </div>

            <Input
              id="job-url"
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://www.jobbank.gc.ca/jobsearch/jobposting/..."
              className="h-12 text-base"
              disabled={isLoading}
              required={inputMode === "url"}
            />

            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>✓ Works best with:</strong> Job Bank Canada, Indeed,
                Glassdoor, Google Jobs, and most company career pages.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ⚠ Some sites like LinkedIn block automated access. If it doesn't
                work, just paste the job text instead.
              </p>
            </div>

            {jobUrl && !isValidUrl(jobUrl) && (
              <p className="text-sm text-red-500 mt-2">
                Please enter a valid URL starting with http:// or https://
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {inputMode === "url"
                ? "Fetching & Analyzing..."
                : "Analyzing Job Posting..."}
            </>
          ) : (
            <>
              {inputMode === "url" ? "Analyze from URL" : "Analyze Job Posting"}
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-blue-900 dark:text-blue-100 mb-2 text-sm">
          Privacy Notice
        </h4>
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Your job posting {inputMode === "url" ? "URL" : "text"} is analyzed
          securely and is not stored or shared. We respect your privacy and only
          use the content to provide instant analysis results.
        </p>
      </div>
    </Card>
  );
}
