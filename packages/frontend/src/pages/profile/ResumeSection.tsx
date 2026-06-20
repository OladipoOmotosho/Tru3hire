import { RefObject } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText } from "lucide-react";

interface ResumeSectionProps {
  uploadSuccess: boolean;
  isUploading: boolean;
  uploadProgress: number;
  currentResumeFileName: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxSizeMB: number;
}

export function ResumeSection({
  uploadSuccess,
  isUploading,
  uploadProgress,
  currentResumeFileName,
  fileInputRef,
  onFileChange,
  maxSizeMB,
}: ResumeSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Resume</h2>
        {uploadSuccess && (
          <span className="text-green-600 text-sm font-medium">
            ✨ Profile pre-filled from resume!
          </span>
        )}
      </div>

      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={onFileChange}
        />

        {isUploading ? (
          <div className="flex flex-col items-center w-full max-w-xs mx-auto">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground mb-3">
              {uploadProgress < 100 ? "Uploading..." : "Analyzing resume..."}
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
          </div>
        ) : currentResumeFileName && !uploadSuccess ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {currentResumeFileName}
                </p>
                <p className="text-sm text-muted-foreground">Current resume</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Click to replace (max {maxSizeMB}MB)
            </p>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Replace Resume
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Click to upload your resume
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, DOC, DOCX (max {maxSizeMB}MB)
            </p>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
