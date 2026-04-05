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
import type { DiscoveredJob } from "@/lib/discover-api";

/** Jobs from discover (DiscoveredJob) or simple search (RankedJob) */
type JobSearchResult = RankedJob | DiscoveredJob;
import { JobCardHeader } from "./JobCardHeader";
import { JobCardTags } from "./JobCardTags";
import { JobCardActions } from "./JobCardActions";

interface GroupedJobCardProps {
  /** Primary job to display on the top card */
  primaryJob: JobSearchResult;
  /** All jobs from this company (including primary) */
  jobs: JobSearchResult[];
  toJobPosting: (job: JobSearchResult) => JobPosting;
  isSaved?: (jobId: string) => boolean;
  onSave?: (job: JobPosting) => void;
  onViewDetails?: (job: JobSearchResult) => void;
  onReport?: (job: JobSearchResult) => void;
  onViewAnalysis?: (job: JobSearchResult) => void;
  className?: string;
}

export function GroupedJobCard({
  primaryJob,
  jobs,
  toJobPosting,
  isSaved = () => false,
  onSave,
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
            className="absolute inset-0 rounded-md bg-card border border-border"
            style={{ transform: "translate(8px, 8px)", zIndex: 0 }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-md bg-card border border-border"
            style={{ transform: "translate(4px, 4px)", zIndex: 1 }}
            aria-hidden
          />
        </>
      )}

      {/* Main card */}
      <Card
        className={cn(
          "group relative flex flex-col h-[350px] bg-card hover:shadow-lg transition-all duration-200 rounded-md overflow-hidden",
          count > 1 && "shadow-md z-10",
        )}
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
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  Apply
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
                      {(() => {
                        const MAX_DOTS = 5;
                        if (count <= MAX_DOTS) {
                          // Show all dots when count is small
                          return jobs.map((_, i) => (
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
                          ));
                        }

                        // For large counts, show: [first] ... [window around active] ... [last]
                        const dots: React.ReactNode[] = [];
                        const windowStart = Math.max(
                          1,
                          Math.min(index - 1, count - 4),
                        );
                        const windowEnd = Math.min(
                          count - 2,
                          Math.max(index + 1, 3),
                        );

                        // First dot
                        dots.push(
                          <button
                            key={0}
                            type="button"
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              index === 0
                                ? "bg-foreground"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                            )}
                            onClick={handlePagination(0)}
                            aria-label={`Job 1 of ${count}`}
                          />,
                        );

                        // Left ellipsis
                        if (windowStart > 1) {
                          dots.push(
                            <span
                              key="left-ellipsis"
                              className="text-[8px] text-muted-foreground px-0.5"
                            >
                              …
                            </span>,
                          );
                        }

                        // Window dots
                        for (let i = windowStart; i <= windowEnd; i++) {
                          dots.push(
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
                            />,
                          );
                        }

                        // Right ellipsis
                        if (windowEnd < count - 2) {
                          dots.push(
                            <span
                              key="right-ellipsis"
                              className="text-[8px] text-muted-foreground px-0.5"
                            >
                              …
                            </span>,
                          );
                        }

                        // Last dot
                        dots.push(
                          <button
                            key={count - 1}
                            type="button"
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              index === count - 1
                                ? "bg-foreground"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                            )}
                            onClick={handlePagination(count - 1)}
                            aria-label={`Job ${count} of ${count}`}
                          />,
                        );

                        return dots;
                      })()}
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


      </Card>
    </div>
  );
}
