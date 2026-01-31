import { useEffect, useState, useMemo } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getHistory, HistoryItem } from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
  Briefcase,
  Search,
  X,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HistoryPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get search term from URL
  const searchQuery = searchParams.get("search") || "";

  // Local state for input to allow typing before searching (debouncing optional, but immediate is fine for small lists)
  // Actually, let's keep it synced with URL for simplicity
  const handleSearchChange = (term: string) => {
    if (term) {
      setSearchParams({ search: term });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => setSearchParams({});

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const token = await getToken();
        // Fetch up to 50 items
        const items = await getHistory(50, user.id, token || undefined);
        setHistory(items);
      } catch (err) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    const lowerQuery = searchQuery.toLowerCase();
    return history.filter((item) =>
      item.job_text.toLowerCase().includes(lowerQuery),
    );
  }, [history, searchQuery]);

  const handleHistoryClick = (item: HistoryItem) => {
    // Navigate to results with the stored summary data
    // Note: Detailed breakdown is not available in list summary
    navigate("/results", {
      state: {
        jobText: item.job_text,
        apiResult: {
          true_score: item.true_score,
          risk_level: item.risk_level,
          breakdown: {
            authenticity: 0,
            hiring_activity: 0,
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
    const config =
      {
        safe: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        caution:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      }[level] || "bg-gray-100 text-gray-700";

    return config;
  };

  return (
    <PageWrapper>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md hover:bg-muted/50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Analysis History
          </h1>
          <p className="text-muted-foreground">Your recent job checks</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by keywords or skills..."
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            Found {filteredHistory.length} results for "{searchQuery}"
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleHistoryClick(item)}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              {/* Score Badge */}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRiskBadge(
                  item.risk_level,
                )}`}
              >
                {item.true_score}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {item.job_text.slice(0, 100)}...
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
          icon={searchQuery ? Search : Briefcase}
          title={searchQuery ? "No matches found" : "No history yet"}
          description={
            searchQuery
              ? `Try a different keyword than "${searchQuery}"`
              : "Analyze jobs to see them here"
          }
          actionLabel={searchQuery ? "Clear Search" : "Analyze Job"}
          onAction={searchQuery ? clearSearch : () => navigate("/analyze")}
        />
      )}
    </PageWrapper>
  );
}
