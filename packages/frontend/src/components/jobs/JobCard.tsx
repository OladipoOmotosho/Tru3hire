import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobPosting } from "@/lib/types";
import { cn, formatSalary, formatPostedTime } from "@/lib/utils";
import {
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Flag,
  ExternalLink,
  Eye,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobCardProps {
  job: JobPosting;
  daysAgo?: number;
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  className?: string;
  onViewAnalysis?: () => void;
  onReport?: () => void;
}

export function JobCard({
  job,
  daysAgo = 0,
  onSave,
  onApply,
  isSaved = false,
  className,
  onViewAnalysis,
  onReport,
}: JobCardProps) {
  const getSnippet = (html: string, maxLength: number = 80) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return (
      text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
    );
  };

  const postedLabel = formatPostedTime(daysAgo);
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

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden cursor-pointer",
        className
      )}
      onClick={() => job.url && window.open(job.url, "_blank")}
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

      {/* Footer - Job Posting link */}
      {job.url && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3 mt-auto">
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

      {/* Hover actions - compact icons (Apply Directly, Save, etc.) */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onApply && (
          <Button
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-black hover:bg-gray-800 text-white shadow-sm border-0 gap-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onApply?.();
            }}
          >
            Apply Directly
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
        {onSave && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-full bg-white dark:bg-gray-800 shadow-sm border",
                    isSaved && "bg-pink-50 text-pink-600 border-pink-200"
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
              <TooltipContent side="left">
                <p>{isSaved ? "Unsave" : "Save"}</p>
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
                    onViewAnalysis?.();
                  }}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
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
                    onReport?.();
                  }}
                >
                  <Flag className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}
