import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { JobMatchScore } from "./JobMatchScore";

interface JobCardTagsProps {
  salaryText: string | null;
  jobType: string | undefined;
  isVerified: boolean;
  trueScore: number | null | undefined;
}

export function JobCardTags({
  salaryText,
  jobType,
  isVerified,
  trueScore,
}: JobCardTagsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {salaryText && (
          <Badge
            variant="secondary"
            className="text-[11px] px-2 py-0 h-5 font-normal bg-success/10 text-success dark:text-success/90 border-0"
          >
            {salaryText}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-[11px] px-2 py-0 h-5 font-normal border-border"
        >
          {jobType || "Full-time"}
        </Badge>
        {isVerified && (
          <Badge
            variant="outline"
            className="text-[11px] px-2 py-0 h-5 border-info/30 text-info dark:text-info/90"
          >
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            Verified
          </Badge>
        )}
      </div>
      <JobMatchScore score={trueScore} />
    </div>
  );
}
