import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import {
  getHistoryStats,
  getHistory,
  HistoryStats,
  HistoryItem,
} from "@/lib/api";
import {
  TrendingUp,
  Briefcase,
  Target,
  AlertTriangle,
  Search,
  Loader2,
  ChevronRight,
  Bookmark,
  Sparkles,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser } from "@clerk/clerk-react";

// ============================================================================
// Types
// ============================================================================

interface SkillGap {
  skill: string;
  frequency: number;
  resource?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated skill gaps (in a real app, this would come from API)
  const skillGaps: SkillGap[] = [
    {
      skill: "Python",
      frequency: 85,
      resource: "https://www.python.org/about/gettingstarted/",
    },
    {
      skill: "Machine Learning",
      frequency: 72,
      resource: "https://www.coursera.org/learn/machine-learning",
    },
    {
      skill: "AWS",
      frequency: 68,
      resource: "https://aws.amazon.com/training/",
    },
    {
      skill: "Docker",
      frequency: 55,
      resource: "https://docs.docker.com/get-started/",
    },
  ];

  useEffect(() => {
    async function fetchData() {
      // Don't fetch until we have the user ID
      if (!user?.id) return;

      try {
        setLoading(true);
        const [statsData, historyData] = await Promise.all([
          getHistoryStats(user.id),
          getHistory(5, user.id),
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setStats({
          total_analyses: 0,
          avg_score: 0,
          danger_count: 0,
          safe_count: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id]);

  const hasAnalyzedJobs = stats && stats.total_analyses > 0;
  const hasHistory = history.length > 0;

  // Handle clicking on a history item
  const handleHistoryClick = (item: HistoryItem) => {
    // Navigate to results with the stored data
    // Note: For full details, we'd need to re-fetch from API
    navigate("/results", {
      state: {
        jobText: item.job_text,
        apiResult: {
          true_score: item.true_score,
          risk_level: item.risk_level,
          // These will be empty but the results page handles it
          breakdown: {
            authenticity: 0,
            hiring_likelihood: 0,
            resume_match: 0,
            company_reputation: 0,
          },
          insights: [],
          recommendations: [],
        },
      },
    });
  };

  const getRiskBadge = (level: string) => {
    const config = {
      safe: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
      },
      danger: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
      },
      caution: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
      },
    }[level] || { bg: "bg-gray-100", text: "text-gray-700" };

    return `${config.bg} ${config.text}`;
  };

  return (
    <PageWrapper maxWidth="7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Your job hunting overview
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.total_analyses || 0
                )}
              </p>
              <p className="text-xs text-muted-foreground">Jobs Analyzed</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.safe_count || 0
                )}
              </p>
              <p className="text-xs text-muted-foreground">Safe Jobs</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.avg_score || "—"
                )}
              </p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.danger_count || 0
                )}
              </p>
              <p className="text-xs text-muted-foreground">Risky Jobs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Analyses
              </h2>
              {hasHistory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/history")}
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : hasHistory ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    {/* Score Badge */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRiskBadge(
                        item.risk_level
                      )}`}
                    >
                      {item.true_score}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.job_text.slice(0, 80)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()} •{" "}
                        {item.risk_level}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No analyses yet"
                description="Analyze your first job posting to see it here"
                actionLabel="Analyze a Job"
                onAction={() => navigate("/analyze")}
                variant="compact"
              />
            )}
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start gap-3"
                variant="outline"
                onClick={() => navigate("/analyze")}
              >
                <Search className="w-4 h-4" />
                Analyze New Job
              </Button>
              <Button
                className="w-full justify-start gap-3"
                variant="outline"
                disabled
              >
                <Bookmark className="w-4 h-4" />
                Saved Jobs (Coming Soon)
              </Button>
            </div>
          </Card>

          {/* Skill Gap Analysis */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Skill Gaps
              </h2>
            </div>

            {hasAnalyzedJobs ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Most requested skills from jobs you've analyzed:
                </p>
                {skillGaps.map((gap) => (
                  <div
                    key={gap.skill}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {gap.skill}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({gap.frequency}%)
                      </span>
                    </div>
                    {gap.resource && (
                      <a
                        href={gap.resource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Analyze jobs to see skill gap insights
              </p>
            )}
          </Card>

          {/* Get Started CTA for new users */}
          {!loading && !hasAnalyzedJobs && (
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-foreground mb-2">
                Get Started with TrueHire
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze your first job to unlock personalized insights
              </p>
              <Button onClick={() => navigate("/analyze")} size="sm">
                Analyze a Job
              </Button>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
