import { useState, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ResumeUploaderProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File | null) => void;
  /** Currently selected file */
  selectedFile: File | null;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_FILE_TYPES = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================================
// Component
// ============================================================================

/**
 * ResumeUploader - Drag and drop resume upload component
 *
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - File type validation (PDF, DOC, DOCX)
 * - File size validation (max 5MB)
 * - Remove file option
 */
export function ResumeUploader({
  onFileSelect,
  selectedFile,
  disabled = false,
  className = "",
}: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      return "Invalid file type. Please upload a PDF, DOC, or DOCX file.";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 5MB.";
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // If file is selected, show the selected file info
  if (selectedFile) {
    return (
      <Card
        className={`p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="shrink-0 text-gray-500 hover:text-red-600"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card
        className={`
          p-6 border-2 border-dashed transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-1">
            Drag and drop your resume here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            or click to browse
          </p>

          <input
            type="file"
            id="resume-upload"
            accept={ACCEPTED_FILE_TYPES.join(",")}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />

          <Button asChild variant="outline" disabled={disabled}>
            <label htmlFor="resume-upload" className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              Choose File
            </label>
          </Button>

          <p className="text-xs text-gray-400 mt-4">PDF, DOC, DOCX • Max 5MB</p>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
