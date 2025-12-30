import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrueScoreGauge } from "@/components/jobs/TrueScoreGauge";
import { InsightCard } from "@/components/jobs/InsightCard";
import { SkillTag } from "@/components/jobs/SkillTag";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  Share2,
  Bookmark,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatSalary } from "@/lib/utils";

// Mock data
const mockJob = {
  id: "1",
  title: "Senior Software Engineer",
  company: "TechCorp",
  companyId: "techcorp-1",
  location: "San Francisco, CA",
  description: `We're looking for a talented Senior Software Engineer to join our growing team. You'll be working on cutting-edge technologies and building scalable systems that impact millions of users.

Key Responsibilities:
• Design and develop high-quality software solutions
• Collaborate with cross-functional teams
• Mentor junior engineers
• Drive technical decisions and architecture

What We Offer:
• Competitive salary and equity
• Comprehensive health benefits
• Flexible work arrangements
• Professional development opportunities`,
  requirements: ["React", "TypeScript", "Node.js", "AWS", "Docker"],
  postedDate: new Date().toISOString(),
  trueScore: 87,
  trueScoreMetrics: {
    authenticity: 90,
    hiringLikelihood: 85,
    resumeMatch: 82,
    companyReputation: 90,
  },
  isVerified: true,
  isFreshPosting: true,
  isDiversityFriendly: true,
  hasInsights: true,
  jobType: "Full-time",
  experienceLevel: "Senior",
  salary: { min: 150000, max: 200000 },
  matchedSkills: ["React", "TypeScript", "Node.js"],
  missingSkills: ["AWS", "Docker"],
};

export function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-light mb-2">
                    {mockJob.title}
                  </h1>
                  <p
                    className="text-xl text-blue-600 mb-3 cursor-pointer hover:underline"
                    onClick={() => navigate(`/company/${mockJob.companyId}`)}
                  >
                    {mockJob.company}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mockJob.isVerified && (
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified Employer
                      </Badge>
                    )}
                    {mockJob.isFreshPosting && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        Fresh Posting
                      </Badge>
                    )}
                    {mockJob.isDiversityFriendly && (
                      <Badge
                        variant="outline"
                        className="text-purple-600 border-purple-600"
                      >
                        Diversity Friendly
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {mockJob.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {mockJob.jobType} · {mockJob.experienceLevel}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Posted {formatDate(mockJob.postedDate)}
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-gray-light mt-3">
                    {formatSalary(mockJob.salary.min, mockJob.salary.max)}
                  </p>
                </div>

                {/* TrueScore */}
                <TrueScoreGauge score={mockJob.trueScore} size="lg" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6">
                <Button size="lg" className="px-8">
                  Apply Now
                </Button>
                <Button variant="outline" size="lg">
                  <Bookmark className="w-5 h-5 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-light mb-4">
                Job Description
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                {mockJob.description}
              </div>
            </Card>

            {/* Your Match Analysis */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-light mb-4">
                Your Match Analysis
              </h2>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Resume Match
                  </span>
                  <span className="text-sm font-bold text-gray-light">
                    {mockJob.trueScoreMetrics.resumeMatch}%
                  </span>
                </div>
                <Progress
                  value={mockJob.trueScoreMetrics.resumeMatch}
                  className="h-2"
                />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-light mb-3">
                  Skills You Have
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockJob.matchedSkills.map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="matched" />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-light mb-3">
                  Skills to Develop
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockJob.missingSkills.map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="missing" />
                  ))}
                </div>
                <Button
                  variant="link"
                  className="mt-3 p-0 text-blue-600"
                  onClick={() => navigate("/skills")}
                >
                  View recommended courses →
                </Button>
              </div>
            </Card>

            {/* Interview Prep */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-light mb-4">
                Interview Preparation
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Common questions asked at {mockJob.company}:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    Tell me about a challenging technical problem you've solved
                  </li>
                  <li>How do you handle disagreements with team members?</li>
                  <li>
                    Describe your experience with microservices architecture
                  </li>
                </ul>
                <Button variant="outline" className="mt-4">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Prep Guide
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* TrueScore Breakdown */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-light mb-4">
                TrueScore Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(mockJob.trueScoreMetrics).map(
                  ([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-sm font-bold text-gray-light">
                          {value}
                        </span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* Company Insights */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-light mb-4">
                Company Insights
              </h3>
              <div className="space-y-3">
                <InsightCard
                  type="success"
                  title="High Rating"
                  description="4.5/5 stars on Glassdoor from 1,200+ reviews"
                />
                <InsightCard
                  type="info"
                  title="Active Hiring"
                  description="Company has filled 15 positions in the last 3 months"
                />
                <InsightCard
                  type="trend"
                  title="Growing Team"
                  description="Engineering team has grown 40% year-over-year"
                />
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/company/${mockJob.companyId}`)}
              >
                View Full Company Profile
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
