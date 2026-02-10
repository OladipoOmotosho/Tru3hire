/**
 * CompanyJobsPage - Lists all open roles at a specific company
 * Uses the same card grid design as JobsPage
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { logApplication, getUserApplications } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import {
  searchJobs,
  fetchJobScores,
  mergeJobScores,
  RankedJob,
} from "@/lib/jobs-api";
import { JobPosting } from "@/lib/types";
import { slugToCompany } from "@/lib/utils";

import { JobCard } from "@/components/jobs/JobCard";

export function CompanyJobsPage() {
  const navigate = useNavigate();
  const { companySlug } = useParams<{ companySlug: string }>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isJobSaved, toggleSaveJob } = useSavedJobs();

  const companyName = companySlug ? slugToCompany(companySlug) : "";

  useEffect(() => {
    if (!companySlug) navigate("/jobs");
  }, [companySlug, navigate]);

  const resumeText =
    (user?.unsafeMetadata?.parsedResume as { raw_text?: string })?.raw_text ||
    "";

  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!companyName) return;
    const controller = new AbortController();
    let mounted = true;

    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchJobs(companyName, {
          limit: 50,
          page: 1,
        });
        if (!mounted) return;
        if (result.error) {
          setError(result.error);
          setJobs([]);
          return;
        }
        const rawJobs = (result.jobs || []).map((j) => ({
          ...j,
          loading: true,
          true_score: undefined,
          risk_level: undefined,
        }));
        setJobs(rawJobs);

        if (rawJobs.length > 0) {
          setScoresLoading(true);
          try {
            const scoresData = await fetchJobScores(
              rawJobs,
              resumeText,
              controller.signal,
            );
            if (!mounted) return;
            setJobs((prev) => mergeJobScores(prev, scoresData.scores));
          } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;
            if (!mounted) return;
            setJobs((prev) => prev.map((j) => ({ ...j, loading: false })));
          } finally {
            if (mounted) setScoresLoading(false);
          }
        }
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load jobs for this company.");
        setJobs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadJobs();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [companyName, resumeText]);

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
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("CompanyJobsPage: failed to load applications", err);
        }
      }
    };
    loadApplied();
  }, [user?.id]);

  const handleApply = async (job: RankedJob) => {
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

  const handleReport = (job: RankedJob) => {
    navigate(
      `/report-scam?url=${encodeURIComponent(job.redirect_url)}&company=${encodeURIComponent(job.company)}`,
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
      Date.now() - job.days_ago * 24 * 60 * 60 * 1000,
    ).toISOString(),
    trueScore: job.true_score ?? null,
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
    salary: undefined,
    salaryDisplay: job.salary_display || undefined,
    companyLogo: undefined,
  });

  if (!companySlug) return null;

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false}>
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/jobs")}
            className="gap-1.5 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to jobs
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Open roles at {companyName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Loading..."
              : `${jobs.length} ${jobs.length === 1 ? "role" : "roles"} found`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && jobs.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/jobs")}
            >
              Back to jobs
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-muted-foreground">
              No open roles found for this company.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/jobs")}
            >
              Back to jobs
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={toJobPosting(job)}
                daysAgo={job.days_ago}
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
      </div>
    </PageWrapper>
  );
}
