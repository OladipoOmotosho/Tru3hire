/**
 * GroupedJobCard - Stacked card for companies with multiple open roles
 * Shows a "stack of cards" visual and "View all X roles" link to company jobs page
 */

import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobPosting } from "@/lib/types";
import { cn, formatSalary, formatPostedTime, companyToSlug } from "@/lib/utils";
import { useState } from "react";
import {
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ExternalLink,
  TrendingUp,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RankedJob } from "@/lib/jobs-api";

interface GroupedJobCardProps {
  /** Primary job to display on the top card */
  primaryJob: RankedJob;
  /** All jobs from this company (including primary) */
  jobs: RankedJob[];
  toJobPosting: (job: RankedJob) => JobPosting;
  isSaved?: (jobId: string) => boolean;
  onSave?: (job: JobPosting) => void;
  onApply?: (job: RankedJob) => void;
  onReport?: (job: RankedJob) => void;
  onViewAnalysis?: (job: RankedJob) => void;
  appliedJobIds?: Set<string>;
  className?: string;
}

export function GroupedJobCard({
  primaryJob,
  jobs,
  toJobPosting,
  isSaved = () => false,
  onSave,
  onApply,
  onReport,
  onViewAnalysis,
  appliedJobIds = new Set(),
  className,
}: GroupedJobCardProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const currentJob = jobs[index] ?? primaryJob;
  const job = toJobPosting(currentJob);
  const currentJobPosting = job;
  const count = jobs.length;
  const companySlug = companyToSlug(primaryJob.company);

  const getSnippet = (html: string, maxLength: number = 60) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return (
      text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
    );
  };

  const postedLabel = formatPostedTime(currentJob.days_ago);
  const rawSalary = job.salaryDisplay
    ? job.salaryDisplay
    : job.salary
    ? formatSalary(job.salary.min, job.salary.max)
    : null;
  // Only show salary when disclosed (hide "Not specified" / "Unspecified" etc.)
  const salaryText =
    rawSalary && !/^(not specified|unspecified|n\/a)$/i.test(rawSalary.trim())
      ? rawSalary
      : null;

  const handleViewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/jobs/company/${companySlug}`);
  };

  const handleCardClick = () => {
    if (currentJob.redirect_url) {
      window.open(currentJob.redirect_url, "_blank");
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-visible",
        count > 1 && "mb-3 mr-3",
        className
      )}
    >
      {/* Stacked card layers - "stack of cards" effect (cards fanned behind) */}
      {count > 1 && (
        <>
          {/* Back layer - furthest back */}
          <div
            className="absolute inset-0 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
            style={{ transform: "translate(8px, 8px)", zIndex: 0 }}
            aria-hidden
          />
          {/* Middle layer */}
          <div
            className="absolute inset-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850"
            style={{ transform: "translate(4px, 4px)", zIndex: 1 }}
            aria-hidden
          />
        </>
      )}

      <Card
        className={cn(
          "group relative flex flex-col h-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg",
          count > 1 && "shadow-md z-10"
        )}
        onClick={handleCardClick}
      >
        <div className="p-4 flex flex-col gap-2.5 flex-1 overflow-hidden">
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
                  className="text-[11px] px-2 py-0 h-5 font-normal bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-0"
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
                  className="text-[11px] px-2 py-0 h-5 border-blue-200 text-blue-600 dark:text-blue-400"
                >
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>
            {job.trueScore > 0 && (
              <span
                className={cn(
                  "shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold",
                  job.trueScore >= 70
                    ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                    : job.trueScore >= 40
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
                    : "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
                )}
              >
                {job.trueScore}% Match
              </span>
            )}
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

        {/* Footer: Action icons (horizontal) + border + Job Posting + pagination */}
        <div className="mt-auto">
          {/* Action icons row - horizontal, above the border */}
          {(onSave || onViewAnalysis || onReport) && (
            <div className="flex items-center justify-end gap-1.5 px-4 pb-2">
              {onSave && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                          "h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border",
                          isSaved(currentJob.id) &&
                            "bg-pink-50 text-pink-600 border-pink-200"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSave?.(currentJobPosting);
                        }}
                      >
                        <Bookmark
                          className={cn(
                            "w-3.5 h-3.5",
                            isSaved(currentJob.id) && "fill-current"
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isSaved(currentJob.id) ? "Unsave" : "Save"}</p>
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
                        className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewAnalysis?.(currentJob);
                        }}
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
                        className="h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReport?.(currentJob);
                        }}
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
          )}
          {/* Border + Job Posting + pagination */}
          <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex items-center justify-between gap-2">
              <a
                href={currentJob.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Job Posting
                <ExternalLink className="w-3 h-3" />
              </a>
              {count > 1 && (
                <>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground disabled:opacity-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIndex((i) => (i <= 0 ? count - 1 : i - 1));
                      }}
                      aria-label="Previous job"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-0.5">
                      {jobs.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            i === index
                              ? "bg-gray-700 dark:bg-gray-300"
                              : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIndex(i);
                          }}
                          aria-label={`Job ${i + 1} of ${count}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground disabled:opacity-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIndex((i) => (i >= count - 1 ? 0 : i + 1));
                      }}
                      aria-label="Next job"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline shrink-0"
                    onClick={handleViewAll}
                  >
                    View all
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hover action - Apply Directly (top right) */}
        {onApply && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-black hover:bg-gray-800 text-white shadow-sm border-0 gap-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onApply?.(currentJob);
              }}
            >
              Apply Directly
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
