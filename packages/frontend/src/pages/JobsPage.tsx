import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { logApplication, getUserApplications } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Loader2, AlertCircle } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { JobPosting, JobFilters } from "@/lib/types";
import { Pagination } from "@/components/ui/pagination";

// Discover API (AI-powered search)
import {
  discoverJobs,
  DiscoverResponse,
  DiscoveredJob,
  ParsedQuery,
  Refinement,
  FacetSuggestion,
  ConfidenceMetrics,
  SearchContext,
} from "@/lib/discover-api";

// Components
import { JobCard } from "@/components/jobs/JobCard";
import { GroupedJobCard } from "@/components/jobs/GroupedJobCard";
import { FilterModal } from "@/components/jobs/FilterModal";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { JobSearchHeader } from "@/components/jobs/JobSearchHeader";
import { AppliedFilters } from "@/components/jobs/AppliedFilters";
import { RefinementSuggestions } from "@/components/jobs/RefinementSuggestions";
import { FacetSuggestions } from "@/components/jobs/FacetSuggestions";

// RankedJob-compatible type cast — DiscoveredJob has all required fields
import type { RankedJob } from "@/lib/jobs-api";

// Transform discovered job to UI JobPosting
const toJobPosting = (job: DiscoveredJob): JobPosting => ({
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
    hiringLikelihood:
      job.breakdown?.hiring_activity || job.breakdown?.hiring_likelihood || 0,
    resumeMatch: job.breakdown?.resume_match || 0,
    recency: job.breakdown?.recency || 0,
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

// Cast DiscoveredJob to RankedJob for components that expect RankedJob
const toRankedJob = (job: DiscoveredJob): RankedJob => ({
  id: job.id,
  title: job.title,
  description: job.description,
  company: job.company,
  location: job.location,
  salary_display: job.salary_display,
  category: job.category,
  days_ago: job.days_ago,
  redirect_url: job.redirect_url,
  true_score: job.true_score,
  risk_level: job.risk_level,
  breakdown: job.breakdown,
});

// Helper for GroupedJobCard: RankedJob -> JobPosting
const rankedToJobPosting = (job: RankedJob): JobPosting => ({
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

export function JobsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  // Search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversation history (intent stack)
  const [history, setHistory] = useState<string[]>([]);

  // Results state
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [suggestions, setSuggestions] = useState<Refinement[]>([]);
  const [facetSuggestions, setFacetSuggestions] = useState<FacetSuggestion[]>(
    [],
  );
  const [excludedCount, setExcludedCount] = useState(0);
  const [confidence, setConfidence] = useState<ConfidenceMetrics | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(
    null,
  );

  // UI state
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<DiscoveredJob | null>(null);
  const [filters, setFilters] = useState<JobFilters>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(42);

  // Load applied jobs on mount
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

  // Core search function
  const performDiscoverSearch = useCallback(
    async (
      searchQuery: string,
      searchRefinements: string[],
      pageNum: number,
      limit: number,
      context: SearchContext | null,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response: DiscoverResponse = await discoverJobs({
          query: searchQuery,
          refinements: searchRefinements,
          page: pageNum,
          limit,
          context: context || undefined,
        });

        setJobs(response.jobs);
        setTotal(response.total);
        setParsedQuery(response.parsed_query);
        setSuggestions(response.suggestions);
        setFacetSuggestions(response.facet_suggestions || []);
        setExcludedCount(response.excluded_count);
        setConfidence(response.confidence || null);
        setSearchContext(response.context || null);
        setPage(pageNum);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message: unknown }).message)
              : "Search failed";
        setError(message);
        setJobs([]);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Handle initial search (first query)
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      const newHistory = [query];
      setHistory(newHistory);
      setSearchContext(null); // Reset context for new search
      await performDiscoverSearch(query, [], 1, itemsPerPage, null);
    },
    [itemsPerPage, performDiscoverSearch],
  );

  // Handle refinement (subsequent queries)
  const handleRefine = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const newHistory = [...history, text];
      // Refinements are all items after the first (which is the main query)
      const refinements = newHistory.slice(1);
      setHistory(newHistory);
      await performDiscoverSearch(
        newHistory[0],
        refinements,
        1,
        itemsPerPage,
        searchContext,
      );
    },
    [history, loading, itemsPerPage, searchContext, performDiscoverSearch],
  );

  // Handle intent undo — remove pill at index and everything after
  const handleHistoryUndo = useCallback(
    async (index: number) => {
      if (loading) return;

      if (index === 0) {
        // Clear everything
        setHistory([]);
        setJobs([]);
        setTotal(0);
        setParsedQuery(null);
        setSuggestions([]);
        setFacetSuggestions([]);
        setExcludedCount(0);
        setConfidence(null);
        setSearchContext(null);
        return;
      }

      // Keep history up to (but not including) the clicked index
      const newHistory = history.slice(0, index);
      const refinements = newHistory.slice(1);
      setHistory(newHistory);
      setSearchContext(null); // Reset context since we're replaying
      await performDiscoverSearch(
        newHistory[0],
        refinements,
        1,
        itemsPerPage,
        null,
      );
    },
    [history, loading, itemsPerPage, performDiscoverSearch],
  );

  // Handle refinement suggestion click
  const handleRefinementClick = useCallback(
    async (signal: string) => {
      if (!signal || loading || history.length === 0) return;
      await handleRefine(signal);
    },
    [loading, history, handleRefine],
  );

  // Handle applied filter removal
  const handleRemoveFilter = useCallback(
    async (filterType: string, value: string) => {
      if (loading || history.length === 0) return;
      const signalToRemove = value.toLowerCase();
      const newHistory = history.filter(
        (h) => !h.toLowerCase().includes(signalToRemove),
      );
      if (newHistory.length === 0) {
        handleHistoryUndo(0);
        return;
      }
      const refinements = newHistory.slice(1);
      setHistory(newHistory);
      setSearchContext(null);
      await performDiscoverSearch(
        newHistory[0],
        refinements,
        1,
        itemsPerPage,
        null,
      );
    },
    [history, loading, itemsPerPage, handleHistoryUndo, performDiscoverSearch],
  );

  // Handle apply
  const handleApply = async (job: DiscoveredJob) => {
    if (!user?.id) {
      navigate("/sign-in");
      return;
    }
    if (job.redirect_url) {
      window.open(job.redirect_url, "_blank");
    }
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

  const handleReport = (job: DiscoveredJob) => {
    navigate(
      `/report-scam?url=${encodeURIComponent(
        job.redirect_url,
      )}&company=${encodeURIComponent(job.company)}`,
    );
  };

  const handleViewAnalysis = (job: DiscoveredJob) => {
    navigate(`/results?url=${encodeURIComponent(job.redirect_url)}`);
  };

  // Apply local filters
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

  // Group jobs by company
  const jobGroups = React.useMemo(() => {
    const groups = new Map<string, DiscoveredJob[]>();
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
    if (loading || history.length === 0) return;
    const refinements = history.slice(1);
    performDiscoverSearch(
      history[0],
      refinements,
      newPage,
      itemsPerPage,
      searchContext,
    );
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    if (history.length > 0) {
      const refinements = history.slice(1);
      performDiscoverSearch(
        history[0],
        refinements,
        1,
        newItemsPerPage,
        searchContext,
      );
    }
  };

  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      <JobSearchHeader
        history={history}
        onSearch={handleSearch}
        onRefine={handleRefine}
        onHistoryUndo={handleHistoryUndo}
        loading={loading}
        total={displayTotal}
      />

      {/* Suggestions & Filters Bar (below search header) */}
      {history.length > 0 && (
        <div className="border-b border-border bg-background/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Applied Filters */}
            {parsedQuery && (
              <AppliedFilters
                parsedQuery={parsedQuery}
                onRemoveFilter={handleRemoveFilter}
              />
            )}

            {/* Refinement Suggestions */}
            {!loading && suggestions.length > 0 && (
              <RefinementSuggestions
                suggestions={suggestions}
                onRefinementClick={handleRefinementClick}
              />
            )}

            {/* Faceted Spectrum Suggestions */}
            {!loading && facetSuggestions.length > 0 && (
              <FacetSuggestions
                suggestions={facetSuggestions}
                onFacetClick={handleRefinementClick}
              />
            )}

            {/* Low confidence alert */}
            {!loading && confidence?.is_low_confidence && jobs.length > 0 && (
              <div className="py-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Results may be broad — try adding more details like seniority,
                  location, or skills.
                  {confidence.retry_used && " (auto-retry was used)"}
                </span>
              </div>
            )}

            {/* Excluded count */}
            {excludedCount > 0 && (
              <div className="pb-3 text-xs text-amber-600">
                {excludedCount} jobs filtered by your exclusions
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Analyzing your query and finding matches...
              </p>
            </div>
          ) : filteredJobs.length === 0 && history.length > 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-muted-foreground">
                No jobs found matching your criteria.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try broadening your search or removing some filters.
              </p>
            </div>
          ) : filteredJobs.length === 0 && history.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-medium mb-2">Start Your Search</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Describe your ideal job above. Try something like "senior python
                developer at startups, not management"
              </p>
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
                      onApply={() => handleApply(primary)}
                      onViewDetails={() => setSelectedJob(primary)}
                      onReport={() => handleReport(primary)}
                      onViewAnalysis={() => handleViewAnalysis(primary)}
                      className={
                        appliedJobIds.has(primary.id) ? "opacity-75" : ""
                      }
                    />
                  ) : (
                    <GroupedJobCard
                      key={`group-${primary.id}`}
                      primaryJob={toRankedJob(primary)}
                      jobs={companyJobs.map(toRankedJob)}
                      toJobPosting={rankedToJobPosting}
                      isSaved={isJobSaved}
                      onSave={(jp) => toggleSaveJob(jp)}
                      onApply={(rj) => {
                        const orig = companyJobs.find((j) => j.id === rj.id);
                        if (orig) handleApply(orig);
                      }}
                      onViewDetails={(rj) => {
                        const orig = companyJobs.find((j) => j.id === rj.id);
                        if (orig) setSelectedJob(orig);
                      }}
                      onReport={(rj) => {
                        const orig = companyJobs.find((j) => j.id === rj.id);
                        if (orig) handleReport(orig);
                      }}
                      onViewAnalysis={(rj) => {
                        const orig = companyJobs.find((j) => j.id === rj.id);
                        if (orig) handleViewAnalysis(orig);
                      }}
                      appliedJobIds={appliedJobIds}
                    />
                  ),
                )}
              </div>

              {/* Pagination */}
              {filteredJobs.length > 0 && totalPages > 1 && (
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
          onApply={() => handleApply(selectedJob)}
        />
      )}
    </PageWrapper>
  );
}
