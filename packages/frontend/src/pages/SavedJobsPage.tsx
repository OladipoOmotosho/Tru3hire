import { useState } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPosting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Bookmark, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

// TODO: Replace with real data from local storage or API
const initialSavedJobs: JobPosting[] = [];

export function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<JobPosting[]>(initialSavedJobs);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleRemoveJob = (jobId: string) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
  };

  const handleToggleSelect = (jobId: string) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const handleBulkRemove = () => {
    setSavedJobs(savedJobs.filter((job) => !selectedJobs.includes(job.id)));
    setSelectedJobs([]);
  };

  const hasSavedJobs = savedJobs.length > 0;

  return (
    <PageWrapper>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Saved Jobs
            </h1>
            <p className="text-muted-foreground">
              {hasSavedJobs
                ? `${savedJobs.length} jobs saved for later`
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
                onApply={() => {}}
                isSaved={true}
                className="grow"
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="When you find jobs you're interested in, save them here to review later. Saved jobs will be stored locally on your device."
          actionLabel="Analyze a Job"
          onAction={() => navigate("/analyze")}
          variant="card"
        />
      )}
    </PageWrapper>
  );
}
