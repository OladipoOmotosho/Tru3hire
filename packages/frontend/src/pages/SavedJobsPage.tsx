import { useState } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPosting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

// Mock data
const mockSavedJobs: JobPosting[] = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    description: "We're looking for a senior engineer...",
    requirements: ["React", "TypeScript", "Node.js"],
    postedDate: new Date().toISOString(),
    trueScore: 87,
    trueScoreMetrics: {
      authenticity: 90,
      hiringLikelihood: 85,
      biasAndFairness: 88,
      resumeMatch: 82,
      companyReputation: 90,
    },
    tags: ["remote", "full-time"],
    isVerified: true,
    isFreshPosting: true,
    isDiversityFriendly: true,
    hasInsights: true,
    jobType: "Full-time",
    experienceLevel: "Senior",
    salary: { min: 150000, max: 200000 },
  },
  {
    id: "2",
    title: "Frontend Developer",
    company: "StartupXYZ",
    location: "Remote",
    description: "Join our fast-growing team...",
    requirements: ["React", "JavaScript", "CSS"],
    postedDate: new Date(Date.now() - 86400000).toISOString(),
    trueScore: 72,
    trueScoreMetrics: {
      authenticity: 75,
      hiringLikelihood: 70,
      biasAndFairness: 80,
      resumeMatch: 68,
      companyReputation: 67,
    },
    tags: ["remote", "contract"],
    isVerified: false,
    isFreshPosting: true,
    isDiversityFriendly: true,
    hasInsights: false,
    jobType: "Contract",
    experienceLevel: "Mid-level",
    salary: { min: 90000, max: 120000 },
  },
];

export function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<JobPosting[]>(mockSavedJobs);
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

  return (
    <PageWrapper>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-light mb-2">
              Saved Jobs
            </h1>
            <p className="text-gray-600">
              {savedJobs.length} jobs saved for later
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

      {/* Folder Organization (Future Feature) */}
      <div className="flex gap-2 mb-6">
        <Button size="sm" variant="default">
          All Jobs
        </Button>
        <Button size="sm" variant="outline">
          <Folder className="w-4 h-4 mr-1" />
          High Priority
        </Button>
        <Button size="sm" variant="outline">
          <Folder className="w-4 h-4 mr-1" />
          Applied
        </Button>
        <Button size="sm" variant="outline">
          + New Folder
        </Button>
      </div>

      {savedJobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">No saved jobs yet</p>
          <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
        </div>
      ) : (
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
      )}
    </PageWrapper>
  );
}
