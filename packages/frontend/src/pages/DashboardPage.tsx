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
  Lightbulb,
  Search,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsData, historyData] = await Promise.all([
          getHistoryStats(),
          getHistory(5),
        ]);
        setStats(statsData);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not load dashboard data");
        // Set default stats if API fails
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
  }, []);

  const hasAnalyzedJobs = stats && stats.total_analyses > 0;
  const hasHistory = history.length > 0;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome! Here's your job hunting overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Jobs Analyzed
              </p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.total_analyses || 0
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Safe Jobs</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.safe_count || 0
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Avg TrueScore
              </p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : stats?.avg_score ? (
                  stats.avg_score
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Risky Jobs</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stats?.danger_count || 0
                )}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Lightbulb className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items - Show when user hasn't analyzed any jobs */}
      {!loading && !hasAnalyzedJobs && (
        <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="grow">
              <h3 className="font-semibold text-foreground mb-1">
                Get Started with SafeHire
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze your first job posting to see how our AI evaluates
                authenticity, hiring likelihood, and more.
              </p>
              <Button onClick={() => navigate("/analyze")} size="sm">
                Analyze a Job Posting
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Recent Analyses
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasHistory ? (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/50"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.risk_level === "safe"
                      ? "bg-green-600"
                      : item.risk_level === "danger"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                />
                <span className="text-foreground font-medium">
                  Score: {item.true_score}
                </span>
                <span className="text-muted-foreground truncate flex-1">
                  {item.job_text.slice(0, 60)}...
                </span>
                <span className="text-muted-foreground/60 text-xs">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No activity yet"
            description="Your job analysis history will appear here once you start analyzing jobs."
            actionLabel="Start Analyzing"
            onAction={() => navigate("/analyze")}
            variant="compact"
          />
        )}
      </Card>
    </PageWrapper>
  );
}
