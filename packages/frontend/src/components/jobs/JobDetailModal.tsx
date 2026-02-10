import { useState, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchJobPreview } from "@/lib/jobs-api";

/** Common fields both RankedJob and DiscoveredJob share. */
export interface JobDetailData {
  title: string;
  company: string;
  location: string;
  description: string;
  salary_display?: string;
  category?: string;
  days_ago: number;
  redirect_url: string;
}

interface JobDetailModalProps {
  job: JobDetailData;
  onClose: () => void;
  onApply?: () => void;
}

export function JobDetailModal({ job, onClose, onApply }: JobDetailModalProps) {
  const [fullDescription, setFullDescription] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Auto-fetch full description from URL when modal opens
  useEffect(() => {
    if (!job.redirect_url) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetchJobPreview(job.redirect_url)
      .then((preview) => {
        if (cancelled) return;
        if (preview.error) {
          setFetchError(preview.error);
        } else if (preview.description) {
          setFullDescription(preview.description);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFetchError("Could not load full description.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [job.redirect_url]);

  const postedLabel =
    job.days_ago === 0
      ? "Today"
      : job.days_ago === 1
        ? "Yesterday"
        : `${job.days_ago} days ago`;

  // Use the full scraped description if available, otherwise fall back to snippet
  const displayDescription = fullDescription || job.description;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Job details: ${job.title}`}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {job.company}
              </span>
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0 -mt-1 -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Meta tags row */}
          <div className="flex flex-wrap items-center gap-2">
            {job.salary_display && (
              <Badge
                variant="secondary"
                className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0"
              >
                {job.salary_display}
              </Badge>
            )}
            {job.category && (
              <Badge variant="outline" className="text-xs">
                <Briefcase className="w-3 h-3 mr-1" />
                {job.category}
              </Badge>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {postedLabel}
            </span>
          </div>

          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Description
            </h3>

            {loading && !fullDescription && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading full description...
              </div>
            )}

            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {displayDescription || "No description available."}
            </div>

            {fetchError && !fullDescription && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/70">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {fetchError}{" "}
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View full posting
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {(onApply || job.redirect_url) && (
            <Button
              onClick={() => {
                if (onApply) {
                  onApply();
                } else {
                  window.open(job.redirect_url, "_blank");
                }
              }}
              className="gap-1.5"
            >
              Apply
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
