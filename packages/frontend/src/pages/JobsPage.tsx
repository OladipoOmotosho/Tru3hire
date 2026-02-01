import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { logApplication, getUserApplications } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Loader2 } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useProgressiveJobs } from "@/hooks/useProgressiveJobs";
import { RankedJob } from "@/lib/jobs-api";
import { JobPosting, JobFilters } from "@/lib/types";
import { Pagination } from "@/components/ui/pagination";

// Components
import { JobCard } from "@/components/jobs/JobCard";
import { GroupedJobCard } from "@/components/jobs/GroupedJobCard";
import { FilterModal } from "@/components/jobs/FilterModal";
import { JobSearchHeader } from "@/components/jobs/JobSearchHeader";

export function JobsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  const initialQuery = searchParams.get("q") || "";
  const initialProvince = searchParams.get("province") || "";
  const initialCity = searchParams.get("city") || "";

  const resumeText =
    (user?.unsafeMetadata?.parsedResume as { raw_text?: string })?.raw_text ||
    "";

  const {
    jobs,
    loading,
    total,
    page,
    hasMore,
    search,
    goToPage,
    scoresLoading,
  } = useProgressiveJobs({ resumeText });

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<JobFilters>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [jobType, setJobType] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(42);

  useEffect(() => {
    search(initialQuery, {
      province: initialProvince,
      city: initialCity,
      jobType,
      limit: itemsPerPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search is stable
  }, [initialQuery, initialProvince, initialCity, jobType, itemsPerPage]);

  useEffect(() => {
    const loadApplied = async () => {
      if (!user?.id) return;
      try {
        const response = await getUserApplications(user.id);
        if (response?.applications) {
          const ids = new Set(
            response.applications
              .map(
                (app) => app.job_id || `${app.job_title}-${app.company_name}`
              )
              .filter(Boolean) as string[]
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
    search(q, { province: p, city: c, jobType, limit: itemsPerPage });
  };

  const handlePostedWithinChange = (days: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      postedWithinDays: days,
    }));
  };

  const handleJobTypeChange = (type: string) => {
    setJobType(type);
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
      `/report-scam?url=${encodeURIComponent(
        job.redirect_url
      )}&company=${encodeURIComponent(job.company)}`
    );
  };

  const handleViewAnalysis = (job: RankedJob) => {
    navigate(`/results?url=${encodeURIComponent(job.redirect_url)}`);
  };

  const toJobPosting = (job: RankedJob): JobPosting => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    postedDate: new Date(
      Date.now() - job.days_ago * 24 * 60 * 60 * 1000
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
    tags: job.category ? [job.category] : [],
    isVerified: false,
    isFreshPosting: job.days_ago <= 7,
    isDiversityFriendly: false,
    hasInsights: false,
    jobType: "Full-time",
    salary: job.salary_display ? { min: 0, max: 0 } : undefined,
    salaryDisplay: job.salary_display || undefined,
    companyLogo: undefined,
  });

  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const {
        trueScoreMin,
        trueScoreMax,
        postedWithinDays,
        freshPostingsOnly,
      } = filters;

      if (
        trueScoreMin !== undefined &&
        (job.true_score === undefined || job.true_score < trueScoreMin)
      )
        return false;
      if (
        trueScoreMax !== undefined &&
        (job.true_score === undefined || job.true_score > trueScoreMax)
      )
        return false;
      if (postedWithinDays !== undefined && job.days_ago > postedWithinDays)
        return false;
      if (freshPostingsOnly && job.days_ago > 7) return false;

      return true;
    });
  }, [jobs, filters]);

  /** Group jobs by company (normalized name). Single-role companies = JobCard, multi-role = GroupedJobCard */
  const jobGroups = React.useMemo(() => {
    const groups = new Map<string, RankedJob[]>();
    const normalizeCompany = (s: string) =>
      s.toLowerCase().trim().replace(/\s+/g, " ");

    for (const job of filteredJobs) {
      const key = normalizeCompany(job.company);
      const existing = groups.get(key);
      if (existing) {
        existing.push(job);
      } else {
        groups.set(key, [job]);
      }
    }

    return Array.from(groups.values()).map((companyJobs) => {
      const sorted = [...companyJobs].sort(
        (a, b) => (a.true_score ?? 0) - (b.true_score ?? 0)
      );
      const primary = sorted[sorted.length - 1] ?? companyJobs[0];
      return { primary, jobs: companyJobs };
    });
  }, [filteredJobs]);

  const displayTotal =
    Object.keys(filters).length > 0 ? filteredJobs.length : total;

  const totalPages = Math.max(1, Math.ceil(displayTotal / itemsPerPage));

  const handlePageChange = (newPage: number) => {
    if (loading || scoresLoading) return;
    goToPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false}>
      <JobSearchHeader
        initialQuery={initialQuery}
        initialProvince={initialProvince}
        initialCity={initialCity}
        initialPostedWithin={(filters.postedWithinDays as number) ?? undefined}
        initialJobType={jobType}
        onSearch={handleSearch}
        onPostedWithinChange={handlePostedWithinChange}
        onJobTypeChange={handleJobTypeChange}
        onAdvanceFilterClick={() => setFilterModalOpen(true)}
        loading={loading}
        total={displayTotal}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobGroups.map(({ primary, jobs: companyJobs }) =>
                  companyJobs.length === 1 ? (
                    <JobCard
                      key={primary.id}
                      job={toJobPosting(primary)}
                      daysAgo={primary.days_ago}
                      isSaved={isJobSaved(primary.id)}
                      onSave={() => toggleSaveJob(toJobPosting(primary))}
                      onApply={() => handleApply(primary)}
                      onReport={() => handleReport(primary)}
                      onViewAnalysis={() => handleViewAnalysis(primary)}
                      className={
                        appliedJobIds.has(primary.id) ? "opacity-75" : ""
                      }
                    />
                  ) : (
                    <GroupedJobCard
                      key={primary.company + primary.id}
                      primaryJob={primary}
                      jobs={companyJobs}
                      toJobPosting={toJobPosting}
                      isSaved={isJobSaved}
                      onSave={(jp) => toggleSaveJob(jp)}
                      onApply={handleApply}
                      onReport={handleReport}
                      onViewAnalysis={handleViewAnalysis}
                      appliedJobIds={appliedJobIds}
                    />
                  )
                )}
              </div>

              {/* Pagination */}
              {filteredJobs.length > 0 && (
                <div className="mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={displayTotal}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </PageWrapper>
  );
}
