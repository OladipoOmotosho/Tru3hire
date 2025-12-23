import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Briefcase,
  Award,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

export function AnalyticsPage() {
  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-light mb-2">
          Analytics & Insights
        </h1>
        <p className="text-gray-600">
          Data-driven feedback on your job hunting journey
        </p>
      </div>

      {/* Your Success Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-light mb-4">
          Your Success Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                +15%
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Application Response Rate
            </p>
            <p className="text-3xl font-bold text-gray-light">32%</p>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 18%</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                +8%
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Interview Conversion</p>
            <p className="text-3xl font-bold text-gray-light">18%</p>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 12%</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-600"
              >
                Avg
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Time to Response</p>
            <p className="text-3xl font-bold text-gray-light">8 days</p>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 10 days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Strong
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg TrueScore Applied</p>
            <p className="text-3xl font-bold text-gray-light">78</p>
            <p className="text-xs text-gray-500 mt-1">Recommended: 70+</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* TrueScore vs Outcomes */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-light mb-4">
            TrueScore vs Actual Outcomes
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Correlation between TrueScore and your success rate
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  TrueScore 80-100
                </span>
                <span className="text-sm font-bold text-green-600">
                  45% success
                </span>
              </div>
              <Progress value={45} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">12 applications</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  TrueScore 60-79
                </span>
                <span className="text-sm font-bold text-blue-600">
                  28% success
                </span>
              </div>
              <Progress value={28} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">18 applications</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  TrueScore 40-59
                </span>
                <span className="text-sm font-bold text-orange-600">
                  12% success
                </span>
              </div>
              <Progress value={12} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">8 applications</p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  TrueScore {"<"} 40
                </span>
                <span className="text-sm font-bold text-red-600">
                  5% success
                </span>
              </div>
              <Progress value={5} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">3 applications</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Insight:</strong> Jobs with TrueScore {">"} 80 have 3.8x
              higher success rate. Focus on high-scoring opportunities!
            </p>
          </div>
        </Card>

        {/* Best Performing Sources */}
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-light mb-4">
            Best Performing Job Sources
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Which platforms yield the best results for you
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-light">TrueHire Direct</p>
                <p className="text-sm text-gray-600">Verified employers</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">42%</p>
                <p className="text-xs text-gray-500">15 apps</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-light">LinkedIn</p>
                <p className="text-sm text-gray-600">Professional network</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">28%</p>
                <p className="text-xs text-gray-500">22 apps</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-light">Indeed</p>
                <p className="text-sm text-gray-600">Job boards</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">15%</p>
                <p className="text-xs text-gray-500">8 apps</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-light">
                  Company Career Pages
                </p>
                <p className="text-sm text-gray-600">Direct applications</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-600">10%</p>
                <p className="text-xs text-gray-500">5 apps</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Market Insights */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-light mb-4">
          Market Insights
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hot Skills */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Hot Skills in Your Field
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Most in-demand skills for Software Engineering roles
            </p>

            <div className="space-y-3">
              {[
                { skill: "React", demand: 92 },
                { skill: "TypeScript", demand: 85 },
                { skill: "AWS", demand: 78 },
                { skill: "Docker", demand: 72 },
                { skill: "Kubernetes", demand: 68 },
              ].map((item) => (
                <div key={item.skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.skill}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.demand}% of jobs
                    </span>
                  </div>
                  <Progress value={item.demand} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Salary Trends */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-light mb-4">
              Salary Trends
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Average salaries for Senior Software Engineer roles
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    San Francisco Bay Area
                  </span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-light">
                  $165k - $220k
                </p>
                <p className="text-xs text-green-600 mt-1">+12% YoY</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">New York City</span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-light">
                  $155k - $210k
                </p>
                <p className="text-xs text-green-600 mt-1">+10% YoY</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Remote (US)</span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-light">
                  $140k - $190k
                </p>
                <p className="text-xs text-green-600 mt-1">+15% YoY</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Personalized Tips */}
      <Card className="p-6 bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-light mb-2">
              Personalized Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>Best Application Time:</strong> Your applications on
                  Tuesday mornings get 2.3x more responses than other times.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>Optimal Application Volume:</strong> You're most
                  successful when applying to 3-5 jobs per week with TrueScore
                  &gt; 75.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>Skill Gap Priority:</strong> Learning AWS could
                  increase your average TrueScore from 68 to 82 based on your
                  saved jobs.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
