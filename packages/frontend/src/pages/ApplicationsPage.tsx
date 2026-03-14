import { useState, useEffect, useMemo } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
  getUserApplications,
  getPendingFeedback,
  reportOutcome,
  getApplicationStats,
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  MessageCircle,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: number;
  job_id?: string;
  job_title: string;
  company_name: string;
  job_url?: string;
  true_score_at_apply?: number;
  job_age_days?: number;
  applied_at: string;
  outcome?: string;
  days_to_response?: number;
}

interface Stats {
  total_applications: number;
  interviews: number;
  offers: number;
  no_response: number;
  rejected: number;
  response_rate?: number;
  interview_rate?: number;
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [submittingOutcome, setSubmittingOutcome] = useState<
    "no_response" | "rejected" | "interview" | "offer" | null
  >(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const authToken = token || undefined;
        const [appsData, pendingData, statsData] = await Promise.all([
          getUserApplications(50, authToken),
          getPendingFeedback(7, authToken),
          authToken
            ? getApplicationStats(authToken)
            : Promise.resolve(undefined),
        ]);
        setApplications(appsData?.applications || []);
        setPendingFeedback(pendingData?.pending || []);
        if (statsData) {
          setStats(statsData);
        }
      } catch (e) {
        console.error("Failed to load applications:", e);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      loadData();
    }
  }, [user?.id, isLoaded]);

  const handleReportOutcome = async (
    outcome: "no_response" | "rejected" | "interview" | "offer",
  ) => {
    if (!selectedApp || submittingOutcome) return;

    try {
      setSubmittingOutcome(outcome);
      const daysToResponse = Math.floor(
        (Date.now() - new Date(selectedApp.applied_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      await reportOutcome(
        selectedApp.id,
        outcome as "no_response" | "rejected" | "interview" | "offer",
        (await getToken()) || undefined,
        daysToResponse,
      );

      toast.success("Outcome recorded. Thanks for helping improve TrueHire!");

      // Refresh data
      if (user?.id) {
        const token = await getToken();
        const authToken = token || undefined;
        const [appsData, pendingData, statsData] = await Promise.all([
          getUserApplications(50, authToken),
          getPendingFeedback(7, authToken),
          authToken
            ? getApplicationStats(authToken)
            : Promise.resolve(undefined),
        ]);
        setApplications(appsData?.applications || []);
        setPendingFeedback(pendingData?.pending || []);
        if (statsData) {
          setStats(statsData);
        }
      }

      setShowOutcomeModal(false);
      setSelectedApp(null);
    } catch (e) {
      console.error("Failed to report outcome:", e);
      toast.error(
        `Failed to report outcome${e instanceof Error ? `: ${e.message}` : ""}`,
      );
    } finally {
      setSubmittingOutcome(null);
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case "interview":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "offer":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      case "rejected":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "no_response":
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
      default:
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysSince = (dateString: string) => {
    return Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
    );
  };


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

  if (!user) {
    return (
      <PageWrapper>
        <div className="max-w-2xl mx-auto text-center py-20">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to track your job applications and get personalized
            insights.
          </p>
          <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          My Applications
        </h1>
        <p className="text-muted-foreground">
          Track your job applications and report outcomes to improve TrueHire's
          predictions.
        </p>
      </div>

      {/* Pending Feedback Section */}
      {pendingFeedback.length > 0 && (
        <Card className="mb-8 p-6 border-l-4 border-l-warning-500 bg-warning-50/50 dark:bg-warning-900/10">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-full shrink-0">
              <MessageCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Pending feedback for {pendingFeedback.length} application
                {pendingFeedback.length > 1 ? "s" : ""}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                It's been over a week since you applied. Did you hear back?
              </p>

              <div className="space-y-3">
                {pendingFeedback.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between bg-background p-3 rounded-lg border"
                  >
                    <span className="font-medium text-sm">
                      {app.company_name} — {app.job_title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getDaysSince(app.applied_at)} days ago
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedApp(app);
                          setShowOutcomeModal(true);
                        }}
                      >
                        Did you hear back?
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingFeedback.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    + {pendingFeedback.length - 5} more below
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Briefcase className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total_applications}</p>
            <p className="text-sm text-muted-foreground">Total Applied</p>
          </Card>
          <Card className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.interviews}</p>
            <p className="text-sm text-muted-foreground">Interviews</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.offers}</p>
            <p className="text-sm text-muted-foreground">Offers</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {stats.response_rate
                ? `${Math.round(stats.response_rate * 100)}%`
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </Card>
        </div>
      )}

      {/* Applications List */}
      {applications.length === 0 && pendingFeedback.length === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No applications tracked yet</h3>
          <p className="text-muted-foreground mb-4">
            Apply to jobs and click &quot;Track Application&quot; on job cards to start
            tracking.
          </p>
          <Button onClick={() => navigate("/jobs")}>Find Jobs</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card
              key={app.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {app.job_title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {app.company_name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Applied {formatDate(app.applied_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getDaysSince(app.applied_at)} days ago
                        </span>
                        {app.true_score_at_apply && (
                          <span className="font-medium text-primary">
                            Score: {app.true_score_at_apply}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  {app.outcome ? (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeColor(
                        app.outcome,
                      )}`}
                    >
                      {app.outcome === "interview" && "🎉 Interview"}
                      {app.outcome === "offer" && "🏆 Offer"}
                      {app.outcome === "rejected" && "❌ Rejected"}
                      {app.outcome === "no_response" && "⏳ No Response"}
                    </span>
                  ) : getDaysSince(app.applied_at) >= 7 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowOutcomeModal(true);
                      }}
                    >
                      Did you hear back?
                    </Button>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                      ⏳ Pending
                    </span>
                  )}

                  {/* View Job Link */}
                  {app.job_url && (
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Outcome Modal */}
      {/* Outcome Modal (Accessible) */}
      {showOutcomeModal && selectedApp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setShowOutcomeModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowOutcomeModal(false);
          }}
        >
          <div
            className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            ref={(el) => {
              // Simple focus trap on mount
              if (el && !el.contains(document.activeElement)) {
                el.focus();
              }
            }}
          >
            <button
              onClick={() => setShowOutcomeModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <XCircle className="w-4 h-4" />
            </button>
            <h3 id="modal-title" className="text-lg font-semibold mb-2">
              Report Outcome
            </h3>
            <p className="text-muted-foreground mb-4">
              How did your application to{" "}
              <strong>{selectedApp.company_name}</strong> go?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleReportOutcome("no_response")}
                disabled={submittingOutcome !== null}
              >
                {submittingOutcome === "no_response" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                No Response
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleReportOutcome("rejected")}
                disabled={submittingOutcome !== null}
              >
                {submittingOutcome === "rejected" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                Rejected
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleReportOutcome("interview")}
                disabled={submittingOutcome !== null}
              >
                {submittingOutcome === "interview" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Interview!
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleReportOutcome("offer")}
                disabled={submittingOutcome !== null}
              >
                {submittingOutcome === "offer" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trophy className="w-4 h-4 text-purple-500" />
                )}
                Got Offer!
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
