import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobPosting } from "@/lib/types";
import { cn, formatSalary, formatPostedTime } from "@/lib/utils";
import { JobMatchScore } from "./JobMatchScore";
import { getSnippet, getSalaryText } from "@/lib/job-utils";
import {
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Flag,
  ExternalLink,
  TrendingUp,
  Wrench,
  Eye,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { toast } from "sonner";

/** Human-readable labels for P1 friction signals */
function frictionSignalLabel(signal: string): string {
  const labels: Record<string, string> = {
    authenticity_concern: "Legitimacy concerns",
    ghost_job_risk: "May be a ghost job",
    posting_may_be_stale: "Posting may be stale",
    low_company_response_rate: "Low response rate from this company",
    credential_mismatch: "Credential mismatch",
  };
  return labels[signal] ?? signal.replace(/_/g, " ");
}

interface JobCardProps {
  job: JobPosting;
  daysAgo?: number;
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  isApplied?: boolean;
  className?: string;
  onViewAnalysis?: () => void;
  onViewDetails?: () => void;
  onReport?: () => void;
}

export function JobCard({
  job,
  daysAgo = 0,
  onSave,
  onApply,
  isSaved = false,
  isApplied = false,
  className,
  onViewAnalysis,
  onViewDetails,
  onReport,
}: JobCardProps) {
  const postedLabel = formatPostedTime(daysAgo);
  const salaryText = getSalaryText(
    job.salaryDisplay,
    job.salary as { min?: number; max?: number } | undefined,
    formatSalary,
  );

  const [trackingLoading, setTrackingLoading] = useState(false);

  return (
    <Card
      className={cn(
        "group relative flex flex-col min-h-[320px] sm:min-h-[350px] bg-card hover:shadow-lg transition-all duration-200 rounded-md overflow-hidden cursor-pointer",
        className,
      )}
      onClick={() => job.url && window.open(job.url, "_blank")}
    >
      <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 flex-1 overflow-hidden">
        {/* Header: Title + Time */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {postedLabel}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>

        {/* Tags Row + Match Score */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {salaryText && (
              <Badge
                variant="secondary"
                className="text-[11px] px-2 py-0 h-5 font-normal bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400 border-0"
              >
                {salaryText}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-[11px] px-2 py-0 h-5 font-normal border-gray-200 dark:border-gray-700"
            >
              {job.jobType || "Full-time"}
            </Badge>
            {job.isVerified && (
              <Badge
                variant="outline"
                className="text-[11px] px-2 py-0 h-5 border-info-200 text-info-600 dark:text-info-400"
              >
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {job.eligibilityScore !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5 font-medium border",
                        job.eligibilityScore >= 80
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                          : job.eligibilityScore >= 50
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      {job.eligibilityScore >= 80
                        ? "Top Match"
                        : job.eligibilityScore >= 50
                          ? "Potential"
                          : "Missing Creds"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-semibold">
                        Eligibility: {job.eligibilityScore}/100
                      </p>
                      {job.eligibilityBadges &&
                        job.eligibilityBadges.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {job.eligibilityBadges.map((b) => (
                              <span key={b} className="opacity-90">
                                • {b}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {job.frictionSignals && job.frictionSignals.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 font-medium border-warning-300 text-warning-600 dark:text-warning-400"
                    >
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                      Watch out
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs max-w-[200px]">
                      <p className="font-semibold mb-1">Possible friction:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {job.frictionSignals.map((s) => (
                          <li key={s}>
                            {frictionSignalLabel(s)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <JobMatchScore score={job.trueScore} />
          </div>
        </div>

        {/* Company Logo + Name */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-12 h-12 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 flex items-center justify-center">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-gray-200 truncate">
              {job.company}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
              {job.description
                ? getSnippet(job.description, 60)
                : "Click to view details."}
            </div>
          </div>
        </div>

        {/* Skills / Requirements */}
        {job.tags?.length > 0 && (
          <div className="flex items-start gap-1.5 mt-1">
            <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1 flex-1">
              {job.tags.slice(0, 5).map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Track Application + Action icons + Job Posting link */}
      <div className="mt-auto">
        {/* Track Application + Action icons row */}
        <div className="flex items-center justify-between gap-1.5 px-4 pb-2 flex-wrap">
          {/* Track Application button - show when onApply provided */}
          {onApply && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isApplied ? "secondary" : "default"}
                    className={cn(
                      "rounded-lg text-xs font-semibold gap-1",
                      isApplied &&
                        "bg-success/10 text-success border-success/30 hover:bg-success/10",
                    )}
                    disabled={trackingLoading || isApplied}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isApplied) return;
                      setTrackingLoading(true);
                      try {
                        await onApply();
                      } catch (err) {
                        const msg =
                          err instanceof Error ? err.message : "Failed to track application";
                        toast.error(msg);
                        console.error("Track application failed:", err);
                      } finally {
                        setTrackingLoading(false);
                      }
                    }}
                  >
                    {trackingLoading ? (
                      <>Tracking...</>
                    ) : isApplied ? (
                      <>
                        Applied ✓
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Track Application
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>
                    {isApplied
                      ? "Application already tracked"
                      : "Mark that you applied to this job"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {/* Other action icons */}
          {(onSave || onViewDetails || onViewAnalysis || onReport) && (
            <TooltipProvider>
              <div className="flex items-center gap-1.5">
              {onSave && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={cn(
                        "h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border",
                        isSaved && "bg-pink-50 text-pink-600 border-pink-200",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSave?.();
                      }}
                    >
                      <Bookmark
                        className={cn("w-3.5 h-3.5", isSaved && "fill-current")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isSaved ? "Unsave" : "Save"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onViewDetails && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails?.();
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>View Details</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onViewAnalysis && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAnalysis?.();
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Analysis</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onReport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border text-destructive hover:text-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReport?.();
                      }}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Report</p>
                  </TooltipContent>
                </Tooltip>
              )}
              </div>
            </TooltipProvider>
          )}
        </div>
        {/* Border + Job Posting link */}
        {job.url && (
          <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Job Posting
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
