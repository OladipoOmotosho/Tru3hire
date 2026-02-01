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
          : safeScore >= 70
            ? "text-success bg-success/10 dark:text-success/90"
            : safeScore >= 40
              ? "text-warning bg-warning/10 dark:text-warning/90"
              : "text-destructive bg-destructive/10 dark:text-destructive/90",
      )}
    >
      {hasScore ? `${safeScore}% Match` : "—"}
    </span>
  );
}
