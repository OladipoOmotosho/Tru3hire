import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

interface ResumeStepProps {
  isParsing: boolean;
  parseError: string | null;
  resumeFile: File | null;
  skillsCount: number;
  onResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ResumeStep({
  isParsing,
  parseError,
  resumeFile,
  skillsCount,
  onResumeUpload,
}: ResumeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-light mb-2">
          Upload Your Resume
        </h2>
        <p className="text-gray-600">
          We'll automatically extract your skills and experience to personalize
          your job recommendations.
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your resume here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports PDF, DOC, DOCX (max 3MB)
        </p>
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,.doc,.docx"
          onChange={onResumeUpload}
          className="hidden"
        />
        <Button asChild>
          <label htmlFor="resume-upload" className="cursor-pointer">
            Choose File
          </label>
        </Button>
      </div>

      {isParsing && (
        <div className="flex items-center gap-3 p-4 bg-info-50 border border-info-200 rounded-lg">
          <Loader2 className="w-5 h-5 text-info-600 animate-spin" />
          <div>
            <p className="font-medium text-info-900">Analyzing your resume...</p>
            <p className="text-sm text-info-700">
              Extracting skills and experience
            </p>
          </div>
        </div>
      )}

      {parseError && !isParsing && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{parseError}</p>
          <p className="text-sm text-destructive-foreground mt-1">
            You can still continue and add skills manually.
          </p>
        </div>
      )}

      {resumeFile && !isParsing && !parseError && (
        <div className="flex items-center gap-3 p-4 bg-background border border-foreground rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-success-600" />
          <div className="grow">
            <p className="font-medium text-foreground">{resumeFile.name}</p>
            <p className="text-sm text-gray-600">
              {(resumeFile.size / 1024).toFixed(0)} KB
              {skillsCount > 0 && ` • ${skillsCount} skills extracted`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
