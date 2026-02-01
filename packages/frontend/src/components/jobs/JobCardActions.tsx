import { Bookmark, TrendingUp, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { JobPosting } from "@/lib/types";
import { RankedJob } from "@/lib/jobs-api";

interface JobCardActionsProps {
  // We need job.id for isSaved check, and job object for callbacks
  job: JobPosting;
  currentRankedJob: RankedJob;
  isSaved?: (jobId: string) => boolean;
  onSave?: (job: JobPosting) => void;
  onViewAnalysis?: (job: RankedJob) => void;
  onReport?: (job: RankedJob) => void;
}

export function JobCardActions({
  job,
  currentRankedJob,
  isSaved,
  onSave,
  onViewAnalysis,
  onReport,
}: JobCardActionsProps) {
  if (!onSave && !onViewAnalysis && !onReport) return null;

  // Helper to stop propagation and call handler
  const handleAction =
    <T,>(handler: ((arg: T) => void) | undefined, arg: T) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handler?.(arg);
    };

  const isJobSaved = isSaved?.(currentRankedJob.id);

  return (
    <div className="flex items-center justify-end gap-1.5 px-4 pb-2">
      {onSave && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-full bg-card shadow-sm border",
                  isJobSaved &&
                    "bg-favorite/10 text-favorite border-favorite/30",
                )}
                onClick={handleAction(onSave, job)}
              >
                <Bookmark
                  className={cn("w-3.5 h-3.5", isJobSaved && "fill-current")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isJobSaved ? "Unsave" : "Save"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {onViewAnalysis && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-card shadow-sm border"
                onClick={handleAction(onViewAnalysis, currentRankedJob)}
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Analysis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {onReport && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-card shadow-sm border text-destructive hover:text-destructive/90"
                onClick={handleAction(onReport, currentRankedJob)}
              >
                <Flag className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Report</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
