import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { Briefcase, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { getUserApplications } from "@/lib/api";
import type { Application as ApiApplication } from "@/lib/api";

// Kanban column IDs derived from API outcome
type TrackerColumn = "applied" | "interview" | "offer" | "closed";

const COLUMNS: TrackerColumn[] = ["applied", "interview", "offer", "closed"];

const COLUMN_LABELS: Record<TrackerColumn, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

const COLUMN_COLORS: Record<TrackerColumn, string> = {
  applied: "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
  interview:
    "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700",
  offer:
    "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
  closed: "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
};

const COLUMN_BAR_COLORS: Record<TrackerColumn, string> = {
  applied: "bg-blue-500",
  interview: "bg-purple-500",
  offer: "bg-green-500",
  closed: "bg-gray-500",
};

/** Map API outcome to kanban column */
function outcomeToColumn(outcome?: string): TrackerColumn {
  if (!outcome) return "applied";
  if (outcome === "interview") return "interview";
  if (outcome === "offer") return "offer";
  return "closed"; // no_response, rejected
}

export function ApplicationTrackerPage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [sortBy, setSortBy] = useState<"date" | "company">("date");

  const fetchApplications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getUserApplications(50, token || undefined);
      setApplications(data?.applications || []);
    } catch (e) {
      console.error("Failed to load applications:", e);
      setError("Failed to load your applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) fetchApplications();
  }, [user?.id, isLoaded, getToken]);

  const getApplicationsByColumn = (col: TrackerColumn) =>
    applications.filter((app) => outcomeToColumn(app.outcome) === col);

  const sortedApplications = useMemo(() => {
    const arr = [...applications];
    if (sortBy === "date") {
      arr.sort(
        (a, b) =>
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime(),
      );
    } else {
      arr.sort((a, b) =>
        a.company_name.localeCompare(b.company_name, undefined, {
          sensitivity: "base",
        }),
      );
    }
    return arr;
  }, [applications, sortBy]);

  if (!isLoaded || loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your applications...</p>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="max-w-md mx-auto text-center py-20">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Button onClick={fetchApplications}>Retry</Button>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto text-center py-20">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view your application tracker.
          </p>
          <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
        </div>
      </PageWrapper>
    );
  }

  const total = applications.length;

  return (
    <PageWrapper>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Application Tracker
            </h1>
            <p className="text-muted-foreground">
              Manage your job application pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {COLUMNS.map((col) => (
          <Card key={col} className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {COLUMN_LABELS[col]}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {getApplicationsByColumn(col).length}
            </p>
          </Card>
        ))}
      </div>

      {applications.length === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-4">
            Track your applications by clicking &quot;Track Application&quot; on job
            cards.
          </p>
          <Button onClick={() => navigate("/jobs")}>
            <Briefcase className="w-4 h-4 mr-2" />
            Find Jobs
          </Button>
        </Card>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const apps = getApplicationsByColumn(col);
            return (
              <div key={col} className="flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    {COLUMN_LABELS[col]}
                  </h3>
                  <div className="h-1 bg-muted rounded">
                    <div
                      className={`h-full rounded ${COLUMN_BAR_COLORS[col]}`}
                      style={{
                        width: total
                          ? `${(apps.length / total) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {apps.map((app) => (
                    <Card
                      key={app.id}
                      className={`p-4 hover:shadow-md transition-shadow border-l-4 ${COLUMN_COLORS[col]}`}
                    >
                      <h4 className="font-semibold text-foreground mb-1">
                        {app.job_title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {app.company_name}
                      </p>

                      {app.true_score_at_apply != null && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            TrueScore: {app.true_score_at_apply}
                          </Badge>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Applied {formatDate(app.applied_at)}
                      </p>

                      {app.job_url && (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View job
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Sort by:{" "}
              <button
                type="button"
                className={cn(
                  "font-medium underline-offset-2 hover:underline",
                  sortBy === "date" && "underline text-foreground",
                )}
                onClick={() => setSortBy("date")}
              >
                Date
              </button>
              {" · "}
              <button
                type="button"
                className={cn(
                  "font-medium underline-offset-2 hover:underline",
                  sortBy === "company" && "underline text-foreground",
                )}
                onClick={() => setSortBy("company")}
              >
                Company
              </button>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    TrueScore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {app.job_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {app.company_name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {COLUMN_LABELS[outcomeToColumn(app.outcome)]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {app.true_score_at_apply != null ? (
                        <Badge variant="secondary">
                          {app.true_score_at_apply}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(app.applied_at)}
                    </td>
                    <td className="px-6 py-4">
                      {app.job_url ? (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/jobs")}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Find Jobs to Apply
        </Button>
      </div>
    </PageWrapper>
  );
}
