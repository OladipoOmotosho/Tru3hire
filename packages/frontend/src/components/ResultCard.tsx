import { Card } from "./ui/card";
import { CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

interface ResultCardProps {
  score: number;
  riskLevel: "safe" | "suspicious" | "high-risk";
}

export function ResultCard({ score, riskLevel }: ResultCardProps) {
  const getConfig = () => {
    if (riskLevel === "safe") {
      return {
        icon: <CheckCircle className="w-16 h-16" />,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Appears Safe",
        description: "This job posting shows minimal red flags based on our analysis."
      };
    } else if (riskLevel === "suspicious") {
      return {
        icon: <AlertTriangle className="w-16 h-16" />,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        label: "Suspicious",
        description: "This job posting has several warning signs. Proceed with caution."
      };
    } else {
      return {
        icon: <ShieldAlert className="w-16 h-16" />,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: "High Risk",
        description: "This job posting shows multiple indicators of a potential scam."
      };
    }
  };

  const config = getConfig();

  return (
    <Card className={`p-8 ${config.borderColor} ${config.bgColor}`}>
      <div className="flex flex-col items-center text-center">
        <div className={config.color}>
          {config.icon}
        </div>
        
        <h2 className={`mt-4 mb-2 ${config.color}`}>
          {config.label}
        </h2>
        
        <div className={`text-4xl mb-4 ${config.color}`}>
          {score}/100
        </div>
        
        <p className={`max-w-md ${config.color}`}>
          {config.description}
        </p>
      </div>
    </Card>
  );
}
