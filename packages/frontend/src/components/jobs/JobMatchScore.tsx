import { cn } from "@/lib/utils";

interface JobMatchScoreProps {
  score: number | null | undefined;
}

export function JobMatchScore({ score }: JobMatchScoreProps) {
  // If score is null/undefined, show dash. If 0, show 0%.
  const hasScore = score !== null && score !== undefined;
  const safeScore = score ?? 0;

  return (
    <span
      className={cn(
        "shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold",
        !hasScore
          ? "text-muted-foreground bg-muted"
          : safeScore >= 75
            ? "text-success-700 bg-success-50 dark:text-success-400 dark:bg-success-900/20"
            : safeScore >= 50
              ? "text-warning-700 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/20"
              : "text-error-700 bg-error-50 dark:text-error-400 dark:bg-error-900/20",
      )}
    >
      {hasScore ? `${safeScore}% Match` : "—"}
    </span>
  );
}
