import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, FileText } from "lucide-react";

interface JobInputFormProps {
  onAnalyze: (text: string) => void;
  isLoading?: boolean;
}

export function JobInputForm({
  onAnalyze,
  isLoading = false,
}: JobInputFormProps) {
  const [jobText, setJobText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobText.trim()) {
      onAnalyze(jobText);
    }
  };

  const wordCount = jobText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <Card className="p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            required
          />

          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-500">
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            {wordCount < 20 && wordCount > 0 && (
              <span className="text-yellow-600">
                Tip: More text provides better analysis
              </span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!jobText.trim() || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Job Posting...
            </>
          ) : (
            "Analyze Job Posting"
          )}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-blue-900 mb-2 text-sm">Privacy Notice</h4>
        <p className="text-xs text-blue-800">
          Your job posting text is analyzed securely and is not stored or
          shared. We respect your privacy and only use the text to provide
          instant analysis results.
        </p>
      </div>
    </Card>
  );
}
