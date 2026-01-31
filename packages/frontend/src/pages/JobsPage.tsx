import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { logApplication, getUserApplications } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useProgressiveJobs } from "@/hooks/useProgressiveJobs";
import { RankedJob } from "@/lib/jobs-api";
import { JobPosting } from "@/lib/types";

// Components
import { JobCard } from "@/components/jobs/JobCard";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { JobSearchHeader } from "@/components/jobs/JobSearchHeader";

export function JobsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  // URL State
  const initialQuery = searchParams.get("q") || "";
  const initialProvince = searchParams.get("province") || "";
  const initialCity = searchParams.get("city") || "";

  // Resume Text for matching
  const resumeText =
    (user?.unsafeMetadata?.parsedResume as { raw_text?: string })?.raw_text ||
    "";

  // Data Fetching Hook
  const { jobs, loading, total, hasMore, search, loadMore, scoresLoading } =
    useProgressiveJobs({ resumeText });

  // Local State
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({}); // Simple state for now, can be expanded

  // Initial Search
  useEffect(() => {
    search(initialQuery, {
      province: initialProvince,
      city: initialCity,
    });
  }, [initialQuery, initialProvince, initialCity]); // Run when URL params change

  // Load Applied Jobs
  useEffect(() => {
    const loadApplied = async () => {
      if (!user?.id) return;
      try {
        const response = await getUserApplications(user.id);
        if (response?.applications) {
          const ids = new Set(
            response.applications
              .map(
                (app) => app.job_id || `${app.job_title}-${app.company_name}`,
              )
              .filter(Boolean) as string[],
          );
          setAppliedJobIds(ids);
        }
      } catch (e) {
        console.error("Failed to load applied jobs", e);
      }
    };
    loadApplied();
  }, [user?.id]);

  const handleSearch = (q: string, p: string, c: string) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (p) params.province = p;
    if (c) params.city = c;
    setSearchParams(params);
    search(q, { province: p, city: c });
  };
  const handleApply = async (job: RankedJob) => {
    if (!user?.id) {
      navigate("/sign-in");
      return;
    }
    const token = await getToken();
    if (token) {
      await logApplication(token, {
        job_title: job.title,
        company_name: job.company,
        job_id: job.id,
        job_url: job.redirect_url,
        true_score_at_apply: job.true_score,
        job_age_days: job.days_ago,
      });
      setAppliedJobIds((prev) => new Set([...prev, job.id]));
      window.open(job.redirect_url, "_blank");
    }
  };

  const handleReport = (job: RankedJob) => {
    navigate(
      `/report-scam?url=${encodeURIComponent(job.redirect_url)}&company=${encodeURIComponent(job.company)}`,
    );
  };

  const handleViewAnalysis = (job: RankedJob) => {
    // Navigate to analyze page with job URL pre-filled
    // Assuming AnalyzePage can take query params, or we just copy to clipboard for now
    // Better: Go to Analyze page with url param
    navigate(`/analyze?url=${encodeURIComponent(job.redirect_url)}`);
  };

  // Convert RankedJob to JobPosting for JobCard
  const toJobPosting = (job: RankedJob): JobPosting => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    postedDate: new Date(
      Date.now() - job.days_ago * 24 * 60 * 60 * 1000,
    ).toISOString(),
    trueScore: job.true_score ?? 0,
    trueScoreMetrics: {
      authenticity: job.breakdown?.authenticity || 0,
      hiringLikelihood: job.breakdown?.hiring_activity || 0,
      resumeMatch: job.breakdown?.resume_match || 0,
      companyReputation: job.breakdown?.company_reputation || 0,
    },
    url: job.redirect_url,
    requirements: [],
    tags: [job.category],
    isVerified: false, // These would need backend support
    isFreshPosting: job.days_ago <= 7,
    isDiversityFriendly: false,
    hasInsights: false,
    jobType: "Full-time", // Placeholder
    salary: job.salary_display ? { min: 0, max: 0 } : undefined, // We only have display string often, need to structure if possible or just hide salary if not structured
    // Note: The UI now expects salary object if we want to show it.
    // Ideally RankedJob should have min/max salary. For now we might miss it if backend doesn't send structure.
    companyLogo: undefined, // Need to fetch or use placeholder (handled in Card)
  });

  // Client-side filtering logic
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const {
        trueScoreMin,
        trueScoreMax,
        postedWithinDays,
        verifiedOnly,
        freshPostingsOnly,
        diversityFriendlyOnly,
        // salaryMin, salaryMax // Future implementation
      } = filters as any;

      // TrueScore Filters
      if (
        trueScoreMin !== undefined &&
        (job.true_score === undefined || job.true_score < trueScoreMin)
      ) {
        return false;
      }
      if (
        trueScoreMax !== undefined &&
        (job.true_score === undefined || job.true_score > trueScoreMax)
      ) {
        return false;
      }

      // Date Posted Filter
      if (postedWithinDays !== undefined) {
        // Simple approximation or exact match depends on data accuracy
        if (job.days_ago > postedWithinDays) return false;
      }

      // Trust Badge Filters
      if (freshPostingsOnly && job.days_ago > 7) return false;

      // Note: Verified and Diversity flags would need backend support or property on RankedJob
      // For now, we only implement what we have data for.

      return true;
    });
  }, [jobs, filters]);

  // Adjust total count display if filtering changes it
  const displayTotal =
    Object.keys(filters).length > 0 ? filteredJobs.length : total;

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false}>
      <JobSearchHeader
        initialQuery={initialQuery}
        initialProvince={initialProvince}
        initialCity={initialCity}
        onSearch={handleSearch}
        loading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters - Hidden on mobile for now or need sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              className="sticky top-40"
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {displayTotal > 0
                  ? `${displayTotal} Jobs Found`
                  : "Job Results"}
              </h2>
            </div>

            {loading && jobs.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-muted-foreground">
                  No jobs found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={toJobPosting(job)}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(toJobPosting(job))}
                    onApply={() => handleApply(job)}
                    onReport={() => handleReport(job)}
                    onViewAnalysis={() => handleViewAnalysis(job)}
                    className={appliedJobIds.has(job.id) ? "opacity-75" : ""}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && filteredJobs.length >= 30 && (
              <div className="flex justify-center pt-8 pb-12">
                <Button
                  onClick={loadMore}
                  disabled={loading || scoresLoading}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  {loading || scoresLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load More Jobs"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
