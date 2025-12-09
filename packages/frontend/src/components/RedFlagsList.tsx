import { Card } from "./ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface RedFlagsListProps {
  redFlags: RedFlag[];
}

export function RedFlagsList({ redFlags }: RedFlagsListProps) {
  const getSeverityConfig = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          badgeColor: "bg-red-200 text-red-800"
        };
      case "medium":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          badgeColor: "bg-yellow-200 text-yellow-800"
        };
      case "low":
        return {
          icon: <Info className="w-5 h-5 text-blue-600" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-800",
          badgeColor: "bg-blue-200 text-blue-800"
        };
    }
  };

  // Sort by severity
  const sortedFlags = [...redFlags].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <Card className="p-6">
      <h3 className="mb-6">Detected Warning Signs ({redFlags.length})</h3>
      
      <div className="space-y-4">
        {sortedFlags.map((flag) => {
          const config = getSeverityConfig(flag.severity);
          
          return (
            <div
              key={flag.id}
              className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className={config.textColor}>{flag.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs uppercase ${config.badgeColor}`}>
                      {flag.severity} risk
                    </span>
                  </div>
                  <p className={`text-sm ${config.textColor}`}>
                    {flag.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          <strong>Remember:</strong> These are automated indicators based on common scam patterns. 
          Always conduct your own research and trust your instincts. If something feels wrong, it probably is.
        </p>
      </div>
    </Card>
  );
}
