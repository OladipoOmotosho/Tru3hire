import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Shield,
} from "lucide-react";
import { Card } from "./ui/card";
import type { CompanyInfo } from "../lib/api";

interface CompanyVerificationCardProps {
  company: CompanyInfo | null;
}

const statusConfig = {
  verified_legit: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
    label: "Verified Company",
    description: "This company is verified and well-known in our database.",
  },
  likely_legit: {
    icon: CheckCircle2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Likely Legitimate",
    description: "Positive user reports suggest this company is legitimate.",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
    borderColor: "border-gray-200 dark:border-gray-700",
    label: "Unknown Company",
    description: "We don't have enough data about this company yet.",
  },
  suspicious: {
    icon: AlertTriangle,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    label: "Suspicious",
    description: "Some reports suggest concerns about this company.",
  },
  known_scam: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-800",
    label: "Known Scam",
    description: "Multiple reports confirm this is a scam company.",
  },
};

export function CompanyVerificationCard({
  company,
}: CompanyVerificationCardProps) {
  if (!company || !company.company_name) {
    return null;
  }

  const config =
    statusConfig[company.status as keyof typeof statusConfig] ||
    statusConfig.unknown;
  const StatusIcon = config.icon;

  return (
    <Card className={`p-4 border-2 ${config.borderColor} ${config.bg}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Building2 className={`w-6 h-6 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">
              {company.company_name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>

          {/* Additional info */}
          {company.matched_name &&
            company.matched_name !== company.company_name && (
              <p className="text-xs text-muted-foreground mt-2">
                <Shield className="w-3 h-3 inline mr-1" />
                Matched to:{" "}
                <span className="font-medium">{company.matched_name}</span>
                {company.confidence < 1 && (
                  <span className="ml-1">
                    ({Math.round(company.confidence * 100)}% match)
                  </span>
                )}
              </p>
            )}
        </div>
      </div>
    </Card>
  );
}
