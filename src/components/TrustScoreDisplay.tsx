import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

interface TrustScoreDisplayProps {
  score: number;
  riskLevel: "safe" | "suspicious" | "high-risk";
  summary: string;
}

export function TrustScoreDisplay({ score, riskLevel, summary }: TrustScoreDisplayProps) {
  const getScoreColor = () => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (score >= 70) return "bg-green-600";
    if (score >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getBorderColor = () => {
    if (score >= 70) return "border-green-200";
    if (score >= 40) return "border-yellow-200";
    return "border-red-200";
  };

  const getBgColor = () => {
    if (score >= 70) return "bg-green-50";
    if (score >= 40) return "bg-yellow-50";
    return "bg-red-50";
  };

  const getIcon = () => {
    if (score >= 70) return <CheckCircle className="w-12 h-12 text-green-600" />;
    if (score >= 40) return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
    return <ShieldAlert className="w-12 h-12 text-red-600" />;
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case "safe":
        return "Appears Safe";
      case "suspicious":
        return "Suspicious";
      case "high-risk":
        return "High Risk";
    }
  };

  return (
    <Card className={`p-8 ${getBorderColor()} ${getBgColor()}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <h3 className={getScoreColor()}>Trust Score: {score}/100</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${
                riskLevel === "safe" ? "bg-green-200 text-green-800" :
                riskLevel === "suspicious" ? "bg-yellow-200 text-yellow-800" :
                "bg-red-200 text-red-800"
              }`}>
                {getRiskLabel()}
              </span>
            </div>
            
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${getProgressColor()}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <p className={`${
            riskLevel === "safe" ? "text-green-800" :
            riskLevel === "suspicious" ? "text-yellow-800" :
            "text-red-800"
          }`}>
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
