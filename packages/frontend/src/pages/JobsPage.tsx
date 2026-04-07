import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { logApplication, getUserApplications } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Loader2, Briefcase } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useHybridJobs } from "@/hooks/useHybridJobs";
import type { DiscoveredJob } from "@/lib/discover-api";
import type { RankedJob } from "@/lib/jobs-api";
import { JobPosting, JobFilters } from "@/lib/types";
import { Pagination } from "@/components/ui/pagination";

// Components
import { JobCard } from "@/components/jobs/JobCard";
import { GroupedJobCard } from "@/components/jobs/GroupedJobCard";
import { FilterModal } from "@/components/jobs/FilterModal";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { JobSearchHeader } from "@/components/jobs/JobSearchHeader";
import { FilterBar } from "@/components/jobs/FilterBar";
import { FacetSuggestions } from "@/components/jobs/FacetSuggestions";

type JobSearchResult = RankedJob | DiscoveredJob;

const toJobPosting = (job: JobSearchResult): JobPosting => ({
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
    authenticity: job.breakdown?.authenticity ?? 0,
    hiringLikelihood: job.breakdown?.hiring_activity ?? (job.breakdown as { hiring_likelihood?: number } | undefined)?.hiring_likelihood ?? 0,
    resumeMatch: job.breakdown?.resume_match ?? 0,
    companyReputation: job.breakdown?.company_reputation ?? 0,
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
  frictionSignals: job.friction_signals,
});

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
    (user?.unsafeMetadata?.parsedResume as { raw_text?: string })?.raw_text ?? "";

  const {
    jobs,
    loading,
    scoresLoading,
    total,
    page,
    goToPage,
    facet_suggestions,
    search,
    refineWithFacet,
    currentQuery,
    refinements,
    clearSearch,
  } = useHybridJobs({ getToken, resumeText });

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<RankedJob | DiscoveredJob | null>(null);
  const [filters, setFilters] = useState<JobFilters>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [jobType, setJobType] = useState(searchParams.get("jobType") || "all");
  const [itemsPerPage, setItemsPerPage] = useState(42);
  const [province, setProvince] = useState(initialProvince);
  const [city, setCity] = useState(initialCity);

  // Run initial search on mount: default jobs (empty query) or URL query
  useEffect(() => {
    const q = initialQuery.trim();
    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const safePage = (!Number.isNaN(initialPage) && Number.isFinite(initialPage) && initialPage >= 1) ? initialPage : 1;
    search(q || "", {
      province: initialProvince,
      city: initialCity,
      jobType: searchParams.get("jobType") || "all",
      limit: 42,
      page: safePage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadApplied = async () => {
      if (!user?.id) return;
      try {
        const token = await getToken();
        const response = await getUserApplications(50, token || undefined);
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

  const handleSearch = (q: string, p?: string, c?: string, j?: string) => {
    const newProvince = p ?? province;
    const newCity = c ?? city;
    const newJobType = j ?? jobType;

    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (newProvince) params.province = newProvince;
    if (newCity) params.city = newCity;
    if (newJobType && newJobType !== "all") params.jobType = newJobType;

    setSearchParams(params);

    const queryToUse = q.trim();

    const refinementsFromJobType =
      newJobType && newJobType !== "all" ? [newJobType] : [];
    search(queryToUse || "", {
      province: newProvince,
      city: newCity,
      refinements: [...refinements, ...refinementsFromJobType],
      limit: itemsPerPage,
    });
  };

  const handlePostedWithinChange = (days: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      postedWithinDays: days,
    }));
  };

  const handleJobTypeChange = (type: string) => {
    setJobType(type);
    const q = searchParams.get("q") || currentQuery || "";
    handleSearch(q, province, city, type);
  };

  const handleApply = async (job: JobSearchResult) => {
    if (!user?.id) {
      navigate("/sign-in");
      return;
    }
    // Open job URL immediately to avoid browser popup blocker
    if (job.redirect_url) {
      window.open(job.redirect_url, "_blank");
    }
    // Log application in the background
    try {
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
      }
    } catch (err) {
      console.error("Failed to log application:", err);
    }
  };

  const handleReport = (job: RankedJob | DiscoveredJob) => {
    navigate(
      `/report-scam?url=${encodeURIComponent(
        job.redirect_url,
      )}&company=${encodeURIComponent(job.company)}`,
    );
  };

  const handleViewAnalysis = (job: JobSearchResult) => {
    navigate(`/results?url=${encodeURIComponent(job.redirect_url)}`);
  };

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
    const groups = new Map<string, (RankedJob | DiscoveredJob)[]>();
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
        (a, b) => (a.true_score ?? 0) - (b.true_score ?? 0),
      );
      const primary = sorted[sorted.length - 1] ?? companyJobs[0];
      return { primary, jobs: companyJobs };
    });
  }, [filteredJobs]);

  const displayTotal =
    Object.keys(filters).length > 0 ? filteredJobs.length : total;

  const totalPages = Math.max(1, Math.ceil(displayTotal / itemsPerPage));

  const handlePageChange = (newPage: number) => {
    if (loading) return;
    goToPage(newPage);

    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    setSearchParams(params);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      <JobSearchHeader
        initialQuery={initialQuery}
        onSearch={(query) => handleSearch(query)}
        loading={loading}
        total={displayTotal}
      />

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4">
        <FilterBar
          province={province}
          city={city}
          jobType={jobType}
          onProvinceChange={(p) => {
            setProvince(p);
            const q = searchParams.get("q") || currentQuery || "";
            handleSearch(q, p, "", jobType);
          }}
          onCityChange={(c) => {
            setCity(c);
            const q = searchParams.get("q") || currentQuery || "";
            handleSearch(q, province, c, jobType);
          }}
          onJobTypeChange={handleJobTypeChange}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Faceted search suggestions - expand/narrow by dimension */}
          {filteredJobs.length > 0 && (
            <FacetSuggestions
              suggestions={facet_suggestions}
              onFacetClick={(signal) => refineWithFacet(signal)}
              loading={loading}
            />
          )}

          {(loading || scoresLoading) && jobs.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex justify-center py-16 sm:py-24">
              <div className="text-center max-w-md bg-card/50 ring-1 ring-border rounded-xl p-8 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No jobs found
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  We couldn't find any positions matching your current filters.
                  Try adjusting your search terms or location.
                </p>
                <button
                  onClick={() => {
                    setProvince("");
                    setCity("");
                    setJobType("all");
                    handleSearch(initialQuery, "", "", "all");
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {jobGroups.map(({ primary, jobs: companyJobs }) =>
                  companyJobs.length === 1 ? (
                    <JobCard
                      key={primary.id}
                      job={toJobPosting(primary)}
                      daysAgo={primary.days_ago}
                      isSaved={isJobSaved(primary.id)}
                      onSave={() => toggleSaveJob(toJobPosting(primary))}
                      onViewDetails={() => setSelectedJob(primary)}
                      onReport={() => handleReport(primary)}
                      onViewAnalysis={() => handleViewAnalysis(primary)}
                    />
                  ) : (
                    <GroupedJobCard
                      key={`group-${primary.id}`}
                      primaryJob={primary}
                      jobs={companyJobs}
                      toJobPosting={toJobPosting}
                      isSaved={isJobSaved}
                      onSave={(jp) => toggleSaveJob(jp)}
                      onViewDetails={setSelectedJob}
                      onReport={handleReport}
                      onViewAnalysis={handleViewAnalysis}
                    />
                  ),
                )}
              </div>

              {/* Pagination */}
              {filteredJobs.length > 0 && (
                <div className="sticky bottom-0 z-40 mt-6 sm:mt-8 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 bg-background shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-15px_40px_-5px_rgba(0,0,0,0.3)]">
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

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </PageWrapper>
  );
}
