import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TrueScoreGauge } from "./TrueScoreGauge";
import { JobPosting } from "@/lib/types";
import { cn, formatDate, formatSalary } from "@/lib/utils";
import { MapPin, Briefcase, Building2, Bookmark, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: JobPosting;
  onSave?: () => void;
  onApply?: () => void;
  isSaved?: boolean;
  className?: string;
}

export function JobCard({
  job,
  onSave,
  onApply,
  isSaved = false,
  className,
}: JobCardProps) {
  return (
    <Card
      className={cn(
        "p-6 hover:shadow-lg transition-shadow cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{job.company}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {job.isVerified && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified Employer
                  </Badge>
                )}
                {job.isFreshPosting && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Fresh Posting
                  </Badge>
                )}
                {job.isDiversityFriendly && (
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    Diversity Friendly
                  </Badge>
                )}
                {job.hasInsights && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Community Insights
                  </Badge>
                )}
              </div>

              {/* Job Details */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
                {job.jobType && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {job.jobType}
                  </div>
                )}
                {job.salary && (
                  <span className="font-medium text-gray-900">
                    {formatSalary(job.salary.min, job.salary.max)}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Posted {formatDate(job.postedDate)}
              </p>
            </div>

            {/* TrueScore */}
            <div className="flex-shrink-0">
              <TrueScoreGauge score={job.trueScore} size="sm" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={onApply} size="sm">
              Apply Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSave?.();
              }}
            >
              <Bookmark
                className={cn("w-4 h-4", isSaved && "fill-current")}
              />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
