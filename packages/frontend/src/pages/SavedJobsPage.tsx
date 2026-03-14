import { useState, useEffect } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { logApplication, getUserApplications } from "@/lib/api";
import { useUser, useAuth } from "@clerk/clerk-react";

export function SavedJobsPage() {
  const { savedJobs, unsaveJob } = useSavedJobs();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const loadApplied = async () => {
      if (!user?.id) return;
      try {
        const token = await getToken();
        const response = await getUserApplications(50, token || undefined);
        if (response?.applications) {
          const ids = new Set<string>();
          for (const app of response.applications) {
            if (app.job_id) ids.add(app.job_id);
            ids.add(`${app.job_title}-${app.company_name}`);
          }
          setAppliedJobIds(ids);
        }
      } catch (e) {
        console.error("Failed to load applied jobs", e);
      }
    };
    loadApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRemoveJob = (jobId: string) => {
    unsaveJob(jobId);
    setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
  };

  const handleApply = async (job: {
    id: string;
    title: string;
    company: string;
    url?: string;
    trueScore?: number | null;
  }) => {
    if (job.url) window.open(job.url, "_blank");
    const token = await getToken();
    if (!token) return;
    try {
      await logApplication(token, {
        job_title: job.title,
        company_name: job.company,
        job_id: job.id,
        job_url: job.url,
        true_score_at_apply: job.trueScore ?? undefined,
      });
      setAppliedJobIds((prev) => new Set([...prev, job.id]));
    } catch (err) {
      console.error("Failed to track application", err);
    }
  };

  const handleToggleSelect = (jobId: string) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const handleBulkRemove = () => {
    selectedJobs.forEach((id) => unsaveJob(id));
    setSelectedJobs([]);
  };

  const hasSavedJobs = savedJobs.length > 0;

  return (
    <PageWrapper>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Saved Jobs
            </h1>
            <p className="text-muted-foreground">
              {hasSavedJobs
                ? `${savedJobs.length} job${
                    savedJobs.length > 1 ? "s" : ""
                  } saved for later`
                : "Save jobs to review them later"}
            </p>
          </div>
          {selectedJobs.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedJobs([])}>
                Deselect All
              </Button>
              <Button variant="destructive" onClick={handleBulkRemove}>
                Remove Selected ({selectedJobs.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {hasSavedJobs ? (
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <div key={job.id} className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedJobs.includes(job.id)}
                onChange={() => handleToggleSelect(job.id)}
                className="mt-6 rounded border-gray-300"
              />
              <JobCard
                job={job}
                onSave={() => handleRemoveJob(job.id)}
                onApply={() => handleApply(job)}
                isSaved={true}
                isApplied={appliedJobIds.has(job.id)}
                className="grow"
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="When you find jobs you're interested in, click the bookmark icon to save them here. Saved jobs are stored locally on your device."
          actionLabel="Search Jobs"
          onAction={() => navigate("/jobs")}
          variant="card"
        />
      )}
    </PageWrapper>
  );
}
