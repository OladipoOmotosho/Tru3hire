import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

interface ResumeSectionProps {
  hasSavedResume: boolean;
  savedResume: {
    fileName?: string;
    uploadedAt?: string;
    skills?: string[];
  } | null;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
}

export function ResumeSection({
  hasSavedResume,
  savedResume,
  isUploading,
  onUpload,
  onDelete,
}: ResumeSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Resume & Skills</h2>
          <p className="text-sm text-muted-foreground">
            Manage your resume to improve job matching accuracy
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 border border-border dashed">
        {hasSavedResume ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {savedResume?.fileName || "Uploaded Resume"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Added{" "}
                    {savedResume?.uploadedAt
                      ? new Date(savedResume.uploadedAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  {savedResume?.skills && (
                    <>
                      <span>•</span>
                      <span>{savedResume.skills.length} skills detected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Update
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">
              Upload your resume
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              We'll analyze your resume to calculate a Match Score for every job
              posting.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Select PDF or Word Doc"
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Supported formats: PDF, DOCX, TXT (Max 5MB)
            </p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        className="hidden"
      />
    </Card>
  );
}
