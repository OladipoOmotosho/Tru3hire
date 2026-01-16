import { useState, useEffect } from "react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { JobPosting } from "@/lib/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser } from "@clerk/clerk-react";
import { logApplication } from "@/lib/api";
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface JobBreakdown {
  authenticity: number;
  hiring_activity: number;
  hiring_likelihood: number; // Legacy alias
  resume_match: number;
  company_reputation: number;
}

interface RankedJob {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary_display: string;
  category: string;
  days_ago: number;
  redirect_url: string;
  true_score: number;
  risk_level: string;
  breakdown?: JobBreakdown;
  interview_probability?: number; // Phase 3: 0-100 interview likelihood
  interview_recommendation?: string; // "apply_now", "tailor_resume", etc.
}

interface JobsResponse {
  jobs: RankedJob[];
  total: number;
  page: number;
  query: string;
  location: string;
  province?: string;
  city?: string;
  error?: string;
}

interface Province {
  code: string;
  name: string;
}

interface LocationsResponse {
  provinces?: Province[];
  province?: string;
  cities?: string[];
}

// ============================================================================
// API
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const JOBS_PER_PAGE = 40;

async function searchRankedJobs(
  query: string,
  province: string,
  city: string,
  page: number = 1,
  sortBy: string = "relevance",
  jobType: string = "all",
  resumeText: string = ""
): Promise<JobsResponse> {
  const params = new URLSearchParams({
    q: query,
    province: province,
    city: city,
    page: page.toString(),
    limit: JOBS_PER_PAGE.toString(),
    sort_by: sortBy,
    job_type: jobType,
    resume_text: resumeText,
  });

  const response = await fetch(`${API_URL}/api/jobs/ranked?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }
  return response.json();
}

async function fetchLocations(province?: string): Promise<LocationsResponse> {
  const url = province
    ? `${API_URL}/api/jobs/locations?province=${encodeURIComponent(province)}`
    : `${API_URL}/api/jobs/locations`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch locations");
  }
  return response.json();
}

// ============================================================================
// Job Card Component (HiringCafe Style)
// ============================================================================

function JobCard({
  job,
  onAnalyze,
  onApply,
  isSaved,
  onToggleSave,
}: {
  job: RankedJob;
  onAnalyze: () => void;
  onApply: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract skills from description (simple extraction)
  const extractSkills = (text: string): string[] => {
    const skillPatterns = [
      "Python",
      "JavaScript",
      "React",
      "Node.js",
      "AWS",
      "Azure",
      "Docker",
      "Kubernetes",
      "Java",
      "C#",
      ".NET",
      "SQL",
      "PostgreSQL",
      "MongoDB",
      "TypeScript",
      "Vue",
      "Angular",
      "Git",
      "CI/CD",
      "REST",
      "GraphQL",
      "Machine Learning",
      "AI",
      "Data Science",
      "Agile",
      "Scrum",
    ];
    return skillPatterns
      .filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))
      .slice(0, 5);
  };

  const skills = extractSkills(job.description);
  const timeAgo =
    job.days_ago === 0
      ? "Today"
      : job.days_ago < 7
      ? `${job.days_ago}d`
      : `${Math.floor(job.days_ago / 7)}w`;

  // Get job type badges
  const getBadges = () => {
    const badges = [];
    if (job.location?.toLowerCase().includes("remote")) badges.push("Remote");
    if (
      job.description?.toLowerCase().includes("full-time") ||
      job.description?.toLowerCase().includes("full time")
    )
      badges.push("Full Time");
    if (job.description?.toLowerCase().includes("hybrid"))
      badges.push("Hybrid");
    if (job.description?.toLowerCase().includes("contract"))
      badges.push("Contract");
    if (badges.length === 0) badges.push("Full Time"); // Default
    return badges.slice(0, 2);
  };

  const badges = getBadges();

  // TrueScore color
  const getScoreColor = () => {
    if (job.true_score >= 75) return "text-green-600 bg-green-50";
    if (job.true_score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div
      className="relative bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border overflow-hidden transition-all duration-300 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Header: Title + Time */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-2 flex-1 pr-2">
            {job.title}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{job.location || "Remote"}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Apply Early Badge for fresh jobs */}
          {job.days_ago <= 2 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 animate-pulse">
              ⚡ Apply Early
            </span>
          )}
          {badges.map((badge) => (
            <span
              key={badge}
              className="px-2 py-0.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              {badge}
            </span>
          ))}
          {/* TrueScore Badge */}
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded ${getScoreColor()}`}
          >
            Score: {job.true_score}
          </span>
          {/* Interview Probability Badge with Recommendation */}
          {job.interview_probability !== undefined && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded ${
                job.interview_recommendation === "likely_ghost" ||
                job.interview_recommendation === "caution_scam"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : job.interview_probability >= 60
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : job.interview_probability >= 40
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : job.interview_probability >= 25
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
              title={`Recommendation: ${
                job.interview_recommendation || "consider"
              }`}
            >
              {job.interview_recommendation === "likely_ghost"
                ? "👻 Ghost Job"
                : job.interview_recommendation === "caution_scam"
                ? "⚠️ Scam Risk"
                : job.interview_recommendation === "apply_now"
                ? "🔥 Apply Now!"
                : job.interview_recommendation === "apply_fast_competition"
                ? "⚡ Apply Fast"
                : job.interview_recommendation === "apply_soon"
                ? "✅ Good Match"
                : job.interview_recommendation === "tailor_resume"
                ? "📝 Tailor Resume"
                : job.interview_recommendation === "high_competition"
                ? "🏁 High Competition"
                : job.interview_recommendation === "low_match"
                ? "📉 Low Match"
                : job.interview_recommendation === "long_shot"
                ? "🎲 Long Shot"
                : job.interview_recommendation === "skip"
                ? "❌ Skip"
                : `🎯 ${job.interview_probability}%`}
            </span>
          )}
        </div>

        {/* Company */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {job.company}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {job.description.slice(0, 80)}...
            </p>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Skills</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Salary (if available) */}
        {job.salary_display !== "Not specified" && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium mb-3">
            <DollarSign className="w-4 h-4" />
            {job.salary_display}
          </div>
        )}

        {/* Footer Links */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <a
            href={job.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Job Posting <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onAnalyze}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View analysis →
          </button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
              isSaved
                ? "bg-green-500 text-white"
                : "bg-rose-500 text-white hover:bg-rose-600"
            }`}
          >
            {isSaved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            ✓ I Applied
          </button>
        </div>

        {/* Apply Button */}
        <a
          href={job.redirect_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-lg font-medium text-sm bg-white text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          Apply Directly <ExternalLink className="w-4 h-4" />
        </a>

        {/* View Analysis Button */}
        <button
          onClick={onAnalyze}
          className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
        >
          View Full TrueScore Analysis
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export function JobsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();

  // Get resume text from Clerk metadata for personalized matching
  const resumeText =
    (user?.unsafeMetadata?.parsedResume as { raw_text?: string })?.raw_text ||
    "";

  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Location state - province and city with cascading dropdowns
  const [province, setProvince] = useState(searchParams.get("province") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");
  const [jobType, setJobType] = useState("all");

  const totalPages = Math.ceil(total / JOBS_PER_PAGE);

  // Saved jobs hook
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  // Convert RankedJob to JobPosting for saving
  const convertToJobPosting = (job: RankedJob): JobPosting => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    requirements: [],
    postedDate: new Date(
      Date.now() - job.days_ago * 24 * 60 * 60 * 1000
    ).toISOString(),
    trueScore: job.true_score,
    trueScoreMetrics: {
      authenticity: job.breakdown?.authenticity || 0,
      hiringLikelihood: job.breakdown?.hiring_likelihood || 0,
      resumeMatch: job.breakdown?.resume_match || 0,
      companyReputation: job.breakdown?.company_reputation || 0,
    },
    tags: [job.category],
    isVerified: false,
    isFreshPosting: job.days_ago <= 7,
    isDiversityFriendly: false,
    hasInsights: false,
    jobType: "Full-time",
    url: job.redirect_url,
  });

  // Fetch provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await fetchLocations();
        if (data.provinces) {
          setProvinces(data.provinces);
        }
      } catch (err) {
        // Silently handle errors
      }
    };
    loadProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (province) {
      const loadCities = async () => {
        setLoadingLocations(true);
        try {
          const data = await fetchLocations(province);
          if (data.cities) {
            setCities(data.cities);
          }
        } catch (err) {
          setCities([]);
        } finally {
          setLoadingLocations(false);
        }
      };
      loadCities();
    } else {
      setCities([]);
      setCity("");
    }
  }, [province]);

  // Auto-search if URL has query params
  useEffect(() => {
    if (searchParams.get("q")) {
      handleSearch();
    }
  }, []);

  const fetchJobs = async (page: number, sort: string, type: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    // Update URL params
    const params: Record<string, string> = { q: query, page: page.toString() };
    if (province) params.province = province;
    if (city) params.city = city;
    setSearchParams(params);

    try {
      const result = await searchRankedJobs(
        query,
        province,
        city,
        page,
        sort,
        type,
        resumeText // Pass resume for personalized matching
      );
      if (result.error) {
        setError(result.error);
        setJobs([]);
      } else {
        setJobs(result.jobs);
        setTotal(result.total);
        setCurrentPage(page);
      }
    } catch (err) {
      setError("Failed to search jobs. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    await fetchJobs(1, sortBy, jobType);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchJobs(newPage, sortBy, jobType);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    fetchJobs(1, newSort, jobType);
  };

  const handleJobTypeChange = (newType: string) => {
    setJobType(newType);
    setCurrentPage(1);
    fetchJobs(1, sortBy, newType);
  };

  const handleAnalyze = (job: RankedJob) => {
    navigate("/results", {
      state: {
        jobText: `${job.title} at ${job.company}\n${job.location}\n${job.description}`,
        apiResult: {
          true_score: job.true_score,
          risk_level: job.risk_level,
          breakdown: job.breakdown || {
            authenticity: 0,
            hiring_activity: 0,
            hiring_likelihood: 0,
            resume_match: 0,
            company_reputation: 0,
          },
          insights: [],
          recommendations: [],
        },
        externalUrl: job.redirect_url,
      },
    });
  };

  return (
    <PageWrapper maxWidth="7xl">
      {/* Search Header */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Junior Software Developer"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-background text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Province Dropdown */}
          <div className="w-full md:w-48">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setCity(""); // Reset city when province changes
                }}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">All of Canada</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City Dropdown (only shows if province selected) */}
          {province && (
            <div className="w-full md:w-48">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loadingLocations}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-3"
            size="lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Results Header */}
      {hasSearched && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {total.toLocaleString()} jobs
            </span>
            {" · "}
            <span>
              Page {currentPage} of {totalPages || 1}
            </span>
            {" · "}
            <span>
              {city ? `${city}, ${province}` : province || "All of Canada"}
            </span>
          </p>
          <div className="flex items-center gap-4">
            {/* Job Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Job Type:</span>
              <select
                value={jobType}
                onChange={(e) => handleJobTypeChange(e.target.value)}
                className="text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-card shadow-sm cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">All Jobs</option>
                <option value="fulltime">Full-time</option>
                <option value="parttime">Part-time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-card shadow-sm cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="relevance">Relevance</option>
                <option value="truescore">TrueScore</option>
                <option value="date">Date Posted</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200">
          <p className="text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Searching and ranking jobs...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzing each job with TrueScore AI
          </p>
        </div>
      )}

      {/* Job Grid */}
      {!loading && hasSearched && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAnalyze={() => handleAnalyze(job)}
              onApply={async () => {
                // Track the application in our system
                if (user?.id) {
                  try {
                    await logApplication(user.id, {
                      job_title: job.title,
                      company_name: job.company,
                      job_id: job.id,
                      job_url: job.redirect_url,
                      true_score_at_apply: job.true_score,
                      job_age_days: job.days_ago,
                    });
                    alert(
                      "✅ Application tracked! You'll be prompted for feedback in a week."
                    );
                  } catch (e) {
                    console.error("Failed to track application:", e);
                  }
                }
              }}
              isSaved={isJobSaved(job.id)}
              onToggleSave={() => toggleSaveJob(convertToJobPosting(job))}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && hasSearched && jobs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-card border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && hasSearched && jobs.length === 0 && (
        <Card className="p-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No jobs found
          </h3>
          <p className="text-muted-foreground">
            Try different keywords or location
          </p>
        </Card>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <Card className="p-16 text-center">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Search for Jobs in Canada
          </h3>
          <p className="text-muted-foreground mb-4">
            Enter job title and location to find AI-ranked opportunities
          </p>
          <p className="text-sm text-muted-foreground">
            Each job is analyzed for authenticity, hiring activity, and more
          </p>
        </Card>
      )}

      {/* Adzuna Attribution */}
      <div className="mt-10 pt-6 border-t border-border text-center">
        <a
          href="https://www.adzuna.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Jobs by</span>
          <img
            src="https://www.adzuna.co.uk/press/adzuna-logo.png"
            alt="Adzuna"
            className="h-5"
            style={{ minWidth: "80px", minHeight: "20px" }}
          />
        </a>
      </div>
    </PageWrapper>
  );
}
