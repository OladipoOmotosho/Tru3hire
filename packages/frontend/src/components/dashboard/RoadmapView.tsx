import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  BookOpen,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Initial types based on backend structure
export type StepStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "skipped";

export interface CredentialStep {
  id: string;
  label: string;
  type: string;
  description: string;
  required: boolean;
  status: StepStatus;
  resources?: { name: string; url: string }[];
}

export interface Pathway {
  id: string;
  title: string;
  province: string;
  regulator: string;
  steps: CredentialStep[];
  overallStatus: "not_started" | "in_progress" | "eligible" | "licensed";
}

interface RoadmapViewProps {
  pathway: Pathway;
  className?: string;
}

export function RoadmapView({ pathway, className }: RoadmapViewProps) {
  const [selectedStep, setSelectedStep] = useState<CredentialStep | null>(null);

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "in_progress":
      case "available":
        return "bg-yellow-400 text-white border-yellow-400 animate-pulse-subtle"; // Custom animation class needed
      case "locked":
        return "bg-gray-100 text-gray-400 border-gray-200";
      case "skipped":
        return "bg-gray-200 text-gray-500 border-gray-300";
      default:
        return "bg-gray-100 text-gray-400";
    }
  };

  const getIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "locked":
        return <Lock className="w-4 h-4" />;
      case "available":
        return <div className="w-3 h-3 bg-white rounded-full" />; // Dot inside
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <Card className={cn("w-full relative", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {pathway.title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Regulated by {pathway.regulator} • {pathway.province}
            </p>
          </div>
          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100 uppercase tracking-wide">
            {pathway.overallStatus.replace("_", " ")}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metro Map Visualization */}
        <div className="relative py-8 overflow-x-auto">
          {/* Connecting Line (Horizontal) */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />

          <div className="relative z-10 flex justify-between items-center min-w-[600px] px-4">
            {pathway.steps.map((step, index) => {
              const isLast = index === pathway.steps.length - 1;
              const isActive =
                step.status === "available" || step.status === "in_progress";

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center gap-3 relative group"
                >
                  {/* Node */}
                  <button
                    onClick={() => setSelectedStep(step)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative z-20 shadow-sm hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      getStatusColor(step.status),
                      isActive && "ring-4 ring-yellow-100 scale-110",
                    )}
                  >
                    {getIcon(step.status)}
                  </button>

                  {/* Label */}
                  <div className="text-center w-32">
                    <p
                      className={cn(
                        "text-xs font-semibold mb-0.5",
                        isActive ? "text-gray-900" : "text-gray-500",
                        step.status === "completed" && "text-green-700",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">
                      {step.type}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Area / Legend */}
        <div className="mt-8 flex gap-6 text-xs text-gray-500 justify-center border-t pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-yellow-400" />{" "}
            Next Step
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" /> Locked
          </div>
        </div>
      </CardContent>

      {/* Simple Custom Modal Overlay */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {selectedStep.label}
                  {selectedStep.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </h3>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mt-1">
                  {selectedStep.type} Step
                </p>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed border border-gray-100">
                {selectedStep.description}
              </div>

              {selectedStep.resources && selectedStep.resources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Resources
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedStep.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {res.name} <ArrowRight className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedStep.status === "available" && (
                <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md flex gap-3 text-sm text-yellow-800 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>
                    This is your current recommended step. Completing this
                    unlocks the next stage.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-2 border-t">
              <Button variant="outline" onClick={() => setSelectedStep(null)}>
                Close
              </Button>
              {selectedStep.status === "available" && (
                <Button>Mark as Started</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
