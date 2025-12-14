import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application, ApplicationStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Briefcase, Calendar, StickyNote } from "lucide-react";

// Mock data
const mockApplications: Application[] = [
  {
    id: "1",
    job: {
      id: "1",
      title: "Senior Software Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      description: "",
      requirements: [],
      postedDate: new Date().toISOString(),
      trueScore: 87,
      trueScoreMetrics: {
        authenticity: 90,
        hiringLikelihood: 85,
        biasAndFairness: 88,
        resumeMatch: 82,
        companyReputation: 90,
      },
      tags: [],
      isVerified: true,
      isFreshPosting: true,
      isDiversityFriendly: true,
      hasInsights: true,
    },
    status: "interview",
    appliedDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes: "Scheduled for technical interview next week",
  },
  {
    id: "2",
    job: {
      id: "2",
      title: "Frontend Developer",
      company: "StartupXYZ",
      location: "Remote",
      description: "",
      requirements: [],
      postedDate: new Date().toISOString(),
      trueScore: 72,
      trueScoreMetrics: {
        authenticity: 75,
        hiringLikelihood: 70,
        biasAndFairness: 80,
        resumeMatch: 68,
        companyReputation: 67,
      },
      tags: [],
      isVerified: false,
      isFreshPosting: true,
      isDiversityFriendly: true,
      hasInsights: false,
    },
    status: "applied",
    appliedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const statusColumns: ApplicationStatus[] = [
  "interested",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export function ApplicationTrackerPage() {
  const [applications, setApplications] =
    useState<Application[]>(mockApplications);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const getApplicationsByStatus = (status: ApplicationStatus) => {
    return applications.filter((app) => app.status === status);
  };

  const statusColors: Record<ApplicationStatus, string> = {
    interested: "bg-gray-100 border-gray-300",
    applied: "bg-blue-100 border-blue-300",
    interview: "bg-purple-100 border-purple-300",
    offer: "bg-green-100 border-green-300",
    rejected: "bg-red-100 border-red-300",
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    interested: "Interested",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-light mb-2">
                Application Tracker
              </h1>
              <p className="text-gray-600">
                Manage your job application pipeline
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statusColumns.map((status) => (
            <Card key={status} className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">
                {statusLabels[status]}
              </p>
              <p className="text-2xl font-bold text-gray-light">
                {getApplicationsByStatus(status).length}
              </p>
            </Card>
          ))}
        </div>

        {viewMode === "kanban" ? (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statusColumns.map((status) => (
              <div key={status} className="flex flex-col">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-light mb-2">
                    {statusLabels[status]}
                  </h3>
                  <div className="h-1 bg-gray-200 rounded">
                    <div
                      className={`h-full rounded ${
                        status === "interested"
                          ? "bg-gray-500"
                          : status === "applied"
                          ? "bg-blue-500"
                          : status === "interview"
                          ? "bg-purple-500"
                          : status === "offer"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${
                          (getApplicationsByStatus(status).length /
                            applications.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {getApplicationsByStatus(status).map((app) => (
                    <Card
                      key={app.id}
                      className={`p-4 cursor-move hover:shadow-lg transition-shadow border-l-4 ${statusColors[status]}`}
                    >
                      <h4 className="font-semibold text-gray-light mb-1">
                        {app.job.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {app.job.company}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          TrueScore: {app.job.trueScore}
                        </Badge>
                      </div>

                      {app.appliedDate && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(app.appliedDate)}
                        </p>
                      )}

                      {app.notes && (
                        <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                          <StickyNote className="w-3 h-3 mt-0.5" />
                          {app.notes}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      TrueScore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-light">
                          {app.job.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.job.company}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {statusLabels[app.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{app.job.trueScore}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.appliedDate ? formatDate(app.appliedDate) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {app.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add Application Button */}
        <div className="mt-6">
          <Button className="w-full">
            <Briefcase className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>
    </div>
  );
}
