import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPosting } from "@/lib/types";
import { TrendingUp, Briefcase, Target, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

// Mock data - replace with actual API calls
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
];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-light mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your job hunting overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Jobs Analyzed</p>
              <p className="text-2xl font-bold text-gray-light">127</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Applications</p>
              <p className="text-2xl font-bold text-gray-light">23</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg TrueScore</p>
              <p className="text-2xl font-bold text-gray-light">78</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Skills to Learn</p>
              <p className="text-2xl font-bold text-gray-light">5</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-gray-600 " />
          </div>
          <div className="grow">
            <h3 className="font-semibold text-gray-600 mb-1">Action Needed</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload your resume to get personalized job recommendations and
              skill gap analysis.
            </p>
            <Button onClick={() => navigate("/profile")} size="sm">
              Upload Resume
            </Button>
          </div>
        </div>
      </Card>

      {/* Recommended Jobs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-light mb-1">
              Recommended Jobs
            </h2>
            <p className="text-sm text-gray-600">
              Top matches based on your profile
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/jobs")}>
            View All Jobs
          </Button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6">
          <Button size="sm" variant="default">
            High Probability
          </Button>
          <Button size="sm" variant="outline">
            Fresh Postings
          </Button>
          <Button size="sm" variant="outline">
            Diversity Friendly
          </Button>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={() => console.log("Save job", job.id)}
              onApply={() => console.log("Apply to job", job.id)}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-light mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <span className="text-gray-600">
              You saved "Senior Software Engineer" at TechCorp
            </span>
            <span className="text-gray-400 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span className="text-gray-600">
              You applied to "Frontend Developer" at StartupXYZ
            </span>
            <span className="text-gray-400 ml-auto">1 day ago</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
            <span className="text-gray-600">
              New skill recommendation: "Docker" added
            </span>
            <span className="text-gray-400 ml-auto">2 days ago</span>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
