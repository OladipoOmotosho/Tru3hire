import React, { useState, useCallback, useEffect } from "react";
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
  trueScore: job.discovery_score ?? 0,
  trueScoreMetrics: {
    authenticity: job.score_breakdown?.embedding_score * 100 || 0,
    hiringLikelihood: job.score_breakdown?.keyword_score * 100 || 0,
    resumeMatch: job.score_breakdown?.seniority_score * 100 || 0,
    companyReputation: job.score_breakdown?.trait_score * 100 || 0,
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
        });

        setJobs(response.jobs);
        setTotal(response.total);
        setParsedQuery(response.parsed_query);
        setSuggestions(response.suggestions);
        setFacetSuggestions(response.facet_suggestions || []);
        setExcludedCount(response.excluded_count);
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
    const token = await getToken();
    if (token) {
      await logApplication(token, {
        job_title: job.title,
        company_name: job.company,
        job_id: job.id,
        job_url: job.redirect_url,
        true_score_at_apply: job.discovery_score,
        job_age_days: job.days_ago,
      });
      setAppliedJobIds((prev) => new Set([...prev, job.id]));
      window.open(job.redirect_url, "_blank");
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
                  {job.discovery_score != null && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="relative">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-help ${
                            job.discovery_score >= 70
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : job.discovery_score >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                          title="AI Match Score — hover for breakdown"
                        >
                          <Sparkles className="w-3 h-3" />
                          {Math.round(job.discovery_score)}%
                        </span>
                        {/* Tooltip on hover */}
                        <div className="absolute right-0 top-full mt-1 w-52 opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-150 z-20">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 text-xs">
                            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              Why this match?
                            </p>
                            <div className="space-y-1.5">
                              {[
                                {
                                  label: "Relevance",
                                  value: job.score_breakdown?.embedding_score,
                                },
                                {
                                  label: "Keywords",
                                  value: job.score_breakdown?.keyword_score,
                                },
                                {
                                  label: "Seniority",
                                  value: job.score_breakdown?.seniority_score,
                                },
                                {
                                  label: "Company",
                                  value: job.score_breakdown?.trait_score,
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
                                        width: `${Math.round((metric.value || 0) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-gray-500 w-8 text-right">
                                    {Math.round((metric.value || 0) * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <JobCard
                    job={toJobPosting(job)}
                    daysAgo={job.days_ago}
                    isSaved={isJobSaved(job.id)}
                    onSave={() => toggleSaveJob(toJobPosting(job))}
                    onApply={() => handleApply(job)}
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
    </PageWrapper>
  );
}
