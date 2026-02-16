/**
 * GroupedJobCard - Stacked card for companies with multiple open roles
 * Shows a "stack of cards" visual and "View all X roles" link to company jobs page
 */

import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { JobPosting } from "@/lib/types";
import { cn, formatSalary, companyToSlug } from "@/lib/utils";
import { getSnippet, getSalaryText } from "@/lib/job-utils";
import { useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankedJob } from "@/lib/jobs-api";
import { JobCardHeader } from "./JobCardHeader";
import { JobCardTags } from "./JobCardTags";
import { JobCardActions } from "./JobCardActions";

interface GroupedJobCardProps {
  /** Primary job to display on the top card */
  primaryJob: RankedJob;
  /** All jobs from this company (including primary) */
  jobs: RankedJob[];
  toJobPosting: (job: RankedJob) => JobPosting;
  isSaved?: (jobId: string) => boolean;
  onSave?: (job: JobPosting) => void;
  onApply?: (job: RankedJob) => void;
  onViewDetails?: (job: RankedJob) => void;
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
  onViewDetails,
  onReport,
  onViewAnalysis,
  className,
}: GroupedJobCardProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const currentJob = jobs[index] ?? primaryJob;
  const job = toJobPosting(currentJob);
  const count = jobs.length;
  const companySlug = companyToSlug(primaryJob.company);

  const salaryText = getSalaryText(
    job.salaryDisplay,
    job.salary as { min?: number; max?: number } | undefined,
    formatSalary,
  );

  const handleViewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/jobs/company/${companySlug}`);
  };

  const handleCardClick = () => {
    if (currentJob.redirect_url) {
      window.open(currentJob.redirect_url, "_blank");
    }
  };

  const handlePagination = (idx: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(idx);
  };

  const nextIndex = index >= count - 1 ? 0 : index + 1;
  const prevIndex = index <= 0 ? count - 1 : index - 1;

  return (
    <div
      className={cn(
        "relative overflow-visible",
        count > 1 && "mb-3 mr-3",
        className,
      )}
    >
      {/* Back layers */}
      {count > 1 && (
        <>
          <div
            className="absolute inset-0 rounded-xl bg-card border border-border"
            style={{ transform: "translate(8px, 8px)", zIndex: 0 }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-xl bg-card border border-border"
            style={{ transform: "translate(4px, 4px)", zIndex: 1 }}
            aria-hidden
          />
        </>
      )}

      {/* Main card */}
      <Card
        className={cn(
          "group relative flex flex-col h-[350px] bg-card hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden cursor-pointer",
          count > 1 && "shadow-md z-10",
        )}
        onClick={handleCardClick}
      >
        <div className="p-4 flex flex-col gap-2.5 flex-1 overflow-hidden">
          <JobCardHeader
            title={job.title}
            daysAgo={currentJob.days_ago}
            location={job.location}
          />

          <JobCardTags
            salaryText={salaryText}
            jobType={job.jobType}
            isVerified={job.isVerified}
          />

          {/* Company Logo + Name */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-12 h-12 shrink-0 rounded-lg border border-border bg-card p-1.5 flex items-center justify-center">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">
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
              <Wrench className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1 flex-1">
                {job.tags.slice(0, 5).map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <JobCardActions
            job={job} // JobPosting
            currentRankedJob={currentJob} // RankedJob
            isSaved={isSaved}
            onSave={onSave}
            onViewDetails={onViewDetails}
            onViewAnalysis={onViewAnalysis}
            onReport={onReport}
          />

          {/* Border + Job Posting + pagination */}
          <div className="px-4 pb-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              {currentJob.redirect_url && (
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
              )}{" "}
              {count > 1 && (
                <>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-40"
                      onClick={handlePagination(prevIndex)}
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
                              ? "bg-foreground"
                              : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                          )}
                          onClick={handlePagination(i)}
                          aria-label={`Job ${i + 1} of ${count}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-40"
                      onClick={handlePagination(nextIndex)}
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
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-sm border-0 gap-1 cursor-pointer"
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
