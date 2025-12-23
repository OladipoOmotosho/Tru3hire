import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillTag } from "@/components/jobs/SkillTag";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, BookOpen, Clock, DollarSign } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

// Mock data
const userSkills = ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Git"];

const missingSkills = [
  { skill: "Docker", frequency: 15, priority: "high" as const },
  { skill: "Kubernetes", frequency: 12, priority: "high" as const },
  { skill: "AWS", frequency: 18, priority: "high" as const },
  { skill: "GraphQL", frequency: 8, priority: "medium" as const },
  { skill: "Python", frequency: 10, priority: "medium" as const },
  { skill: "MongoDB", frequency: 6, priority: "medium" as const },
  { skill: "Redis", frequency: 4, priority: "low" as const },
];

const recommendedCourses = [
  {
    title: "Docker and Kubernetes: The Complete Guide",
    platform: "Udemy",
    duration: "22 hours",
    cost: "$89.99",
    url: "https://udemy.com/docker-kubernetes",
    relevance: "Covers Docker and Kubernetes - your top 2 missing skills",
    skillsCovered: ["Docker", "Kubernetes", "Container Orchestration"],
    rating: 4.7,
  },
  {
    title: "AWS Certified Solutions Architect",
    platform: "Coursera",
    duration: "3 months",
    cost: "$49/month",
    url: "https://coursera.org/aws",
    relevance: "Most requested skill in your saved jobs (18 mentions)",
    skillsCovered: ["AWS", "Cloud Computing", "Architecture"],
    rating: 4.8,
  },
  {
    title: "GraphQL with React: The Complete Guide",
    platform: "Udemy",
    duration: "16 hours",
    cost: "$79.99",
    url: "https://udemy.com/graphql-react",
    relevance: "Complements your existing React expertise",
    skillsCovered: ["GraphQL", "Apollo Client", "React"],
    rating: 4.6,
  },
];

export function SkillGapAnalysisPage() {
  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-300",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
    low: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-light mb-2">
          Skill Gap Analysis
        </h1>
        <p className="text-gray-600">
          Identify skills to learn and get personalized course recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Skills */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Your Current Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {userSkills.map((skill) => (
                <SkillTag key={skill} skill={skill} variant="matched" />
              ))}
            </div>
          </Card>

          {/* Missing Skills Analysis */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Skills in Demand
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Based on your saved and viewed jobs, here are the most frequently
              requested skills you don't have yet.
            </p>

            <div className="space-y-4">
              {missingSkills.map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-grow">
                    <div className="min-w-[120px]">
                      <span className="font-semibold text-gray-light">
                        {item.skill}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          Mentioned in {item.frequency} jobs
                        </span>
                        <span className="text-xs text-gray-600">
                          {Math.round((item.frequency / 20) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(item.frequency / 20) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={priorityColors[item.priority]}
                  >
                    {item.priority} priority
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended Courses */}
          <div>
            <h2 className="text-2xl font-bold text-gray-light mb-4">
              Recommended Courses
            </h2>
            <div className="space-y-4">
              {recommendedCourses.map((course, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-gray-light mb-1">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{course.platform}</Badge>
                        <span className="text-sm text-yellow-600">
                          ★ {course.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-900 font-medium">
                      📊 Why this helps: {course.relevance}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.skillsCovered.map((skill) => (
                      <SkillTag key={skill} skill={skill} />
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {course.cost}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.platform}
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Enroll Now
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Learning Path */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Suggested Learning Path
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-light">
                      Docker & Kubernetes
                    </h4>
                    <p className="text-sm text-gray-600">
                      High priority • 2-3 months
                    </p>
                  </div>
                </div>
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300" />
              </div>

              <div className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-light">
                      AWS Fundamentals
                    </h4>
                    <p className="text-sm text-gray-600">
                      High priority • 3-4 months
                    </p>
                  </div>
                </div>
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-300" />
              </div>

              <div className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-light">GraphQL</h4>
                    <p className="text-sm text-gray-600">
                      Medium priority • 1-2 months
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Progress Tracker */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Your Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Skills Acquired
                  </span>
                  <span className="text-sm font-bold text-gray-light">
                    6 / 13
                  </span>
                </div>
                <Progress value={46} className="h-2" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Complete 7 more skills to reach 100% job match for your target
                  roles.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Impact Estimate
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Current Avg TrueScore
                </span>
                <span className="text-lg font-bold text-gray-light">68</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  After Top 3 Skills
                </span>
                <span className="text-lg font-bold text-green-600">85+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Potential Salary Increase
                </span>
                <span className="text-lg font-bold text-blue-600">+25%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
