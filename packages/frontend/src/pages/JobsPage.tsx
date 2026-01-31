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
  const { jobs, loading, total, search } = useProgressiveJobs({ resumeText });

  // Local State
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({}); // Simple state for now, can be expanded

  // Initial Search
  useEffect(() => {
    search(initialQuery, {
      province: initialProvince,
      city: initialCity,
    });
  }, []); // Run once on mount

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
    const params: any = {};
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
    isVerified: false,
    isFreshPosting: job.days_ago <= 7,
    isDiversityFriendly: false,
    hasInsights: false,
    jobType: "Full-time",
  });

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
                {total > 0 ? `${total} Jobs Found` : "Job Results"}
              </h2>
            </div>

            {loading && jobs.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-muted-foreground">
                  No jobs found. Try adjusting your search.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={toJobPosting(job)}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(toJobPosting(job))}
                    onApply={() => handleApply(job)}
                    className={appliedJobIds.has(job.id) ? "opacity-75" : ""}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
