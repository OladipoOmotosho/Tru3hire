import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Loader2, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/JobCard";
import { AISearchInput } from "@/components/jobs/AISearchInput";
import { AppliedFilters } from "@/components/jobs/AppliedFilters";
import { RefinementSuggestions } from "@/components/jobs/RefinementSuggestions";
import { FacetSuggestions } from "@/components/jobs/FacetSuggestions";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { Pagination } from "@/components/ui/pagination";
import { logApplication } from "@/lib/api";
import { useSavedJobs } from "@/hooks/useSavedJobs";
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
import { JobPosting } from "@/lib/types";

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

export function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  // Search state
  const [query, setQuery] = useState("");
  const [refinements, setRefinements] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<DiscoveredJob | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceMetrics | null>(null);
  const [searchContext, setSearchContext] = useState<SearchContext | null>(
    null,
  );

  const [itemsPerPage, setItemsPerPage] = useState(40);

  // Shared helper for discover search with proper error handling
  const performDiscoverSearch = useCallback(
    async (
      searchQuery: string,
      searchRefinements: string[],
      pageNum: number,
      limit: number,
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response: DiscoverResponse = await discoverJobs({
          query: searchQuery,
          refinements: searchRefinements,
          page: pageNum,
          limit,
          context: searchContext || undefined,
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

  // Handle search
  const handleSearch = useCallback(
    async (searchQuery: string, pageNum: number = 1) => {
      if (!searchQuery.trim()) return;
      setQuery(searchQuery);
      await performDiscoverSearch(
        searchQuery,
        refinements,
        pageNum,
        itemsPerPage,
      );
    },
    [refinements, itemsPerPage, performDiscoverSearch],
  );

  // Handle refinement click
  const handleRefinementClick = useCallback(
    async (signal: string) => {
      if (!signal || loading) return;

      const previousRefinements = refinements;
      const newRefinements = [...refinements, signal];

      const success = await performDiscoverSearch(
        query,
        newRefinements,
        1,
        itemsPerPage,
      );

      if (success) {
        setRefinements(newRefinements);
      } else {
        // Rollback on error
        setRefinements(previousRefinements);
      }
    },
    [query, refinements, loading, itemsPerPage, performDiscoverSearch],
  );

  // Handle filter removal
  const handleRemoveFilter = useCallback(
    async (filterType: string, value: string) => {
      if (loading || !query) return;

      const previousRefinements = refinements;
      const signalToRemove = value.toLowerCase();
      const newRefinements = refinements.filter(
        (r) => !r.toLowerCase().includes(signalToRemove),
      );

      const success = await performDiscoverSearch(
        query,
        newRefinements,
        1,
        itemsPerPage,
      );

      if (success) {
        setRefinements(newRefinements);
      } else {
        // Rollback on error
        setRefinements(previousRefinements);
      }
    },
    [query, refinements, loading, itemsPerPage, performDiscoverSearch],
  );

  // Refetch when itemsPerPage changes (if we have a query)
  useEffect(() => {
    if (query && jobs.length > 0) {
      performDiscoverSearch(query, refinements, 1, itemsPerPage);
    }
    // Only trigger on itemsPerPage change, not on other deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  // Handle apply
  const handleApply = async (job: DiscoveredJob) => {
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

  // Handle report
  const handleReport = (job: DiscoveredJob) => {
    navigate(
      `/report-scam?url=${encodeURIComponent(
        job.redirect_url,
      )}&company=${encodeURIComponent(job.company)}`,
    );
  };

  // Handle view analysis
  const handleViewAnalysis = (job: DiscoveredJob) => {
    navigate(`/results?url=${encodeURIComponent(job.redirect_url)}`);
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  const handlePageChange = (newPage: number) => {
    if (loading) return;
    handleSearch(query, newPage);
  };

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false}>
      {/* Header */}
      <div className="bg-linear-to-br from-primary/5 to-primary/10 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/jobs")}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Classic Search
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Job Discovery</h1>
              <p className="text-muted-foreground">
                Describe what you're looking for in natural language
              </p>
            </div>
          </div>

          <AISearchInput
            initialQuery={query}
            onSearch={(q) => handleSearch(q, 1)}
            loading={loading}
          />

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

          {/* Results summary */}
          {jobs.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {total.toLocaleString()} jobs found
              {excludedCount > 0 && (
                <span className="ml-2 text-amber-600">
                  ({excludedCount} filtered by your exclusions)
                </span>
              )}
            </div>
          )}

          {/* Low confidence alert */}
          {!loading && confidence?.is_low_confidence && jobs.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Results may be broad — try adding more details like seniority,
                location, or skills.
                {confidence.retry_used && " (auto-retry was used)"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Analyzing your query and finding matches...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && query && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-muted-foreground mb-4">
              No jobs found matching your criteria.
            </p>
            <p className="text-sm text-muted-foreground">
              Try broadening your search or removing some filters.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!loading && jobs.length === 0 && !query && (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Start Your Search</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Describe your ideal job above. Try something like "senior python
              developer at startups, not management"
            </p>
          </div>
        )}

        {/* Job grid */}
        {jobs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => (
                <div key={job.id} className="relative group/score">
                  {/* AI Match Score badge + breakdown tooltip */}
                  {job.true_score != null && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="relative">
                        {/* Tooltip on hover */}
                        <div className="absolute right-0 top-full mt-1 w-60 opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-150 z-20">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 text-xs">
                            {/* Relevance breakdown (if available) */}
                            {job.score_breakdown && (
                              <>
                                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                  Relevance
                                </p>
                                <div className="space-y-1 mb-3">
                                  {[
                                    {
                                      label: "Embedding",
                                      value: Math.round(
                                        (job.score_breakdown.relevance
                                          .embedding_score || 0) * 100,
                                      ),
                                    },
                                    {
                                      label: "Keywords",
                                      value: Math.round(
                                        (job.score_breakdown.relevance
                                          .keyword_score || 0) * 100,
                                      ),
                                    },
                                  ].map((metric) => (
                                    <div
                                      key={metric.label}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">
                                        {metric.label}
                                      </span>
                                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className="bg-blue-500 rounded-full h-1.5 transition-all"
                                          style={{
                                            width: `${metric.value}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-gray-500 w-8 text-right">
                                        {metric.value}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                              </>
                            )}
                            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                              TrueScore breakdown
                            </p>
                            <div className="space-y-1">
                              {[
                                {
                                  label: "Authenticity",
                                  value: job.breakdown?.authenticity,
                                },
                                {
                                  label: "Hiring",
                                  value:
                                    job.breakdown?.hiring_activity ||
                                    job.breakdown?.hiring_likelihood,
                                },
                                {
                                  label: "Resume",
                                  value: job.breakdown?.resume_match,
                                },
                                {
                                  label: "Recency",
                                  value: job.breakdown?.recency,
                                },
                                {
                                  label: "Reputation",
                                  value: job.breakdown?.company_reputation,
                                },
                              ].map((metric) => (
                                <div
                                  key={metric.label}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">
                                    {metric.label}
                                  </span>
                                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-primary rounded-full h-1.5 transition-all"
                                      style={{
                                        width: `${Math.round(metric.value || 0)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-gray-500 w-8 text-right">
                                    {Math.round(metric.value || 0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                            {/* Final score */}
                            {job.final_score != null && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                  Final Score
                                </span>
                                <span className="font-bold text-primary">
                                  {Math.round(job.final_score * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Matched signals pills */}
                  {job.matched_signals && job.matched_signals.length > 0 && (
                    <div className="absolute bottom-2 right-2 z-10 flex flex-wrap gap-1 max-w-[70%] justify-end">
                      {job.matched_signals.slice(0, 3).map((signal) => (
                        <span
                          key={signal}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}
                  <JobCard
                    job={toJobPosting(job)}
                    daysAgo={job.days_ago}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(toJobPosting(job))}
                    onApply={() => handleApply(job)}
                    onViewDetails={() => setSelectedJob(job)}
                    onReport={() => handleReport(job)}
                    onViewAnalysis={() => handleViewAnalysis(job)}
                    className={appliedJobIds.has(job.id) ? "opacity-75" : ""}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {jobs.length > 0 && totalPages > 1 && (
              <div className="mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={total}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>

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
