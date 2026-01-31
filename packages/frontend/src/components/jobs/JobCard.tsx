import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobPosting } from "@/lib/types";
import { cn, formatDate, formatSalary } from "@/lib/utils";
import {
  MapPin,
  Building2,
  Bookmark,
  CheckCircle2,
  Flag,
  ExternalLink,
  Eye,
  Globe,
  Clock,
  DollarSign,
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
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  className?: string;
  onViewAnalysis?: () => void;
  onReport?: () => void;
}

export function JobCard({
  job,
  onSave,
  onApply,
  isSaved = false,
  className,
  onViewAnalysis,
  onReport,
}: JobCardProps) {
  // Helper to strip HTML for snippet
  const getSnippet = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.substring(0, 150) + (text.length > 150 ? "..." : "");
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-black/50 dark:hover:border-gray-500 hover:shadow-xl transition-all duration-200 rounded-xl overflow-hidden cursor-pointer",
        className,
      )}
      onClick={() => window.open(job.url, "_blank")}
    >
      <div className="p-5 flex flex-col gap-3 grow">
        {/* Header: Title & Time */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(job.postedDate)}
          </span>
        </div>

        {/* Company & Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-gray-900 dark:text-gray-200 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {job.company}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5" />
            {job.location}
          </span>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 mt-1">
          {job.salary && (
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {formatSalary(job.salary.min, job.salary.max)}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400 font-normal"
          >
            {job.jobType || "Full-time"}
          </Badge>
          {/* Trust Badges */}
          {job.isVerified && (
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Middle: Logo & Content */}
        <div className="mt-2 flex gap-4 items-start grow">
          {/* Logo Box */}
          <div className="w-14 h-14 shrink-0 rounded-lg border border-gray-100 bg-white p-1 flex items-center justify-center shadow-sm">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-8 h-8 text-gray-300" />
            )}
          </div>

          {/* Snippet / Description */}
          <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {job.description
              ? getSnippet(job.description)
              : "No description available for this position. Click to view more details."}
          </div>
        </div>
      </div>

      {/* Footer Button - Fades in on hover */}
      <div className="p-4 pt-0 mt-auto">
        <Button
          className="w-full bg-black hover:bg-gray-800 text-white font-bold rounded-lg h-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onApply?.();
          }}
        >
          Apply Directly
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Absolute Hover Actions (Top Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white shadow-md hover:bg-pink-50 hover:text-pink-600 border border-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.();
                }}
              >
                <Bookmark
                  className={cn(
                    "w-4 h-4",
                    isSaved && "fill-current text-pink-600",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isSaved ? "Unsave" : "Save Job"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white shadow-md hover:bg-blue-50 hover:text-blue-600 border border-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAnalysis?.();
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>View Analysis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white shadow-md hover:bg-red-50 hover:text-red-600 border border-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onReport?.();
                }}
              >
                <Flag className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Report Suspicious</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* TrueScore Badge (Absolute Top Left - overlap border?) or just near title? 
          Let's put it top-right inside or relative. 
          Actually, let's keep it discrete. Maybe on the logo? 
          Or just a small badge in header.
      */}
      {job.trueScore > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border bg-white",
              job.trueScore >= 80
                ? "text-green-600 border-green-200"
                : job.trueScore >= 50
                  ? "text-yellow-600 border-yellow-200"
                  : "text-red-600 border-red-200",
            )}
          >
            {job.trueScore}% Match
          </div>
        </div>
      )}
    </Card>
  );
}
