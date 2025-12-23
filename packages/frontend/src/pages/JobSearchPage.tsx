import { useState } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { FilterPanel } from "@/components/jobs/FilterPanel";
import { JobPosting, JobFilters } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

// Mock data
const mockJobs: JobPosting[] = [
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

export function JobSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortBy, setSortBy] = useState<"truescore" | "recency" | "salary">(
    "truescore"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search API call
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-light mb-6">Find Jobs</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title, keywords, or company..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Location"
              className="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="px-8">
              Search
            </Button>
          </div>
        </form>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortBy === "truescore" ? "default" : "outline"}
              onClick={() => setSortBy("truescore")}
            >
              TrueScore
            </Button>
            <Button
              size="sm"
              variant={sortBy === "recency" ? "default" : "outline"}
              onClick={() => setSortBy("recency")}
            >
              Most Recent
            </Button>
            <Button
              size="sm"
              variant={sortBy === "salary" ? "default" : "outline"}
              onClick={() => setSortBy("salary")}
            >
              Highest Salary
            </Button>
          </div>
          <span className="text-sm text-gray-600 ml-auto">
            {mockJobs.length} jobs found
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Job Results */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {mockJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={() => {}}
                onApply={() => {}}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button size="sm">1</Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
