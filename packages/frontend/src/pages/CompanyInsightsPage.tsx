import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPosting } from "@/lib/types";
import {
  Building2,
  ExternalLink,
  Users,
  TrendingUp,
  MapPin,
  Globe,
  Star,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

// Mock data
const mockCompany = {
  id: "techcorp-1",
  name: "TechCorp",
  industry: "Technology",
  size: "1,000-5,000 employees",
  location: "San Francisco, CA",
  website: "https://techcorp.com",
  reputationScore: 87,
  glassdoorRating: 4.5,
  diversityScore: 82,
  openPositions: 25,
  reviewsSummary:
    "TechCorp is known for its innovative culture and strong engineering practices. Employees praise the work-life balance and competitive compensation. Some mention rapid growth can lead to organizational challenges.",
  pros: [
    "Excellent compensation and benefits",
    "Cutting-edge technology stack",
    "Strong work-life balance",
    "Great learning opportunities",
    "Supportive management team",
  ],
  cons: [
    "Rapid growth can cause some chaos",
    "Meeting-heavy culture",
    "Limited remote work options for some roles",
  ],
  redditMentions: 45,
  hiringActivity: {
    averageTimeToHire: 28,
    recentHires: 15,
  },
};

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

export function CompanyInsightsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {/* Company Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>

          <div className="grow">
            <h1 className="text-3xl font-bold text-gray-light mb-2">
              {mockCompany.name}
            </h1>

            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {mockCompany.industry}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {mockCompany.size}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {mockCompany.location}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                {mockCompany.glassdoorRating} Glassdoor
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Reputation Score: {mockCompany.reputationScore}
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {mockCompany.openPositions} Open Positions
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <a
                  href={mockCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                </a>
              </Button>
              <Button variant="outline" onClick={() => navigate("/jobs")}>
                View All Jobs
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Company Overview
            </h2>
            <p className="text-gray-600">{mockCompany.reviewsSummary}</p>
          </Card>

          {/* Reviews Sentiment */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Employee Reviews
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-light mb-3 flex items-center gap-2">
                  <span className="text-green-600">✓</span> Top Pros
                </h3>
                <ul className="space-y-2">
                  {mockCompany.pros.map((pro, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-1">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-light mb-3 flex items-center gap-2">
                  <span className="text-orange-600">!</span> Areas for
                  Improvement
                </h3>
                <ul className="space-y-2">
                  {mockCompany.cons.map((con, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-orange-600 mt-1">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Hiring Activity */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Hiring Activity
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Recent Hires (3 months)
                </p>
                <p className="text-3xl font-bold text-gray-light">
                  {mockCompany.hiringActivity.recentHires}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg. Time to Hire</p>
                <p className="text-3xl font-bold text-gray-light">
                  {mockCompany.hiringActivity.averageTimeToHire} days
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-light">
                  Actively Hiring
                </span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">
                Company is expanding across multiple departments
              </p>
            </div>
          </Card>

          {/* Reddit/Forum Mentions */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Community Discussions
            </h2>

            <p className="text-gray-600 mb-4">
              {mockCompany.redditMentions} mentions found across Reddit, Blind,
              and other forums
            </p>

            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-600">
                  "Great company culture. The interview process was smooth and
                  respectful. They value work-life balance."
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  — Reddit r/cscareerquestions
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-sm text-gray-600">
                  "Interviewed here last month. Very thorough technical
                  interview but fair. They give you plenty of time to solve
                  problems."
                </p>
                <p className="text-xs text-gray-400 mt-1">— Blind</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <p className="text-sm text-gray-600">
                  "Fast-paced environment. Not for everyone but if you like
                  challenges, it's great."
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  — Reddit r/ExperiencedDevs
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All Discussions
            </Button>
          </Card>

          {/* Current Openings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Current Openings at {mockCompany.name}
            </h2>
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
            <Button variant="outline" className="w-full mt-4">
              View All {mockCompany.openPositions} Positions
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Diversity & Inclusion */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Diversity & Inclusion
            </h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  D&I Score
                </span>
                <span className="text-sm font-bold text-gray-light">
                  {mockCompany.diversityScore}
                </span>
              </div>
              <Progress value={mockCompany.diversityScore} className="h-2" />
            </div>
            <p className="text-sm text-gray-600">
              Company demonstrates commitment to diversity through inclusive job
              descriptions and public diversity reports.
            </p>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Founded</span>
                <span className="text-sm font-semibold text-gray-light">
                  2010
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Funding</span>
                <span className="text-sm font-semibold text-gray-light">
                  Series C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-sm font-semibold text-gray-light">
                  $100M+
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-sm font-semibold text-green-600">
                  +40% YoY
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
